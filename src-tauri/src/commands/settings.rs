use crate::config::AppConfig;
use crate::models::{
    AppMetadata, DisplaySettings, SystemRuntimeInfo, SystemSettings, UpdateCheckResult, UpdatePreferences,
};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::Manager;
#[cfg(desktop)]
use tauri_plugin_updater::{Error as UpdaterError, UpdaterExt};

const SYSTEM_CLOSE_TO_TRAY_KEY: &str = "system.closeToTray";
const SYSTEM_NOTIFICATION_ENABLED_KEY: &str = "system.notificationEnabled";
const SYSTEM_CRON_NOTIFICATION_ENABLED_KEY: &str = "system.cronNotificationEnabled";
const SYSTEM_RUNTIME_INFO_KEY: &str = "system.runtimeInfo";
const DISPLAY_CUSTOM_CSS_KEY: &str = "customCss";
const UPDATE_INCLUDE_PRERELEASE_KEY: &str = "update.includePrerelease";
const AIONX_REPOSITORY_URL: &str = "https://github.com/TuziChan/AionX";
const AIONX_RELEASES_URL: &str = "https://github.com/TuziChan/AionX/releases";
const AIONX_ISSUES_URL: &str = "https://github.com/TuziChan/AionX/issues";
const AIONX_DOCS_URL: &str = "https://github.com/TuziChan/AionX#readme";
const AIONX_CONTACT_URL: &str = "https://github.com/TuziChan";

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

#[tauri::command]
#[specta::specta]
pub async fn get_display_settings(
    app_handle: tauri::AppHandle,
) -> Result<DisplaySettings, String> {
    load_display_settings(&app_handle)
}

#[tauri::command]
#[specta::specta]
pub async fn save_display_settings(
    window: tauri::WebviewWindow,
    app_handle: tauri::AppHandle,
    settings: DisplaySettings,
) -> Result<DisplaySettings, String> {
    persist_display_settings(&window, &app_handle, settings)
}

#[tauri::command]
#[specta::specta]
pub async fn get_app_metadata(app_handle: tauri::AppHandle) -> Result<AppMetadata, String> {
    let package_info = app_handle.package_info();

    Ok(AppMetadata {
        app_name: package_info.name.clone(),
        version: package_info.version.to_string(),
        repository_url: AIONX_REPOSITORY_URL.to_string(),
        releases_url: AIONX_RELEASES_URL.to_string(),
        issues_url: AIONX_ISSUES_URL.to_string(),
        docs_url: AIONX_DOCS_URL.to_string(),
        contact_url: AIONX_CONTACT_URL.to_string(),
    })
}

#[tauri::command]
#[specta::specta]
pub async fn get_update_preferences(
    app_handle: tauri::AppHandle,
) -> Result<UpdatePreferences, String> {
    load_update_preferences(&app_handle)
}

#[tauri::command]
#[specta::specta]
pub async fn save_update_preferences(
    app_handle: tauri::AppHandle,
    preferences: UpdatePreferences,
) -> Result<UpdatePreferences, String> {
    persist_update_preferences(&app_handle, preferences)
}

#[tauri::command]
#[specta::specta]
pub async fn check_for_updates(app_handle: tauri::AppHandle) -> Result<UpdateCheckResult, String> {
    let preferences = load_update_preferences(&app_handle)?;
    let current_version = app_handle.package_info().version.to_string();

    #[cfg(desktop)]
    {
        let updater = app_handle
            .updater_builder()
            .version_comparator(move |current, remote| {
                if !preferences.include_prerelease && !remote.version.pre.is_empty() {
                    return false;
                }

                remote.version > current
            })
            .build()
            .map_err(normalize_updater_error)?;

        return match updater.check().await {
            Ok(Some(update)) => Ok(UpdateCheckResult {
                status: "update-available".to_string(),
                current_version,
                latest_version: Some(update.version),
                update_available: true,
                notes: update.body,
                published_at: update.date.map(|value| value.to_string()),
                detail: "检测到可用更新。".to_string(),
            }),
            Ok(None) => Ok(UpdateCheckResult {
                status: "up-to-date".to_string(),
                current_version: current_version.clone(),
                latest_version: Some(current_version),
                update_available: false,
                notes: None,
                published_at: None,
                detail: if preferences.include_prerelease {
                    "当前已经是最新版本（包含预发布版本）。".to_string()
                } else {
                    "当前已经是最新稳定版本。".to_string()
                },
            }),
            Err(error) => Ok(UpdateCheckResult {
                status: update_error_status(&error).to_string(),
                current_version,
                latest_version: None,
                update_available: false,
                notes: None,
                published_at: None,
                detail: normalize_updater_error(error),
            }),
        };
    }

    #[cfg(not(desktop))]
    {
        Ok(UpdateCheckResult {
            status: "unavailable".to_string(),
            current_version,
            latest_version: None,
            update_available: false,
            notes: None,
            published_at: None,
            detail: "当前运行环境不支持应用内更新检查。".to_string(),
        })
    }
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
    let notification_enabled = store
        .get(SYSTEM_NOTIFICATION_ENABLED_KEY)
        .and_then(|value| value.as_bool())
        .unwrap_or(true);
    let cron_notification_enabled = store
        .get(SYSTEM_CRON_NOTIFICATION_ENABLED_KEY)
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
        notification_enabled,
        cron_notification_enabled,
        runtime_info,
    })
}

