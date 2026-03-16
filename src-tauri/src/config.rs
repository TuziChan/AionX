use serde::{Deserialize, Serialize};
use specta::Type;

/// 应用配置结构
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppConfig {
    pub theme: String,
    pub language: String,
    pub zoom_factor: f64,
    pub webui_port: u16,
    pub webui_remote: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "auto".to_string(),
            language: "zh-CN".to_string(),
            zoom_factor: 1.0,
            webui_port: 9527,
            webui_remote: false,
        }
    }
}

/// 设置 store 的 key 常量
pub mod keys {
    pub const THEME: &str = "theme";
    pub const LANGUAGE: &str = "language";
    pub const ZOOM_FACTOR: &str = "zoom_factor";
    pub const WEBUI_PORT: &str = "webui_port";
    pub const WEBUI_REMOTE: &str = "webui_remote";
}
