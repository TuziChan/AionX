use crate::error::{AppError, Result};
use super::traits::AgentBackend;
use super::types::*;
use futures::StreamExt;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

/// Gemini Agent — 通过 Google Gemini HTTP API 通信
/// 使用 SSE (Server-Sent Events) 实现流式响应
pub struct GeminiAgent {
    status: Arc<RwLock<AgentStatus>>,
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
}

impl GeminiAgent {
    pub fn new() -> Self {
        Self {
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            cancel_tx: Arc::new(RwLock::new(None)),
            config: None,
        }
    }

    /// 检测 Gemini API 是否可用（检查环境变量中的 API key）
    pub fn detect_available() -> DetectedAgent {
        let api_key = std::env::var("GEMINI_API_KEY")
            .or_else(|_| std::env::var("GOOGLE_API_KEY"))
            .ok();

        DetectedAgent {
            agent_type: "gemini".to_string(),
            name: "Google Gemini".to_string(),
            command: "http-api".to_string(),
            version: Some("v1".to_string()),
            available: api_key.is_some(),
        }
    }

    fn get_api_key(config: &AgentConfig) -> Result<String> {
        // 优先从 config.env 中获取
        if let Some(env) = &config.env {
            if let Some(key) = env.get("GEMINI_API_KEY").or_else(|| env.get("GOOGLE_API_KEY")) {
                return Ok(key.clone());
            }
        }
        // 其次从环境变量获取
        std::env::var("GEMINI_API_KEY")
            .or_else(|_| std::env::var("GOOGLE_API_KEY"))
            .map_err(|_| AppError::Agent("GEMINI_API_KEY not set".into()))
    }

    /// 解析 SSE data line 为 AgentEvent
    fn parse_sse_data(data: &str, msg_id: &str) -> Option<AgentEvent> {
        let v: serde_json::Value = serde_json::from_str(data).ok()?;

        // Gemini generateContent stream response
        if let Some(candidates) = v.get("candidates").and_then(|c| c.as_array()) {
            if let Some(candidate) = candidates.first() {
                if let Some(content) = candidate.get("content") {
                    if let Some(parts) = content.get("parts").and_then(|p| p.as_array()) {
                        for part in parts {
                            if let Some(text) = part.get("text").and_then(|t| t.as_str()) {
                                return Some(AgentEvent::MessageDelta {
                                    msg_id: msg_id.to_string(),
                                    content: text.to_string(),
                                });
                            }
                            // Function call
                            if let Some(fc) = part.get("functionCall") {
                                let name = fc.get("name")
                                    .and_then(|n| n.as_str())
                                    .unwrap_or("unknown")
                                    .to_string();
                                let args = fc.get("args").cloned()
                                    .unwrap_or(serde_json::Value::Null);
                                return Some(AgentEvent::ToolCallStart {
                                    msg_id: msg_id.to_string(),
                                    tool: name,
                                    input: args,
                                });
                            }
                        }
                    }
                }
                // Check finish reason
                if let Some(reason) = candidate.get("finishReason").and_then(|r| r.as_str()) {
                    if reason == "STOP" || reason == "MAX_TOKENS" {
                        return Some(AgentEvent::MessageComplete {
                            msg_id: msg_id.to_string(),
                        });
                    }
                }
            }
        }

        // Error response
        if let Some(error) = v.get("error") {
            let msg = error.get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("Gemini API error")
                .to_string();
            return Some(AgentEvent::Error { message: msg });
        }

        None
    }
}

#[async_trait::async_trait]
impl AgentBackend for GeminiAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        // 验证 API key 存在
        Self::get_api_key(config)?;
        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;
        tracing::info!("Gemini agent verified and ready");
        Ok(())
    }

    async fn send_message(
        &self,
        _chat_id: &str,
        message: &str,
        _files: Option<Vec<FileAttachment>>,
        tx: mpsc::Sender<AgentEvent>,
    ) -> Result<()> {
        let config = self.config.as_ref().ok_or_else(|| {
            AppError::Agent("Gemini agent not configured".into())
        })?;
        let api_key = Self::get_api_key(config)?;

        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let msg_id = uuid::Uuid::new_v4().to_string();
        let _ = tx.send(AgentEvent::MessageStart { msg_id: msg_id.clone() }).await;

        let model = config.command.as_deref().unwrap_or("gemini-2.5-flash");
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent?alt=sse&key={}",
            model, api_key
        );

        let body = serde_json::json!({
            "contents": [{
                "parts": [{ "text": message }]
            }]
        });

        let client = reqwest::Client::new();
        let response = client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Network(format!("Gemini API request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            let _ = tx.send(AgentEvent::Error {
                message: format!("Gemini API error {}: {}", status, text),
            }).await;
            *self.status.write().await = AgentStatus::Error;
            return Ok(());
        }

        // 设置取消通道
        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();
        let mid = msg_id.clone();

        tokio::spawn(async move {
            let mut stream = response.bytes_stream();
            let mut buffer = String::new();

            let timeout = tokio::time::Duration::from_secs(300);
            let result = tokio::time::timeout(timeout, async {
                loop {
                    tokio::select! {
                        chunk = stream.next() => {
                            match chunk {
                                Some(Ok(bytes)) => {
                                    buffer.push_str(&String::from_utf8_lossy(&bytes));
                                    // 处理完整行
                                    while let Some(pos) = buffer.find('\n') {
                                        let line = buffer[..pos].trim().to_string();
                                        buffer = buffer[pos + 1..].to_string();
                                        // SSE format: "data: {...}"
                                        if let Some(data) = line.strip_prefix("data: ") {
                                            if let Some(event) = GeminiAgent::parse_sse_data(data, &mid) {
                                                if tx.send(event).await.is_err() { return; }
                                            }
                                        }
                                    }
                                }
                                Some(Err(e)) => {
                                    let _ = tx.send(AgentEvent::Error {
                                        message: format!("Stream error: {}", e),
                                    }).await;
                                    break;
                                }
                                None => break,
                            }
                        }
                        _ = &mut cancel_rx => {
                            tracing::info!("Gemini task cancelled");
                            break;
                        }
                    }
                }
            }).await;

            if result.is_err() {
                let _ = tx.send(AgentEvent::Error {
                    message: "Gemini response timed out".to_string(),
                }).await;
            }

            let _ = tx.send(AgentEvent::MessageComplete { msg_id: mid }).await;
            *status.write().await = AgentStatus::Idle;
            let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Idle }).await;
        });

        Ok(())
    }

    async fn stop(&self, _chat_id: &str) -> Result<()> {
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        *self.status.write().await = AgentStatus::Idle;
        Ok(())
    }

    async fn handle_permission(
        &self,
        _chat_id: &str,
        _request_id: &str,
        _approved: bool,
    ) -> Result<()> {
        // Gemini 不需要权限处理
        Ok(())
    }

    fn status(&self) -> AgentStatus {
        futures::executor::block_on(async {
            self.status.read().await.clone()
        })
    }

    async fn shutdown(&mut self) -> Result<()> {
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        *self.status.write().await = AgentStatus::Disconnected;
        Ok(())
    }
}
