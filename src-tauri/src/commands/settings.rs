use crate::config::AppConfig;
use serde::{Deserialize, Serialize};
use specta::Type;

// --- Settings CRUD Commands ---

#[tauri::command]
#[specta::specta]
pub async fn get_settings(
    app_handle: tauri::AppHandle,
    category: String,
) -> Result<serde_json::Value, String> {
    use tauri_plugin_store::StoreExt;
    let store = app_handle.store("config.json").map_err(|e| e.to_string())?;

    let value = store
        .get(&category)
        .unwrap_or(serde_json::Value::Null);
    Ok(value)
}

#[tauri::command]
#[specta::specta]
pub async fn update_settings(
    app_handle: tauri::AppHandle,
    category: String,
    settings: serde_json::Value,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app_handle.store("config.json").map_err(|e| e.to_string())?;
    store.set(&category, settings);
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn change_language(
    app_handle: tauri::AppHandle,
    language: String,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let store = app_handle.store("config.json").map_err(|e| e.to_string())?;
    store.set("language", serde_json::Value::String(language.clone()));
    store.save().map_err(|e| e.to_string())?;

    use tauri::Emitter;
    app_handle
        .emit("settings:language-changed", &language)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_default_config() -> Result<AppConfig, String> {
    Ok(AppConfig::default())
}

// --- System Commands ---

#[tauri::command]
#[specta::specta]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
}

#[tauri::command]
#[specta::specta]
pub async fn open_dev_tools(window: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(debug_assertions)]
    window.open_devtools();
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn set_zoom_factor(
    window: tauri::WebviewWindow,
    factor: f64,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    use tauri_plugin_store::StoreExt;
    let _ = window.set_zoom(factor);

    let store = app_handle.store("config.json").map_err(|e| e.to_string())?;
    store.set("zoom_factor", serde_json::json!(factor));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

// --- Frontend Logging Command ---

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
