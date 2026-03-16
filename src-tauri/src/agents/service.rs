use crate::error::{AppError, Result};
use super::acp::AcpAgent;
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::{mpsc, RwLock};

/// Agent 管理服务
/// 管理所有 Agent 实例的生命周期，转发事件到前端
pub struct AgentService {
    agents: RwLock<HashMap<String, Box<dyn AgentBackend>>>,
    process_manager: Arc<ProcessManager>,
}

impl AgentService {
    pub fn new() -> Self {
        Self {
            agents: RwLock::new(HashMap::new()),
            process_manager: Arc::new(ProcessManager::new()),
        }
    }

    /// 为 chat 获取或创建 Agent 实例
    async fn get_or_create_agent(
        &self,
        chat_id: &str,
        agent_type: &str,
        config: &AgentConfig,
    ) -> Result<()> {
        let mut agents = self.agents.write().await;
        if !agents.contains_key(chat_id) {
            let mut agent: Box<dyn AgentBackend> = match agent_type {
                "acp" => Box::new(AcpAgent::new(self.process_manager.clone())),
                // 阶段3 扩展：
                // "gemini" => Box::new(GeminiAgent::new()),
                // "codex" => Box::new(CodexAgent::new(self.process_manager.clone())),
                // "nanobot" => Box::new(NanobotAgent::new()),
                // "openclaw" => Box::new(OpenClawAgent::new()),
                _ => return Err(AppError::Agent(format!("Unknown agent type: {}", agent_type))),
            };
            agent.start(config).await?;
            agents.insert(chat_id.to_string(), agent);
        }
        Ok(())
    }

    /// 发送消息并启动流式响应
    pub async fn send_message(
        &self,
        chat_id: &str,
        agent_type: &str,
        message: &str,
        files: Option<Vec<FileAttachment>>,
        config: &AgentConfig,
        app_handle: &AppHandle,
    ) -> Result<()> {
        self.get_or_create_agent(chat_id, agent_type, config).await?;

        let (tx, rx) = mpsc::channel::<AgentEvent>(128);

        // 获取 agent 引用并发送消息
        {
            let agents = self.agents.read().await;
            let agent = agents.get(chat_id).ok_or_else(|| {
                AppError::Agent(format!("Agent not found for chat: {}", chat_id))
            })?;
            agent.send_message(chat_id, message, files, tx).await?;
        }

        // 启动事件转发任务
        let handle = app_handle.clone();
        let cid = chat_id.to_string();
        tokio::spawn(async move {
            Self::forward_events(handle, cid, rx).await;
        });

        Ok(())
    }

    /// 停止指定 chat 的 Agent
    pub async fn stop_agent(&self, chat_id: &str) -> Result<()> {
        let agents = self.agents.read().await;
        if let Some(agent) = agents.get(chat_id) {
            agent.stop(chat_id).await?;
        }
        Ok(())
    }

    /// 获取 Agent 状态
    pub async fn get_status(&self, chat_id: &str) -> AgentStatus {
        let agents = self.agents.read().await;
        agents.get(chat_id)
            .map(|a| a.status())
            .unwrap_or(AgentStatus::Idle)
    }

    /// 处理权限请求
    pub async fn handle_permission(
        &self,
        chat_id: &str,
        request_id: &str,
        approved: bool,
    ) -> Result<()> {
        let agents = self.agents.read().await;
        let agent = agents.get(chat_id).ok_or_else(|| {
            AppError::Agent(format!("Agent not found for chat: {}", chat_id))
        })?;
        agent.handle_permission(chat_id, request_id, approved).await
    }

    /// 检测系统中可用的 Agent
    pub async fn detect_agents() -> Vec<DetectedAgent> {
        AcpAgent::detect_available().await
    }

    /// 清理指定 chat 的 Agent
    pub async fn remove_agent(&self, chat_id: &str) {
        let mut agents = self.agents.write().await;
        if let Some(mut agent) = agents.remove(chat_id) {
            let _ = agent.shutdown().await;
        }
    }

    /// 应用退出时清理所有 Agent
    pub async fn shutdown_all(&self) {
        let mut agents = self.agents.write().await;
        for (id, mut agent) in agents.drain() {
            let _ = agent.shutdown().await;
            tracing::info!(chat_id = id, "Agent cleaned up");
        }
        self.process_manager.cleanup_all().await;
    }

    /// 转发 Agent 事件到前端（通过 Tauri Event）
    async fn forward_events(
        app_handle: AppHandle,
        chat_id: String,
        mut rx: mpsc::Receiver<AgentEvent>,
    ) {
        while let Some(event) = rx.recv().await {
            let event_name = match &event {
                AgentEvent::MessageStart { .. } => "agent:message-start",
                AgentEvent::MessageDelta { .. } => "agent:message-delta",
                AgentEvent::MessageComplete { .. } => "agent:message-complete",
                AgentEvent::ToolCallStart { .. } => "agent:tool-call",
                AgentEvent::ToolCallResult { .. } => "agent:tool-result",
                AgentEvent::PermissionRequest { .. } => "agent:permission-request",
                AgentEvent::StatusChange { .. } => "agent:status-change",
                AgentEvent::Error { .. } => "agent:error",
            };

            let payload = serde_json::json!({
                "chat_id": chat_id,
                "event": event,
            });

            if let Err(e) = app_handle.emit(event_name, &payload) {
                tracing::error!("Failed to emit agent event: {}", e);
            }
        }
    }
}
