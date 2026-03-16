use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::sync::{mpsc, RwLock};

/// 通用子进程 Agent — Codex、Nanobot、OpenClaw 共用
/// 通过子进程 stdin/stdout JSON 通信，与 ACP 模式类似
pub struct SubprocessAgent {
    agent_name: String,
    process_manager: Arc<ProcessManager>,
    status: Arc<RwLock<AgentStatus>>,
    active_stdin: Arc<RwLock<Option<tokio::process::ChildStdin>>>,
    active_process_id: Arc<RwLock<Option<String>>>,
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
    /// 默认命令名
    default_command: String,
    /// 默认参数
    default_args: Vec<String>,
}

impl SubprocessAgent {
    pub fn new(
        agent_name: &str,
        default_command: &str,
        default_args: Vec<String>,
        process_manager: Arc<ProcessManager>,
    ) -> Self {
        Self {
            agent_name: agent_name.to_string(),
            process_manager,
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            active_stdin: Arc::new(RwLock::new(None)),
            active_process_id: Arc::new(RwLock::new(None)),
            cancel_tx: Arc::new(RwLock::new(None)),
            config: None,
            default_command: default_command.to_string(),
            default_args,
        }
    }

    /// 创建 Codex Agent
    pub fn codex(pm: Arc<ProcessManager>) -> Self {
        Self::new("Codex", "codex", vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
        ], pm)
    }

    /// 创建 Nanobot Agent
    pub fn nanobot(pm: Arc<ProcessManager>) -> Self {
        Self::new("Nanobot", "nanobot", vec![
            "--output-format".to_string(),
            "json".to_string(),
        ], pm)
    }

    /// 创建 OpenClaw Agent
    pub fn openclaw(pm: Arc<ProcessManager>) -> Self {
        Self::new("OpenClaw", "openclaw", vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
        ], pm)
    }

    /// 检测命令是否可用
    pub async fn detect(command: &str, name: &str, agent_type: &str) -> DetectedAgent {
        let output = tokio::process::Command::new(command)
            .arg("--version")
            .output()
            .await
            .ok();

        let available = output.as_ref().map(|o| o.status.success()).unwrap_or(false);
        let version = output
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        DetectedAgent {
            agent_type: agent_type.to_string(),
            name: name.to_string(),
            command: command.to_string(),
            version,
            available,
        }
    }

    /// 解析 stdout JSON 行
    fn parse_line(line: &str, current_msg_id: &mut String) -> Option<AgentEvent> {
        let v: serde_json::Value = serde_json::from_str(line).ok()?;
        let event_type = v.get("type")?.as_str()?;

        match event_type {
            "assistant" | "message_start" | "message" => {
                let msg_id = v.get("message")
                    .and_then(|m| m.get("id"))
                    .or_else(|| v.get("id"))
                    .and_then(|id| id.as_str())
                    .unwrap_or("")
                    .to_string();
                if !msg_id.is_empty() {
                    *current_msg_id = msg_id.clone();
                }

                // 检查是否带 content
                if let Some(text) = v.get("content")
                    .and_then(|c| c.as_str())
                    .or_else(|| v.get("text").and_then(|t| t.as_str()))
                {
                    return Some(AgentEvent::MessageDelta {
                        msg_id: current_msg_id.clone(),
                        content: text.to_string(),
                    });
                }

                Some(AgentEvent::MessageStart { msg_id: current_msg_id.clone() })
            }
            "content_block_delta" | "delta" | "chunk" => {
                let delta = v.get("delta")
                    .and_then(|d| d.get("text").or(Some(d)))
                    .and_then(|t| t.as_str())
                    .or_else(|| v.get("text").and_then(|t| t.as_str()))
                    .unwrap_or("")
                    .to_string();
                if delta.is_empty() { return None; }
                Some(AgentEvent::MessageDelta {
                    msg_id: current_msg_id.clone(),
                    content: delta,
                })
            }
            "result" | "message_stop" | "done" => {
                Some(AgentEvent::MessageComplete {
                    msg_id: current_msg_id.clone(),
                })
            }
            "tool_use" | "tool_call" => {
                let tool = v.get("name")
                    .or_else(|| v.get("tool"))
                    .and_then(|n| n.as_str())
                    .unwrap_or("unknown")
                    .to_string();
                let input = v.get("input").cloned().unwrap_or(serde_json::Value::Null);
                Some(AgentEvent::ToolCallStart {
                    msg_id: current_msg_id.clone(),
                    tool,
                    input,
                })
            }
            "tool_result" => {
                let tool = v.get("tool").and_then(|n| n.as_str()).unwrap_or("unknown").to_string();
                let output = v.get("output").cloned().unwrap_or(serde_json::Value::Null);
                Some(AgentEvent::ToolCallResult {
                    msg_id: current_msg_id.clone(),
                    tool,
                    output,
                })
            }
            "permission" | "permission_request" => {
                let id = v.get("id").and_then(|i| i.as_str()).unwrap_or("").to_string();
                let desc = v.get("description")
                    .or_else(|| v.get("message"))
                    .and_then(|d| d.as_str())
                    .unwrap_or("")
                    .to_string();
                Some(AgentEvent::PermissionRequest { id, description: desc })
            }
            "error" => {
                let msg = v.get("message")
                    .or_else(|| v.get("error"))
                    .and_then(|m| m.as_str())
                    .unwrap_or("Unknown error")
                    .to_string();
                Some(AgentEvent::Error { message: msg })
            }
            _ => None,
        }
    }
}

