use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::sync::{mpsc, RwLock};

/// ACP Agent — Claude Code / Codebuddy 子进程通信
///
/// 协议参考：Claude Code `--output-format stream-json` NDJSON 格式
/// 事件类型：system(init) → assistant/user(message) → stream_event(delta) → result(success/error)
/// 参考：https://takopi.dev/reference/runners/claude/stream-json-cheatsheet/
pub struct AcpAgent {
    process_manager: Arc<ProcessManager>,
    status: Arc<RwLock<AgentStatus>>,
    active_stdin: Arc<RwLock<Option<tokio::process::ChildStdin>>>,
    active_process_id: Arc<RwLock<Option<String>>>,
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
}

impl AcpAgent {
    pub fn new(process_manager: Arc<ProcessManager>) -> Self {
        Self {
            process_manager,
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            active_stdin: Arc::new(RwLock::new(None)),
            active_process_id: Arc::new(RwLock::new(None)),
            cancel_tx: Arc::new(RwLock::new(None)),
            config: None,
        }
    }

    pub async fn detect_available() -> Vec<DetectedAgent> {
        let candidates = vec![
            ("claude", "Claude Code"),
            ("codebuddy", "CodeBuddy"),
        ];

        let mut result = Vec::new();
        for (cmd, name) in candidates {
            let output = tokio::process::Command::new(cmd)
                .arg("--version")
                .output()
                .await
                .ok();

            let available = output.as_ref().map(|o| o.status.success()).unwrap_or(false);
            let version = output
                .and_then(|o| String::from_utf8(o.stdout).ok())
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty());

            result.push(DetectedAgent {
                agent_type: "acp".to_string(),
                name: name.to_string(),
                command: cmd.to_string(),
                version,
                available,
            });
        }
        result
    }

    /// 解析 Claude Code stream-json NDJSON 行
    ///
    /// 官方事件格式：
    /// - `{"type":"system","subtype":"init",...}` — 会话初始化
    /// - `{"type":"assistant","message":{"id":"msg_1","content":[{"type":"text","text":"..."}]}}` — 助手消息
    /// - `{"type":"stream_event","event":{"delta":{"type":"text_delta","text":"..."}}}` — 流式文本增量
    /// - `{"type":"user","message":{"content":[{"type":"tool_result",...}]}}` — 工具结果
    /// - `{"type":"result","subtype":"success","result":"..."}` — 完成
    /// - `{"type":"result","subtype":"error","error":"..."}` — 错误
    fn parse_line(line: &str, ctx: &mut StreamContext) -> Vec<AgentEvent> {
        let v: serde_json::Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => return vec![],
        };

        let event_type = match v.get("type").and_then(|t| t.as_str()) {
            Some(t) => t,
            None => return vec![],
        };

        let mut events = Vec::new();

        match event_type {
            // 会话初始化
            "system" => {
                if let Some(session_id) = v.get("session_id").and_then(|s| s.as_str()) {
                    ctx.session_id = session_id.to_string();
                }
                // system init 不产生前端事件
            }

            // 助手消息（完整消息或包含工具调用）
            "assistant" => {
                if let Some(message) = v.get("message") {
                    let msg_id = message.get("id")
                        .and_then(|id| id.as_str())
                        .unwrap_or("")
                        .to_string();

                    if !msg_id.is_empty() && msg_id != ctx.current_msg_id {
                        ctx.current_msg_id = msg_id.clone();
                        events.push(AgentEvent::MessageStart { msg_id: msg_id.clone() });
                    }

                    // 解析 content 数组
                    if let Some(content) = message.get("content").and_then(|c| c.as_array()) {
                        for block in content {
                            let block_type = block.get("type").and_then(|t| t.as_str()).unwrap_or("");
                            match block_type {
                                "text" => {
                                    if let Some(text) = block.get("text").and_then(|t| t.as_str()) {
                                        events.push(AgentEvent::MessageDelta {
                                            msg_id: ctx.current_msg_id.clone(),
                                            content: text.to_string(),
                                        });
                                    }
                                }
                                "tool_use" => {
                                    let tool_name = block.get("name")
                                        .and_then(|n| n.as_str())
                                        .unwrap_or("unknown")
                                        .to_string();
                                    let input = block.get("input")
                                        .cloned()
                                        .unwrap_or(serde_json::Value::Null);
                                    events.push(AgentEvent::ToolCallStart {
                                        msg_id: ctx.current_msg_id.clone(),
                                        tool: tool_name,
                                        input,
                                    });
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }

            // 用户消息（通常是工具结果）
            "user" => {
                if let Some(message) = v.get("message") {
                    if let Some(content) = message.get("content").and_then(|c| c.as_array()) {
                        for block in content {
                            let block_type = block.get("type").and_then(|t| t.as_str()).unwrap_or("");
                            if block_type == "tool_result" {
                                let tool_use_id = block.get("tool_use_id")
                                    .and_then(|id| id.as_str())
                                    .unwrap_or("")
                                    .to_string();
                                // tool_result content 可以是 string 或 array
                                let output = block.get("content")
                                    .cloned()
                                    .unwrap_or(serde_json::Value::Null);
                                events.push(AgentEvent::ToolCallResult {
                                    msg_id: ctx.current_msg_id.clone(),
                                    tool: tool_use_id,
                                    output,
                                });
                            }
                        }
                    }
                }
            }

            // 流式增量事件（需要 --verbose --include-partial-messages）
            "stream_event" => {
                if let Some(event) = v.get("event") {
                    if let Some(delta) = event.get("delta") {
                        let delta_type = delta.get("type").and_then(|t| t.as_str()).unwrap_or("");
                        match delta_type {
                            "text_delta" => {
                                if let Some(text) = delta.get("text").and_then(|t| t.as_str()) {
                                    events.push(AgentEvent::MessageDelta {
                                        msg_id: ctx.current_msg_id.clone(),
                                        content: text.to_string(),
                                    });
                                }
                            }
                            "input_json_delta" => {
                                // 工具输入的流式增量（可选处理）
                            }
                            _ => {}
                        }
                    }
                }
            }

            // 结果（完成或错误）
            "result" => {
                let subtype = v.get("subtype").and_then(|s| s.as_str()).unwrap_or("");
                match subtype {
                    "success" | "completion" => {
                        // result 字段包含最终文本
                        if let Some(result_text) = v.get("result").and_then(|r| r.as_str()) {
                            if !result_text.is_empty() && ctx.current_msg_id.is_empty() {
                                // 如果没有流式消息，直接发送完整内容
                                events.push(AgentEvent::MessageDelta {
                                    msg_id: "result".to_string(),
                                    content: result_text.to_string(),
                                });
                            }
                        }
                        events.push(AgentEvent::MessageComplete {
                            msg_id: ctx.current_msg_id.clone(),
                        });
                    }
                    "error" => {
                        let error_msg = v.get("error")
                            .or_else(|| v.get("result"))
                            .and_then(|e| e.as_str())
                            .unwrap_or("Unknown error")
                            .to_string();
                        events.push(AgentEvent::Error { message: error_msg });
                    }
                    _ => {
                        events.push(AgentEvent::MessageComplete {
                            msg_id: ctx.current_msg_id.clone(),
                        });
                    }
                }
            }

            _ => {}
        }

        events
    }
}

/// 流式解析上下文
struct StreamContext {
    session_id: String,
    current_msg_id: String,
}

#[async_trait::async_trait]
impl AgentBackend for AcpAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        let command = config.command.as_deref().unwrap_or("claude");

        let output = tokio::process::Command::new(command)
            .arg("--version")
            .output()
            .await
            .map_err(|e| AppError::Agent(format!(
                "ACP command '{}' not found: {}", command, e
            )))?;

        if !output.status.success() {
            return Err(AppError::Agent(format!(
                "ACP command '{}' returned error", command
            )));
        }

        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;

        let version = String::from_utf8_lossy(&output.stdout);
        tracing::info!(command = command, version = %version.trim(), "ACP agent verified");
        Ok(())
    }

    async fn send_message(
        &self,
        chat_id: &str,
        message: &str,
        _files: Option<Vec<FileAttachment>>,
        tx: mpsc::Sender<AgentEvent>,
    ) -> Result<()> {
        let config = self.config.as_ref().ok_or_else(|| {
            AppError::Agent("Agent not configured".into())
        })?;

        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let command = config.command.as_deref().unwrap_or("claude");
        let process_id = format!("acp-{}-{}", chat_id, uuid::Uuid::new_v4());

        // Claude Code 官方参数：-p (print mode) + stream-json + verbose
        let mut args: Vec<String> = vec![
            "-p".to_string(),
            message.to_string(),
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
        ];
        if let Some(ref extra_args) = config.args {
            args.extend(extra_args.clone());
        }

        let (stdin, stdout) = self.process_manager.spawn(
            &process_id,
            command,
            &args,
            config.env.as_ref(),
            config.working_dir.as_deref(),
        ).await?;

        *self.active_stdin.write().await = Some(stdin);
        *self.active_process_id.write().await = Some(process_id.clone());

        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();
        let pm = self.process_manager.clone();
        let pid = process_id;
        let active_stdin = self.active_stdin.clone();
        let active_pid = self.active_process_id.clone();

        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            let mut ctx = StreamContext {
                session_id: String::new(),
                current_msg_id: String::new(),
            };

            let timeout = tokio::time::Duration::from_secs(600);
            let result = tokio::time::timeout(timeout, async {
                loop {
                    tokio::select! {
                        line = lines.next_line() => {
                            match line {
                                Ok(Some(text)) => {
                                    for event in AcpAgent::parse_line(&text, &mut ctx) {
                                        if tx.send(event).await.is_err() { return; }
                                    }
                                }
                                Ok(None) => break,
                                Err(e) => {
                                    let _ = tx.send(AgentEvent::Error {
                                        message: format!("Read error: {}", e),
                                    }).await;
                                    break;
                                }
                            }
                        }
                        _ = &mut cancel_rx => {
                            tracing::info!("ACP task cancelled");
                            break;
                        }
                    }
                }
            }).await;

            if result.is_err() {
                let _ = tx.send(AgentEvent::Error {
                    message: "ACP response timed out (10 minutes)".to_string(),
                }).await;
            }

            pm.kill(&pid).await.ok();
            *status.write().await = AgentStatus::Idle;
            *active_stdin.write().await = None;
            *active_pid.write().await = None;
            let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Idle }).await;
        });

        Ok(())
    }

    async fn stop(&self, _chat_id: &str) -> Result<()> {
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        if let Some(ref pid) = *self.active_process_id.read().await {
            self.process_manager.kill(pid).await.ok();
        }
        *self.status.write().await = AgentStatus::Idle;
        *self.active_stdin.write().await = None;
        *self.active_process_id.write().await = None;
        tracing::info!("ACP agent stopped");
        Ok(())
    }

    async fn handle_permission(
        &self,
        _chat_id: &str,
        request_id: &str,
        approved: bool,
    ) -> Result<()> {
        if self.active_process_id.read().await.is_none() {
            return Err(AppError::Agent("No active agent process".into()));
        }

        let response = serde_json::json!({
            "type": "permission_response",
            "id": request_id,
            "approved": approved,
        });

        let mut stdin_guard = self.active_stdin.write().await;
        let stdin = stdin_guard.as_mut().ok_or_else(|| {
            AppError::Agent("Agent stdin not available".into())
        })?;

        let msg = serde_json::to_string(&response)? + "\n";
        stdin.write_all(msg.as_bytes()).await.map_err(|e| {
            AppError::Agent(format!("Failed to write permission response: {}", e))
        })?;
        stdin.flush().await.map_err(|e| {
            AppError::Agent(format!("Failed to flush stdin: {}", e))
        })?;

        tracing::info!(request_id = request_id, approved = approved, "Permission response sent");
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
        if let Some(ref pid) = *self.active_process_id.read().await {
            self.process_manager.kill(pid).await.ok();
        }
        *self.status.write().await = AgentStatus::Disconnected;
        *self.active_stdin.write().await = None;
        *self.active_process_id.write().await = None;
        tracing::info!("ACP agent shut down");
        Ok(())
    }
}
