use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::{mpsc, RwLock};

/// Codex Agent — OpenAI Codex CLI 子进程通信
///
/// 协议参考：`codex exec --json` NDJSON 格式
/// 事件类型：
///   thread.started → turn.started → item.started/completed → turn.completed
/// item 类型：agent_message, reasoning, command_execution, file_change, mcp_tool_call
/// 参考：https://takopi.dev/reference/runners/codex/exec-json-cheatsheet/
pub struct CodexAgent {
    process_manager: Arc<ProcessManager>,
    status: Arc<RwLock<AgentStatus>>,
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
}

impl CodexAgent {
    pub fn new(process_manager: Arc<ProcessManager>) -> Self {
        Self {
            process_manager,
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            cancel_tx: Arc::new(RwLock::new(None)),
            config: None,
        }
    }

    pub async fn detect_available() -> DetectedAgent {
        let output = tokio::process::Command::new("codex")
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
            agent_type: "codex".to_string(),
            name: "OpenAI Codex".to_string(),
            command: "codex".to_string(),
            version,
            available,
        }
    }

    /// 解析 Codex exec --json NDJSON 行
    ///
    /// 官方事件格式：
    /// - `{"type":"thread.started","thread_id":"..."}` — 线程启动
    /// - `{"type":"turn.started"}` — 轮次开始
    /// - `{"type":"item.started","item":{"id":"...","type":"command_execution","command":"...","status":"in_progress"}}` — 工具开始
    /// - `{"type":"item.completed","item":{"id":"...","type":"agent_message","text":"..."}}` — 助手消息
    /// - `{"type":"item.completed","item":{"id":"...","type":"command_execution","command":"...","exit_code":0,"status":"completed"}}` — 命令完成
    /// - `{"type":"item.completed","item":{"id":"...","type":"file_change","changes":[...]}}` — 文件变更
    /// - `{"type":"turn.completed","usage":{...}}` — 轮次完成
    /// - `{"type":"turn.failed","error":{"message":"..."}}` — 轮次失败
    /// - `{"type":"error","message":"..."}` — 错误
    fn parse_line(line: &str, ctx: &mut CodexStreamContext) -> Vec<AgentEvent> {
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
            "thread.started" => {
                if let Some(tid) = v.get("thread_id").and_then(|t| t.as_str()) {
                    ctx.thread_id = tid.to_string();
                }
            }

            "turn.started" => {
                // 新轮次开始
            }

            "item.started" => {
                if let Some(item) = v.get("item") {
                    let item_type = item.get("type").and_then(|t| t.as_str()).unwrap_or("");
                    let item_id = item.get("id").and_then(|id| id.as_str()).unwrap_or("").to_string();

                    match item_type {
                        "command_execution" => {
                            let command = item.get("command")
                                .and_then(|c| c.as_str())
                                .unwrap_or("")
                                .to_string();
                            events.push(AgentEvent::ToolCallStart {
                                msg_id: item_id,
                                tool: "command_execution".to_string(),
                                input: serde_json::json!({ "command": command }),
                            });
                        }
                        "mcp_tool_call" => {
                            let tool = item.get("tool")
                                .and_then(|t| t.as_str())
                                .unwrap_or("mcp_tool")
                                .to_string();
                            let args = item.get("arguments").cloned()
                                .unwrap_or(serde_json::Value::Null);
                            events.push(AgentEvent::ToolCallStart {
                                msg_id: item_id,
                                tool,
                                input: args,
                            });
                        }
                        _ => {}
                    }
                }
            }

            "item.completed" => {
                if let Some(item) = v.get("item") {
                    let item_type = item.get("type").and_then(|t| t.as_str()).unwrap_or("");
                    let item_id = item.get("id").and_then(|id| id.as_str()).unwrap_or("").to_string();

                    match item_type {
                        "agent_message" => {
                            let text = item.get("text")
                                .and_then(|t| t.as_str())
                                .unwrap_or("")
                                .to_string();
                            if !text.is_empty() {
                                if ctx.current_msg_id.is_empty() {
                                    ctx.current_msg_id = item_id.clone();
                                    events.push(AgentEvent::MessageStart { msg_id: item_id.clone() });
                                }
                                events.push(AgentEvent::MessageDelta {
                                    msg_id: ctx.current_msg_id.clone(),
                                    content: text,
                                });
                            }
                        }
                        "reasoning" => {
                            // 推理过程（可选展示）
                            let text = item.get("text")
                                .and_then(|t| t.as_str())
                                .unwrap_or("")
                                .to_string();
                            if !text.is_empty() {
                                events.push(AgentEvent::MessageDelta {
                                    msg_id: ctx.current_msg_id.clone(),
                                    content: format!("\n> {}\n", text),
                                });
                            }
                        }
                        "command_execution" => {
                            let output = item.get("aggregated_output")
                                .and_then(|o| o.as_str())
                                .unwrap_or("")
                                .to_string();
                            let exit_code = item.get("exit_code")
                                .and_then(|c| c.as_i64());
                            events.push(AgentEvent::ToolCallResult {
                                msg_id: item_id,
                                tool: "command_execution".to_string(),
                                output: serde_json::json!({
                                    "output": output,
                                    "exit_code": exit_code,
                                }),
                            });
                        }
                        "file_change" => {
                            let changes = item.get("changes").cloned()
                                .unwrap_or(serde_json::Value::Array(vec![]));
                            events.push(AgentEvent::ToolCallResult {
                                msg_id: item_id,
                                tool: "file_change".to_string(),
                                output: changes,
                            });
                        }
                        "mcp_tool_call" => {
                            let result = item.get("result").cloned()
                                .unwrap_or(serde_json::Value::Null);
                            let error = item.get("error").cloned();
                            let output = if let Some(err) = error {
                                serde_json::json!({ "error": err })
                            } else {
                                result
                            };
                            events.push(AgentEvent::ToolCallResult {
                                msg_id: item_id,
                                tool: item.get("tool").and_then(|t| t.as_str()).unwrap_or("mcp_tool").to_string(),
                                output,
                            });
                        }
                        _ => {}
                    }
                }
            }

            "turn.completed" => {
                if !ctx.current_msg_id.is_empty() {
                    events.push(AgentEvent::MessageComplete {
                        msg_id: ctx.current_msg_id.clone(),
                    });
                    ctx.current_msg_id.clear();
                }
            }

            "turn.failed" => {
                let error_msg = v.get("error")
                    .and_then(|e| e.get("message"))
                    .and_then(|m| m.as_str())
                    .unwrap_or("Turn failed")
                    .to_string();
                events.push(AgentEvent::Error { message: error_msg });
            }

            "error" => {
                let msg = v.get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("Unknown error")
                    .to_string();
                // Codex 的 "Reconnecting..." 消息是非致命的
                if !msg.contains("Reconnecting") {
                    events.push(AgentEvent::Error { message: msg });
                }
            }

            _ => {}
        }

        events
    }
}