#[async_trait::async_trait]
impl AgentBackend for SubprocessAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        let command = config.command.as_deref().unwrap_or(&self.default_command);

        let output = tokio::process::Command::new(command)
            .arg("--version")
            .output()
            .await
            .map_err(|e| AppError::Agent(format!(
                "{} command '{}' not found: {}", self.agent_name, command, e
            )))?;

        if !output.status.success() {
            return Err(AppError::Agent(format!(
                "{} command '{}' returned error", self.agent_name, command
            )));
        }

        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;

        let version = String::from_utf8_lossy(&output.stdout);
        tracing::info!(
            agent = %self.agent_name, command = command, version = %version.trim(),
            "Agent verified and ready"
        );
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
            AppError::Agent(format!("{} agent not configured", self.agent_name))
        })?;

        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let command = config.command.as_deref().unwrap_or(&self.default_command);
        let process_id = format!("{}-{}-{}", self.agent_name.to_lowercase(), chat_id, uuid::Uuid::new_v4());

        let mut args = self.default_args.clone();
        args.extend(["-p".to_string(), message.to_string()]);
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
            let mut current_msg_id = String::new();

            let timeout = tokio::time::Duration::from_secs(600);
            let result = tokio::time::timeout(timeout, async {
                loop {
                    tokio::select! {
                        line = lines.next_line() => {
                            match line {
                                Ok(Some(text)) => {
                                    if let Some(event) = SubprocessAgent::parse_line(&text, &mut current_msg_id) {
                                        if tx.send(event).await.is_err() { break; }
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
                        _ = &mut cancel_rx => break,
                    }
                }
            }).await;

            if result.is_err() {
                let _ = tx.send(AgentEvent::Error {
                    message: "Agent response timed out (10 minutes)".to_string(),
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
        Ok(())
    }

    async fn handle_permission(
        &self,
        _chat_id: &str,
        request_id: &str,
        approved: bool,
    ) -> Result<()> {
        if self.active_process_id.read().await.is_none() {
            return Err(AppError::Agent("No active process".into()));
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
            AppError::Agent(format!("Failed to write: {}", e))
        })?;
        stdin.flush().await.map_err(|e| {
            AppError::Agent(format!("Failed to flush: {}", e))
        })?;

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
        Ok(())
    }
}
