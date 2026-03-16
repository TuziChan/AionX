use serde::{Deserialize, Serialize};
use specta::Type;

// --- Tauri 前端事件名称常量 ---

pub const AGENT_MESSAGE_START: &str = "agent:message-start";
pub const AGENT_MESSAGE_DELTA: &str = "agent:message-delta";
pub const AGENT_MESSAGE_COMPLETE: &str = "agent:message-complete";
pub const AGENT_TOOL_CALL: &str = "agent:tool-call";
pub const AGENT_PERMISSION_REQUEST: &str = "agent:permission-request";
pub const AGENT_STATUS_CHANGE: &str = "agent:status-change";
pub const AGENT_ERROR: &str = "agent:error";

pub const CRON_JOB_STARTED: &str = "cron:job-started";
pub const CRON_JOB_COMPLETED: &str = "cron:job-completed";
pub const CRON_JOB_FAILED: &str = "cron:job-failed";

pub const CHANNEL_MESSAGE: &str = "channel:message";
pub const CHANNEL_STATUS: &str = "channel:status";

pub const SETTINGS_CHANGED: &str = "settings:changed";
pub const LANGUAGE_CHANGED: &str = "settings:language-changed";
pub const THEME_CHANGED: &str = "settings:theme-changed";

// --- 内部事件类型 (tokio broadcast) ---

#[derive(Debug, Clone)]
pub enum InternalEvent {
    ChatCreated { chat_id: String },
    ChatDeleted { chat_id: String },
    ChatUpdated { chat_id: String },
    MessageAdded { chat_id: String, message_id: String },
    AgentStarted { chat_id: String, agent_type: String },
    AgentStopped { chat_id: String },
    SettingsChanged { category: String },
    WorkspaceChanged { path: String },
}

// --- Agent 前端事件载荷 ---

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentMessageStartPayload {
    pub chat_id: String,
    pub msg_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentMessageDeltaPayload {
    pub chat_id: String,
    pub msg_id: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentStatusChangePayload {
    pub chat_id: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentErrorPayload {
    pub chat_id: String,
    pub error: String,
}
