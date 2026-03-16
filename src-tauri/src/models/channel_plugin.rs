use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

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
pub struct UpdateChannelPlugin {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub config: Option<String>,
}
