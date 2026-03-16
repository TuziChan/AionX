use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

/// Nanobot Agent — 子进程 per-message 模式
///
/// 基于原 AionUi 项目实现：
/// - 每次消息启动新子进程：`nanobot agent -m "<message>" --session <sessionId> --no-markdown`
/// - 无状态，收集完整 stdout 后解析
/// - 需要去除 Unicode 边框装饰字符（┌┐└┘─│等）
/// - 无流式支持，进程退出后一次性返回结果
pub struct NanobotAgent {
    process_manager: Arc<ProcessManager>,
    status: Arc<RwLock<AgentStatus>>,
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
}

impl NanobotAgent {
    pub fn new(process_manager: Arc<ProcessManager>) -> Self {
        Self {
            process_manager,
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            cancel_tx: Arc::new(RwLock::new(None)),
            config: None,
        }
    }

    pub async fn detect_available() -> DetectedAgent {
        let output = tokio::process::Command::new("nanobot")
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
            agent_type: "nanobot".to_string(),
            name: "Nanobot".to_string(),
            command: "nanobot".to_string(),
            version,
            available,
        }
    }

    /// 去除 Nanobot CLI 输出中的 Unicode 边框装饰字符
    ///
    /// 原项目 NanobotConnection.ts parseOutput() 的 Rust 移植：
    /// - 去除 box-drawing 字符：┌┐└┘─│╭╮╰╯╔╗╚╝═║┄┈
    /// - 过滤纯边框行
    /// - 去除行首尾边框字符
    fn parse_output(raw: &str) -> String {
        let border_chars: &[char] = &[
            '┌', '┐', '└', '┘', '─', '│',
            '╭', '╮', '╰', '╯',
            '╔', '╗', '╚', '╝', '═', '║',
            '┄', '┈',
        ];

        raw.lines()
            .map(|line| {
                // 去除行首尾边框字符和空格
                let trimmed = line.trim();
                let stripped: String = trimmed
                    .chars()
                    .filter(|c| !border_chars.contains(c))
                    .collect();
                stripped.trim().to_string()
            })
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }
}

#[async_trait::async_trait]
impl AgentBackend for NanobotAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        let command = config.command.as_deref().unwrap_or("nanobot");

        let output = tokio::process::Command::new(command)
            .arg("--version")
            .output()
            .await
            .map_err(|e| AppError::Agent(format!(
                "Nanobot command '{}' not found: {}", command, e
            )))?;

        if !output.status.success() {
            return Err(AppError::Agent(format!(
                "Nanobot command '{}' returned error", command
            )));
        }

        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;

        let version = String::from_utf8_lossy(&output.stdout);
        tracing::info!(command = command, version = %version.trim(), "Nanobot agent verified");
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
            AppError::Agent("Nanobot agent not configured".into())
        })?;

        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let command = config.command.as_deref().unwrap_or("nanobot");
        let process_id = format!("nanobot-{}-{}", chat_id, uuid::Uuid::new_v4());
        let msg_id = uuid::Uuid::new_v4().to_string();

        let _ = tx.send(AgentEvent::MessageStart { msg_id: msg_id.clone() }).await;

        // 原项目参数：nanobot agent -m "<message>" --session <sessionId> --no-markdown
        let mut args: Vec<String> = vec![
            "agent".to_string(),
            "-m".to_string(),
            message.to_string(),
            "--session".to_string(),
            chat_id.to_string(),
            "--no-markdown".to_string(),
        ];
        if let Some(ref extra_args) = config.args {
            args.extend(extra_args.clone());
        }

        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();
        let pm = self.process_manager.clone();
        let pid = process_id.clone();
        let cmd = command.to_string();
        let working_dir = config.working_dir.clone();
        let env = config.env.clone();

        // Nanobot 是非流式的：启动进程 → 等待完成 → 一次性返回结果
        tokio::spawn(async move {
            let timeout = tokio::time::Duration::from_secs(600);

            let result = tokio::time::timeout(timeout, async {
                tokio::select! {
                    output = async {
                        let spawn_result = pm.spawn(
                            &pid,
                            &cmd,
                            &args,
                            env.as_ref(),
                            working_dir.as_deref(),
                        ).await;

                        match spawn_result {
                            Ok((_stdin, stdout)) => {
                                use tokio::io::AsyncReadExt;
                                let mut reader = tokio::io::BufReader::new(stdout);
                                let mut raw_output = String::new();
                                reader.read_to_string(&mut raw_output).await.ok();
                                Ok(raw_output)
                            }
                            Err(e) => Err(e),
                        }
                    } => {
                        match output {
                            Ok(raw) => {
                                let content = NanobotAgent::parse_output(&raw);
                                if !content.is_empty() {
                                    let _ = tx.send(AgentEvent::MessageDelta {
                                        msg_id: msg_id.clone(),
                                        content,
                                    }).await;
                                }
                            }
                            Err(e) => {
                                let _ = tx.send(AgentEvent::Error {
                                    message: format!("Nanobot error: {}", e),
                                }).await;
                            }
                        }
                    }
                    _ = &mut cancel_rx => {
                        tracing::info!("Nanobot task cancelled");
                        pm.kill(&pid).await.ok();
                    }
                }
            }).await;

            if result.is_err() {
                let _ = tx.send(AgentEvent::Error {
                    message: "Nanobot response timed out (10 minutes)".to_string(),
                }).await;
            }

            pm.kill(&pid).await.ok();
            let _ = tx.send(AgentEvent::MessageComplete { msg_id }).await;
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
        // Nanobot 不支持权限交互（原项目也无此功能）
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
