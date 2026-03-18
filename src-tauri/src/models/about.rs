use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppMetadata {
    pub app_name: String,
    pub version: String,
    pub repository_url: String,
    pub releases_url: String,
    pub issues_url: String,
    pub docs_url: String,
    pub contact_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePreferences {
    pub include_prerelease: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub status: String,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub update_available: bool,
    pub notes: Option<String>,
    pub published_at: Option<String>,
    pub detail: String,
}
