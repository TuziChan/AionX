use serde::{Deserialize, Serialize};
use specta::Type;

/// Message 数据库行
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct MessageRow {
    pub id: String,
    pub chat_id: String,
    pub msg_id: String,
    #[sqlx(rename = "type")]
    pub msg_type: String,
    pub role: String,
    pub content: String,
    pub position: i32,
    pub status: String,
    pub extra: String,
    pub created_at: i64,
}

/// Message 对外模型
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub msg_id: String,
    #[serde(rename = "type")]
    pub msg_type: String,
    pub role: String,
    pub content: String,
    pub position: i32,
    pub status: String,
    pub extra: serde_json::Value,
    #[specta(type = f64)]
    pub created_at: i64,
}

impl From<MessageRow> for Message {
    fn from(row: MessageRow) -> Self {
        Self {
            id: row.id,
            chat_id: row.chat_id,
            msg_id: row.msg_id,
            msg_type: row.msg_type,
            role: row.role,
            content: row.content,
            position: row.position,
            status: row.status,
            extra: serde_json::from_str(&row.extra).unwrap_or(serde_json::Value::Object(Default::default())),
            created_at: row.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateMessage {
    pub chat_id: String,
    pub msg_id: Option<String>,
    #[serde(rename = "type")]
    pub msg_type: Option<String>,
    pub role: String,
    pub content: String,
    pub extra: Option<serde_json::Value>,
}
