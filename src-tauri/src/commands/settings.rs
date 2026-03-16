use crate::config::AppConfig;

#[tauri::command]
#[specta::specta]
pub async fn get_default_config() -> Result<AppConfig, String> {
    Ok(AppConfig::default())
}

#[tauri::command]
#[specta::specta]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
}

#[tauri::command]
#[specta::specta]
pub async fn log_from_frontend(level: String, message: String) {
    match level.as_str() {
        "error" => tracing::error!(target: "frontend", "{}", message),
        "warn" => tracing::warn!(target: "frontend", "{}", message),
        "info" => tracing::info!(target: "frontend", "{}", message),
        "debug" => tracing::debug!(target: "frontend", "{}", message),
        _ => tracing::trace!(target: "frontend", "{}", message),
    }
}
