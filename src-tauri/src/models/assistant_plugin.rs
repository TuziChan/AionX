use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct AssistantPlugin {
    pub id: String,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub plugin_type: String,
    pub name: String,
    pub enabled: bool,
    pub config: Option<String>,
    pub status: String,
    #[specta(type = Option<f64>)]
    pub last_connected: Option<i64>,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateAssistantPlugin {
    #[serde(rename = "type")]
    pub plugin_type: String,
    pub name: String,
    pub config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AssistantPluginUpdate {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub config: Option<String>,
    pub status: Option<String>,
}
