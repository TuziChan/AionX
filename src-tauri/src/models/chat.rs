use serde::{Deserialize, Serialize};
use specta::Type;

/// Chat 数据库行 — 用于 sqlx 查询（extra 为 String）
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ChatRow {
    pub id: String,
    pub user_id: Option<String>,
    pub name: String,
    #[sqlx(rename = "type")]
    pub chat_type: String,
    pub model: String,
    pub agent_type: String,
    pub workspace_path: String,
    pub status: String,
    pub extra: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Chat 对外模型 — 序列化到前端（extra 为 JSON Value）
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Chat {
    pub id: String,
    pub user_id: Option<String>,
    pub name: String,
    #[serde(rename = "type")]
    pub chat_type: String,
    pub model: String,
    pub agent_type: String,
    pub workspace_path: String,
    pub status: String,
    pub extra: serde_json::Value,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

impl From<ChatRow> for Chat {
    fn from(row: ChatRow) -> Self {
        Self {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            chat_type: row.chat_type,
            model: row.model,
            agent_type: row.agent_type,
            workspace_path: row.workspace_path,
            status: row.status,
            extra: serde_json::from_str(&row.extra).unwrap_or(serde_json::Value::Object(Default::default())),
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateChat {
    pub name: String,
    pub agent_type: String,
    pub model: Option<String>,
    pub workspace_path: Option<String>,
    pub extra: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ChatUpdate {
    pub name: Option<String>,
    pub model: Option<String>,
    pub status: Option<String>,
    pub extra: Option<serde_json::Value>,
}
