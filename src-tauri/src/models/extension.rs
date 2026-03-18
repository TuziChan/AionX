use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct Extension {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub path: String,
    pub enabled: bool,
    pub config: Option<String>,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateExtension {
    pub name: String,
    pub version: Option<String>,
    pub description: Option<String>,
    pub path: String,
    pub config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ExtensionUpdate {
    pub name: Option<String>,
    pub version: Option<String>,
    pub description: Option<String>,
    pub enabled: Option<bool>,
    pub config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ExtensionSettingsHostContext {
    pub mode: String,
    pub entry_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ExtensionSettingsTab {
    pub tab_id: String,
    pub extension_id: String,
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub path: String,
    pub enabled: bool,
    pub config: Option<String>,
    pub host: Option<ExtensionSettingsHostContext>,
}