fn load_display_settings(app_handle: &tauri::AppHandle) -> Result<DisplaySettings, String> {
    use tauri_plugin_store::StoreExt;

    let defaults = AppConfig::default();
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;

    let stored_theme = store
        .get("theme")
        .and_then(|value| value.as_str().map(|theme| theme.to_string()));
    let theme = normalize_theme(stored_theme.as_deref().unwrap_or(defaults.theme.as_str()));
    let zoom_factor = store
        .get("zoom_factor")
        .and_then(|value| value.as_f64())
        .filter(|value| *value >= 0.8 && *value <= 1.5)
        .unwrap_or(defaults.zoom_factor);
    let custom_css = store
        .get(DISPLAY_CUSTOM_CSS_KEY)
        .and_then(|value| value.as_str().map(|css| css.to_string()))
        .unwrap_or_default();

    Ok(DisplaySettings {
        theme,
        zoom_factor,
        custom_css,
    })
}

fn persist_display_settings(
    window: &tauri::WebviewWindow,
    app_handle: &tauri::AppHandle,
    settings: DisplaySettings,
) -> Result<DisplaySettings, String> {
    use tauri_plugin_store::StoreExt;

    let normalized = DisplaySettings {
        theme: normalize_theme(&settings.theme),
        zoom_factor: normalize_zoom_factor(settings.zoom_factor),
        custom_css: settings.custom_css,
    };

    let _ = window.set_zoom(normalized.zoom_factor);

    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    store.set("theme", serde_json::Value::String(normalized.theme.clone()));
    store.set("zoom_factor", serde_json::json!(normalized.zoom_factor));
    store.set(
        DISPLAY_CUSTOM_CSS_KEY,
        serde_json::Value::String(normalized.custom_css.clone()),
    );
    store.save().map_err(|error| error.to_string())?;

    Ok(normalized)
}

fn load_update_preferences(app_handle: &tauri::AppHandle) -> Result<UpdatePreferences, String> {
    use tauri_plugin_store::StoreExt;

    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let include_prerelease = store
        .get(UPDATE_INCLUDE_PRERELEASE_KEY)
        .and_then(|value| value.as_bool())
        .unwrap_or(false);

    Ok(UpdatePreferences {
        include_prerelease,
    })
}

fn persist_update_preferences(
    app_handle: &tauri::AppHandle,
    preferences: UpdatePreferences,
) -> Result<UpdatePreferences, String> {
    use tauri_plugin_store::StoreExt;

    let normalized = UpdatePreferences {
        include_prerelease: preferences.include_prerelease,
    };

    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    store.set(
        UPDATE_INCLUDE_PRERELEASE_KEY,
        serde_json::Value::Bool(normalized.include_prerelease),
    );
    store.save().map_err(|error| error.to_string())?;

    Ok(normalized)
}

fn persist_system_settings(
    app_handle: &tauri::AppHandle,
    settings: SystemSettings,
) -> Result<SystemSettings, String> {
    use tauri_plugin_store::StoreExt;

    let defaults = resolve_system_directories(app_handle)?;
    let normalized = SystemSettings {
        close_to_tray: settings.close_to_tray,
        notification_enabled: settings.notification_enabled,
        cron_notification_enabled: settings.cron_notification_enabled,
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
        SYSTEM_NOTIFICATION_ENABLED_KEY,
        serde_json::Value::Bool(normalized.notification_enabled),
    );
    store.set(
        SYSTEM_CRON_NOTIFICATION_ENABLED_KEY,
        serde_json::Value::Bool(normalized.cron_notification_enabled),
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

fn normalize_theme(value: &str) -> String {
    match value.trim() {
        "dark" => "dark".to_string(),
        _ => "light".to_string(),
    }
}

fn normalize_zoom_factor(value: f64) -> f64 {
    value.clamp(0.8, 1.5)
}

#[cfg(desktop)]
fn update_error_status(error: &UpdaterError) -> &'static str {
    match error {
        UpdaterError::EmptyEndpoints => "unavailable",
        _ => "error",
    }
}

#[cfg(desktop)]
fn normalize_updater_error(error: UpdaterError) -> String {
    match error {
        UpdaterError::EmptyEndpoints => "当前应用尚未配置更新源，无法检查更新。".to_string(),
        UpdaterError::ReleaseNotFound => "更新服务未返回可用版本信息。".to_string(),
        other => other.to_string(),
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