struct CodexStreamContext {
    thread_id: String,
    current_msg_id: String,
}

#[async_trait::async_trait]
impl AgentBackend for CodexAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        let command = config.command.as_deref().unwrap_or("codex");

        let output = tokio::process::Command::new(command)
            .arg("--version")
            .output()
            .await
            .map_err(|e| AppError::Agent(format!(
                "Codex command '{}' not found: {}", command, e
            )))?;

        if !output.status.success() {
            return Err(AppError::Agent(format!(
                "Codex command '{}' returned error", command
            )));
        }

        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;

        let version = String::from_utf8_lossy(&output.stdout);
        tracing::info!(command = command, version = %version.trim(), "Codex agent verified");
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
            AppError::Agent("Codex agent not configured".into())
        })?;

        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let command = config.command.as_deref().unwrap_or("codex");
        let process_id = format!("codex-{}-{}", chat_id, uuid::Uuid::new_v4());

        // Codex 官方参数：exec --json (非交互 + JSON 输出)
        let mut args: Vec<String> = vec![
            "exec".to_string(),
            "--json".to_string(),
            message.to_string(),
        ];
        if let Some(ref extra_args) = config.args {
            args.extend(extra_args.clone());
        }

        let (_stdin, stdout) = self.process_manager.spawn(
            &process_id,
            command,
            &args,
            config.env.as_ref(),
            config.working_dir.as_deref(),
        ).await?;

        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();
        let pm = self.process_manager.clone();
        let pid = process_id;

        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();
            let mut ctx = CodexStreamContext {
                thread_id: String::new(),
                current_msg_id: String::new(),
            };

            let timeout = tokio::time::Duration::from_secs(600);
            let result = tokio::time::timeout(timeout, async {
                loop {
                    tokio::select! {
                        line = lines.next_line() => {
                            match line {
                                Ok(Some(text)) => {
                                    for event in CodexAgent::parse_line(&text, &mut ctx) {
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
                            tracing::info!("Codex task cancelled");
                            break;
                        }
                    }
                }
            }).await;

            if result.is_err() {
                let _ = tx.send(AgentEvent::Error {
                    message: "Codex response timed out (10 minutes)".to_string(),
                }).await;
            }

            pm.kill(&pid).await.ok();
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
        // Codex exec 模式不支持交互式权限
        // 需要通过 --approval-mode 预配置
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
