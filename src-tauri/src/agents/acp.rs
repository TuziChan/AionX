use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::sync::{mpsc, RwLock};

/// ACP (Anthropic Claude Protocol) Agent
/// 通过子进程与 Claude Code / Codebuddy 等工具通信
pub struct AcpAgent {
    process_manager: Arc<ProcessManager>,
    process_id: String,
    status: Arc<RwLock<AgentStatus>>,
    stdin: Arc<RwLock<Option<tokio::process::ChildStdin>>>,
    /// 用于取消正在运行的任务
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
}

impl AcpAgent {
    pub fn new(process_manager: Arc<ProcessManager>) -> Self {
        Self {
            process_manager,
            process_id: String::new(),
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            stdin: Arc::new(RwLock::new(None)),
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
            let available = tokio::process::Command::new(cmd)
                .arg("--version")
                .output()
                .await
                .ok()
                .map(|o| o.status.success())
                .unwrap_or(false);

            let version = if available {
                tokio::process::Command::new(cmd)
                    .arg("--version")
                    .output()
                    .await
                    .ok()
                    .and_then(|o| String::from_utf8(o.stdout).ok())
                    .map(|s| s.trim().to_string())
            } else {
                None
            };

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
    fn parse_line(line: &str) -> Option<AgentEvent> {
        let v: serde_json::Value = serde_json::from_str(line).ok()?;

        let event_type = v.get("type")?.as_str()?;
        match event_type {
            "assistant" => {
                let msg_id = v.get("message")
                    .and_then(|m| m.get("id"))
                    .and_then(|id| id.as_str())
                    .unwrap_or("")
                    .to_string();

                // 检查是否有 content
                if let Some(content) = v.get("content_block")
                    .and_then(|c| c.get("text"))
                    .and_then(|t| t.as_str())
                {
                    return Some(AgentEvent::MessageDelta {
                        msg_id,
                        content: content.to_string(),
                    });
                }

                Some(AgentEvent::MessageStart { msg_id })
            }
            "content_block_delta" => {
                let msg_id = String::new();
                let delta = v.get("delta")
                    .and_then(|d| d.get("text"))
                    .and_then(|t| t.as_str())
                    .unwrap_or("")
                    .to_string();

                if delta.is_empty() {
                    return None;
                }

                Some(AgentEvent::MessageDelta {
                    msg_id,
                    content: delta,
                })
            }
            "result" => {
                let msg_id = v.get("subtype")
                    .and_then(|s| s.as_str())
                    .unwrap_or("")
                    .to_string();
                Some(AgentEvent::MessageComplete { msg_id })
            }
            "tool_use" | "tool_call" => {
                let tool = v.get("name")
                    .or_else(|| v.get("tool"))
                    .and_then(|n| n.as_str())
                    .unwrap_or("unknown")
                    .to_string();
                let input = v.get("input")
                    .cloned()
                    .unwrap_or(serde_json::Value::Null);
                Some(AgentEvent::ToolCallStart {
                    msg_id: String::new(),
                    tool,
                    input,
                })
            }
            "tool_result" => {
                let tool = v.get("tool")
                    .and_then(|n| n.as_str())
                    .unwrap_or("unknown")
                    .to_string();
                let output = v.get("output")
                    .cloned()
                    .unwrap_or(serde_json::Value::Null);
                Some(AgentEvent::ToolCallResult {
                    msg_id: String::new(),
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
        *self.status.write().await = AgentStatus::Starting;

        let command = config.command.as_deref().unwrap_or("claude");
        let default_args = vec!["--output-format".to_string(), "stream-json".to_string()];
        let args = config.args.as_deref().unwrap_or(&default_args);

        self.process_id = format!("acp-{}", uuid::Uuid::new_v4());

        let (stdin, stdout) = self.process_manager.spawn(
            &self.process_id,
            command,
            args,
            config.env.as_ref(),
            config.working_dir.as_deref(),
        ).await?;

        *self.stdin.write().await = Some(stdin);
        self.config = Some(config.clone());

        // 启动 stdout 读取循环（后台）—— 由 send_message 按需启动
        // stdout 会在 send_message 中使用
        // 暂存 stdout 到临时位置并不合适，
        // 重新设计：在 send_message 中直接处理 stdout

        // 不在 start 中消费 stdout，因为 send_message 需要它
        // 实际上 ACP 模式是：启动进程 → 写 stdin → 读 stdout
        // 但 ACP CLI 是 per-invocation 的（每次 send 启动新进程）
        // 所以 start 只记录配置，send_message 时真正启动

        // 先 kill 刚启动的进程（start 只验证命令可用）
        self.process_manager.kill(&self.process_id).await.ok();
        *self.stdin.write().await = None;
        *self.status.write().await = AgentStatus::Idle;

        tracing::info!(command = command, "ACP agent verified and ready");
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

        // 构建命令参数
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

        // 启动进程
        let (_, stdout) = self.process_manager.spawn(
            &process_id,
            command,
            &args,
            config.env.as_ref(),
            config.working_dir.as_deref(),
        ).await?;

        // 设置取消通道
        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();
        let pm = self.process_manager.clone();
        let pid = process_id.clone();

        // 异步读取 stdout 并解析事件
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            loop {
                tokio::select! {
                    line = lines.next_line() => {
                        match line {
                            Ok(Some(text)) => {
                                if let Some(event) = AcpAgent::parse_line(&text) {
                                    if tx.send(event).await.is_err() {
                                        break;  // 接收端已关闭
                                    }
                                }
                            }
                            Ok(None) => break,  // EOF
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

            // 清理
            pm.kill(&pid).await.ok();
            *status.write().await = AgentStatus::Idle;
            let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Idle }).await;
        });

        Ok(())
    }

    async fn stop(&self, chat_id: &str) -> Result<()> {
        // 发送取消信号
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }

        // kill 所有该 chat 的进程
        let process_id_prefix = format!("acp-{}-", chat_id);
        // ProcessManager 不支持前缀匹配 kill，
        // 但取消信号已经发出，stdout 循环会自行清理
        *self.status.write().await = AgentStatus::Idle;

        tracing::info!(chat_id = chat_id, "ACP agent stopped");
        Ok(())
    }

    async fn handle_permission(
        &self,
        _chat_id: &str,
        request_id: &str,
        approved: bool,
    ) -> Result<()> {
        // 通过 stdin 向进程发送权限响应
        let response = serde_json::json!({
            "type": "permission_response",
            "id": request_id,
            "approved": approved,
        });

        let mut stdin_guard = self.stdin.write().await;
        if let Some(ref mut stdin) = *stdin_guard {
            let msg = serde_json::to_string(&response)? + "\n";
            stdin.write_all(msg.as_bytes()).await.map_err(|e| {
                AppError::Agent(format!("Failed to write permission response: {}", e))
            })?;
            stdin.flush().await.map_err(|e| {
                AppError::Agent(format!("Failed to flush stdin: {}", e))
            })?;
        }

        Ok(())
    }

    fn status(&self) -> AgentStatus {
        // 同步访问（best effort）
        self.status.try_read()
            .map(|s| s.clone())
            .unwrap_or(AgentStatus::Idle)
    }

    async fn shutdown(&mut self) -> Result<()> {
        // 取消所有运行中的任务
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        self.process_manager.kill(&self.process_id).await.ok();
        *self.status.write().await = AgentStatus::Disconnected;
        tracing::info!("ACP agent shut down");
        Ok(())
    }
}
