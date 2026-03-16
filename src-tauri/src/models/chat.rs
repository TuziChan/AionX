use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct Chat {
    pub id: String,
    pub user_id: Option<String>,
    pub name: String,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub chat_type: String,
    pub model: Option<String>,
    pub agent_type: Option<String>,
    pub workspace_path: Option<String>,
    pub status: String,
    pub extra: Option<String>,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateChat {
    pub name: String,
    pub agent_type: String,
    pub model: Option<String>,
    pub workspace_path: Option<String>,
    pub extra: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ChatUpdate {
    pub name: Option<String>,
    pub model: Option<String>,
    pub status: Option<String>,
    pub extra: Option<String>,
}
