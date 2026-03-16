use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

// --- 通道插件 ---

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct ChannelPlugin {
    pub id: String,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub plugin_type: String,
    pub name: String,
    pub enabled: bool,
    pub config: Option<String>,
    pub status: String,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateChannelPlugin {
    #[serde(rename = "type")]
    pub plugin_type: String,
    pub name: String,
    pub config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ChannelPluginUpdate {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub config: Option<String>,
    pub status: Option<String>,
}

// --- 通道会话 ---

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct ChannelSession {
    pub id: String,
    pub plugin_id: String,
    pub platform_chat_id: String,
    pub chat_id: Option<String>,
    pub user_id: Option<String>,
    pub status: String,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateChannelSession {
    pub plugin_id: String,
    pub platform_chat_id: String,
    pub chat_id: Option<String>,
    pub user_id: Option<String>,
}

// --- 配对码 ---

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct ChannelPairingCode {
    pub id: String,
    pub code: String,
    pub user_id: Option<String>,
    pub platform_type: String,
    pub platform_user_id: String,
    pub status: String,
    #[specta(type = f64)]
    pub expires_at: i64,
    #[specta(type = f64)]
    pub created_at: i64,
}
