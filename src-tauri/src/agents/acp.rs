use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::sync::{mpsc, RwLock};

/// 流式会话上下文：跟踪当前 msg_id
struct StreamContext {
    current_msg_id: String,
}

/// ACP (Anthropic Claude Protocol) Agent
/// 通过子进程与 Claude Code / Codebuddy 等工具通信
pub struct AcpAgent {
    process_manager: Arc<ProcessManager>,
    status: Arc<RwLock<AgentStatus>>,
    /// 当前活跃进程的 stdin（用于权限响应）
    active_stdin: Arc<RwLock<Option<tokio::process::ChildStdin>>>,
    /// 当前活跃进程 ID
    active_process_id: Arc<RwLock<Option<String>>>,
    /// 取消正在运行的任务
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

    /// 检测系统中可用的 ACP 兼容工具
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

    /// 解析 stdout 的一行 JSON，转换为 AgentEvent
    fn parse_line(line: &str, ctx: &mut StreamContext) -> Option<AgentEvent> {
        let v: serde_json::Value = serde_json::from_str(line).ok()?;
        let event_type = v.get("type")?.as_str()?;

        match event_type {
            "assistant" | "message_start" => {
                let msg_id = v.get("message")
                    .and_then(|m| m.get("id"))
                    .and_then(|id| id.as_str())
                    .unwrap_or("")
                    .to_string();
                if !msg_id.is_empty() {
                    ctx.current_msg_id = msg_id.clone();
                }
                Some(AgentEvent::MessageStart { msg_id })
            }
            "content_block_delta" => {
                let delta = v.get("delta")
                    .and_then(|d| d.get("text"))
                    .and_then(|t| t.as_str())
                    .unwrap_or("")
                    .to_string();
                if delta.is_empty() {
                    return None;
                }
                Some(AgentEvent::MessageDelta {
                    msg_id: ctx.current_msg_id.clone(),
                    content: delta,
                })
            }
            "result" | "message_stop" => {
                Some(AgentEvent::MessageComplete {
                    msg_id: ctx.current_msg_id.clone(),
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
                    msg_id: ctx.current_msg_id.clone(),
                    tool,
                    input,
                })
            }
            "tool_result" => {
                let tool = v.get("tool")
                    .and_then(|n| n.as_str())
                    .unwrap_or("unknown")
                    .to_string();
                let output = v.get("output").cloned().unwrap_or(serde_json::Value::Null);
                Some(AgentEvent::ToolCallResult {
                    msg_id: ctx.current_msg_id.clone(),
                    tool,
                    output,
                })
            }
            "permission" | "permission_request" => {
                let id = v.get("id")
                    .and_then(|i| i.as_str())
                    .unwrap_or("")
                    .to_string();
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
impl AgentBackend for AcpAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        let command = config.command.as_deref().unwrap_or("claude");

        // 仅用 --version 验证命令可用，不启动完整进程
        let output = tokio::process::Command::new(command)
            .arg("--version")
            .output()
            .await
            .map_err(|e| AppError::Agent(format!(
                "ACP command '{}' not found or not executable: {}", command, e
            )))?;

        if !output.status.success() {
            return Err(AppError::Agent(format!(
                "ACP command '{}' returned error", command
            )));
        }

        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;

        let version = String::from_utf8_lossy(&output.stdout);
        tracing::info!(command = command, version = %version.trim(), "ACP agent verified and ready");
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
            AppError::Agent("Agent not configured. Call start() first.".into())
        })?;

        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let command = config.command.as_deref().unwrap_or("claude");
        let process_id = format!("acp-{}-{}", chat_id, uuid::Uuid::new_v4());

        let mut args: Vec<String> = vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
            "-p".to_string(),
            message.to_string(),
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

        // 存储 stdin 和进程 ID（供 handle_permission 使用）
        *self.active_stdin.write().await = Some(stdin);
        *self.active_process_id.write().await = Some(process_id.clone());

        // 设置取消通道
        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();
        let pm = self.process_manager.clone();
        let pid = process_id.clone();
        let active_stdin = self.active_stdin.clone();
        let active_pid = self.active_process_id.clone();

        // 异步读取 stdout — 带 10 分钟总超时
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            let mut ctx = StreamContext {
                current_msg_id: String::new(),
            };

            let timeout_duration = tokio::time::Duration::from_secs(600);
            let result = tokio::time::timeout(timeout_duration, async {
                loop {
                    tokio::select! {
                        line = lines.next_line() => {
                            match line {
                                Ok(Some(text)) => {
                                    if let Some(event) = AcpAgent::parse_line(&text, &mut ctx) {
                                        if tx.send(event).await.is_err() {
                                            break;
                                        }
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
                            tracing::info!("Agent task cancelled");
                            break;
                        }
                    }
                }
            }).await;

            if result.is_err() {
                let _ = tx.send(AgentEvent::Error {
                    message: "Agent response timed out (10 minutes)".to_string(),
                }).await;
            }

            // 清理
            pm.kill(&pid).await.ok();
            *status.write().await = AgentStatus::Idle;
            *active_stdin.write().await = None;
            *active_pid.write().await = None;
            let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Idle }).await;
        });

        Ok(())
    }

    async fn stop(&self, _chat_id: &str) -> Result<()> {
        // 发送取消信号
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        // kill 当前活跃进程
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
        // 验证当前有活跃进程
        if self.active_process_id.read().await.is_none() {
            return Err(AppError::Agent("No active agent process to send permission response".into()));
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
        // 使用 blocking read — AgentBackend::status() 是同步的
        // 在实际使用中，锁争用极少
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
