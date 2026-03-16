use crate::error::Result;
use super::types::{AgentConfig, AgentEvent, AgentStatus, FileAttachment};
use tokio::sync::mpsc;

/// Agent 统一接口 trait
///
/// 所有 Agent（ACP、Gemini、Codex、Nanobot、OpenClaw）都必须实现此 trait。
/// 通过 mpsc::Sender<AgentEvent> 向 AgentService 推送流式事件。
#[async_trait::async_trait]
pub trait AgentBackend: Send + Sync {
    /// 启动 Agent（连接/子进程启动）
    async fn start(&mut self, config: &AgentConfig) -> Result<()>;

    /// 发送消息，通过 tx 推送流式事件
    async fn send_message(
        &self,
        chat_id: &str,
        message: &str,
        files: Option<Vec<FileAttachment>>,
        tx: mpsc::Sender<AgentEvent>,
    ) -> Result<()>;

    /// 停止当前任务
    async fn stop(&self, chat_id: &str) -> Result<()>;

    /// 处理权限请求
    async fn handle_permission(
        &self,
        chat_id: &str,
        request_id: &str,
        approved: bool,
    ) -> Result<()>;

    /// 获取当前状态
    fn status(&self) -> AgentStatus;

    /// 关闭 Agent（清理资源）
    async fn shutdown(&mut self) -> Result<()>;
}
