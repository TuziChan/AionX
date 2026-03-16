use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub msg_id: Option<String>,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub msg_type: String,
    pub role: String,
    pub content: String,
    pub position: i32,
    pub status: String,
    pub extra: Option<String>,
    #[specta(type = f64)]
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateMessage {
    pub chat_id: String,
    pub msg_id: Option<String>,
    #[serde(rename = "type")]
    pub msg_type: Option<String>,
    pub role: String,
    pub content: String,
    pub extra: Option<String>,
}
