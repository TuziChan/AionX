use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SystemRuntimeInfo {
    pub cache_dir: String,
    pub work_dir: String,
    pub log_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct SystemSettings {
    pub close_to_tray: bool,
    pub notification_enabled: bool,
    pub cron_notification_enabled: bool,
    pub runtime_info: SystemRuntimeInfo,
}
