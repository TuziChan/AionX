use crate::config::AppConfig;
use crate::models::{SystemRuntimeInfo, SystemSettings};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Manager;

const SYSTEM_CLOSE_TO_TRAY_KEY: &str = "system.closeToTray";
const SYSTEM_RUNTIME_INFO_KEY: &str = "system.runtimeInfo";

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

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct StoredSystemRuntimeInfo {
    #[serde(default)]
    cache_dir: String,
    #[serde(default)]
    work_dir: String,
    #[serde(default)]
    log_dir: String,
}

#[tauri::command]
#[specta::specta]
pub async fn get_system_settings(
    app_handle: tauri::AppHandle,
) -> Result<SystemSettings, String> {
    load_system_settings(&app_handle)
}

#[tauri::command]
#[specta::specta]
pub async fn save_system_settings(
    app_handle: tauri::AppHandle,
    settings: SystemSettings,
) -> Result<SystemSettings, String> {
    persist_system_settings(&app_handle, settings)
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

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct SystemDirectories {
    pub cache_dir: String,
    pub data_dir: String,
    pub log_dir: String,
}

#[tauri::command]
#[specta::specta]
pub async fn get_system_directories(
    app_handle: tauri::AppHandle,
) -> Result<SystemDirectories, String> {
    resolve_system_directories(&app_handle)
}

fn load_system_settings(app_handle: &tauri::AppHandle) -> Result<SystemSettings, String> {
    use tauri_plugin_store::StoreExt;

    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let defaults = resolve_system_directories(app_handle)?;
    let close_to_tray = store
        .get(SYSTEM_CLOSE_TO_TRAY_KEY)
        .and_then(|value| value.as_bool())
        .unwrap_or(false);

    let runtime_info = match store.get(SYSTEM_RUNTIME_INFO_KEY) {
        Some(value) if !value.is_null() => {
            let stored: StoredSystemRuntimeInfo = serde_json::from_value(value)
                .map_err(|error| format!("Invalid system.runtimeInfo: {error}"))?;

            SystemRuntimeInfo {
                cache_dir: normalize_path(stored.cache_dir, &defaults.cache_dir),
                work_dir: normalize_path(stored.work_dir, &defaults.data_dir),
                log_dir: normalize_path(stored.log_dir, &defaults.log_dir),
            }
        }
        _ => SystemRuntimeInfo {
            cache_dir: defaults.cache_dir.clone(),
            work_dir: defaults.data_dir.clone(),
            log_dir: defaults.log_dir.clone(),
        },
    };

    Ok(SystemSettings {
        close_to_tray,
        runtime_info,
    })
}

fn persist_system_settings(
    app_handle: &tauri::AppHandle,
    settings: SystemSettings,
) -> Result<SystemSettings, String> {
    use tauri_plugin_store::StoreExt;

    let defaults = resolve_system_directories(app_handle)?;
    let normalized = SystemSettings {
        close_to_tray: settings.close_to_tray,
        runtime_info: SystemRuntimeInfo {
            cache_dir: normalize_path(settings.runtime_info.cache_dir, &defaults.cache_dir),
            work_dir: normalize_path(settings.runtime_info.work_dir, &defaults.data_dir),
            log_dir: normalize_path(settings.runtime_info.log_dir, &defaults.log_dir),
        },
    };

    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    store.set(
        SYSTEM_CLOSE_TO_TRAY_KEY,
        serde_json::Value::Bool(normalized.close_to_tray),
    );
    store.set(
        SYSTEM_RUNTIME_INFO_KEY,
        serde_json::to_value(&normalized.runtime_info).map_err(|error| error.to_string())?,
    );
    store.save().map_err(|error| error.to_string())?;

    Ok(normalized)
}

fn resolve_system_directories(app_handle: &tauri::AppHandle) -> Result<SystemDirectories, String> {
    let paths = app_handle.path();
    let cache_dir = paths
        .app_cache_dir()
        .map_err(|e| e.to_string())?;
    let data_dir = paths
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let log_dir = data_dir.join("logs");

    Ok(SystemDirectories {
        cache_dir: cache_dir.to_string_lossy().to_string(),
        data_dir: data_dir.to_string_lossy().to_string(),
        log_dir: log_dir.to_string_lossy().to_string(),
    })
}

fn normalize_path(value: String, fallback: &str) -> String {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        fallback.to_string()
    } else {
        trimmed.to_string()
    }
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
