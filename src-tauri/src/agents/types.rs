use serde::{Deserialize, Serialize};
use specta::Type;

/// Agent 运行状态
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum AgentStatus {
    #[default]
    Idle,
    Starting,
    Running,
    Stopping,
    Error,
    Disconnected,
}

/// Agent 类型枚举
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum AgentType {
    Acp,       // Claude Code / Codebuddy
    Gemini,    // Google Gemini
    Codex,     // OpenAI Codex
    Nanobot,   // Nanobot
    OpenClaw,  // OpenClaw
}

impl std::fmt::Display for AgentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentType::Acp => write!(f, "acp"),
            AgentType::Gemini => write!(f, "gemini"),
            AgentType::Codex => write!(f, "codex"),
            AgentType::Nanobot => write!(f, "nanobot"),
            AgentType::OpenClaw => write!(f, "openclaw"),
        }
    }
}

impl AgentType {
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "acp" => Some(Self::Acp),
            "gemini" => Some(Self::Gemini),
            "codex" => Some(Self::Codex),
            "nanobot" => Some(Self::Nanobot),
            "openclaw" => Some(Self::OpenClaw),
            _ => None,
        }
    }
}

/// Agent 配置
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AgentConfig {
    pub agent_type: String,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub env: Option<std::collections::HashMap<String, String>>,
    pub working_dir: Option<String>,
}

/// 检测到的可用 Agent
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct DetectedAgent {
    pub agent_type: String,
    pub name: String,
    pub command: String,
    pub version: Option<String>,
    pub available: bool,
}

/// 文件附件（发送消息时附带）
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct FileAttachment {
    pub path: String,
    pub name: String,
    pub mime_type: Option<String>,
}

/// Agent 流式事件（后端 → 前端）
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum AgentEvent {
    #[serde(rename = "message_start")]
    MessageStart { msg_id: String },

    #[serde(rename = "message_delta")]
    MessageDelta { msg_id: String, content: String },

    #[serde(rename = "message_complete")]
    MessageComplete { msg_id: String },

    #[serde(rename = "tool_call_start")]
    ToolCallStart {
        msg_id: String,
        tool: String,
        input: serde_json::Value,
    },

    #[serde(rename = "tool_call_result")]
    ToolCallResult {
        msg_id: String,
        tool: String,
        output: serde_json::Value,
    },

    #[serde(rename = "permission_request")]
    PermissionRequest {
        id: String,
        description: String,
    },

    #[serde(rename = "status_change")]
    StatusChange { status: AgentStatus },

    #[serde(rename = "error")]
    Error { message: String },
}
