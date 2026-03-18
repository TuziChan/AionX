use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct GeminiSettings {
    #[serde(rename = "authType", alias = "auth_type", default = "default_auth_type")]
    pub auth_type: String,
    #[serde(default)]
    pub proxy: String,
    #[serde(
        rename = "GOOGLE_GEMINI_BASE_URL",
        alias = "google_gemini_base_url",
        default
    )]
    pub google_gemini_base_url: Option<String>,
    #[serde(
        rename = "GOOGLE_CLOUD_PROJECT",
        alias = "google_cloud_project",
        default
    )]
    pub google_cloud_project: Option<String>,
    #[serde(rename = "yoloMode", alias = "yolo_mode", default)]
    pub yolo_mode: bool,
    #[serde(rename = "preferredMode", alias = "preferred_mode", default)]
    pub preferred_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GoogleAuthStatus {
    pub connected: bool,
    pub email: Option<String>,
    pub project_id: Option<String>,
}

impl Default for GeminiSettings {
    fn default() -> Self {
        Self {
            auth_type: default_auth_type(),
            proxy: String::new(),
            google_gemini_base_url: None,
            google_cloud_project: None,
            yolo_mode: false,
            preferred_mode: String::new(),
        }
    }
}

fn default_auth_type() -> String {
    "google-account".to_string()
}
