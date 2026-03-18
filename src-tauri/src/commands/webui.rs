use crate::models::WebUiSettings;
use crate::state::AppState;
use crate::services::DEFAULT_ADMIN_USERNAME;
use crate::webui::server::{WebUiInfo, WebUiStatus};
use tauri::AppHandle;
use tauri::State;
use tauri_plugin_store::StoreExt;

const WEBUI_SETTINGS_KEY: &str = "webui.settings";
const LEGACY_ENABLED_KEY: &str = "webui.desktop.enabled";
const LEGACY_REMOTE_KEY: &str = "webui.desktop.allowRemote";
const LEGACY_PORT_KEY: &str = "webui.desktop.port";

#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct ResetWebUiPasswordResult {
    pub password: String,
}

#[tauri::command]
#[specta::specta]
pub async fn get_webui_settings(app_handle: AppHandle) -> Result<WebUiSettings, String> {
    load_webui_settings(&app_handle)
}

#[tauri::command]
#[specta::specta]
pub async fn save_webui_settings(
    app_handle: AppHandle,
    settings: WebUiSettings,
) -> Result<WebUiSettings, String> {
    let normalized = normalize_webui_settings(settings);
    persist_webui_settings(&app_handle, &normalized)?;
    Ok(normalized)
}

#[tauri::command]
#[specta::specta]
pub async fn start_webui(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    port: Option<u16>,
    remote: Option<bool>,
) -> Result<WebUiInfo, String> {
    let stored = load_webui_settings(&app_handle)?;
    let port = port.unwrap_or(stored.port);
    let remote = remote.unwrap_or(stored.remote);

    let mut webui = state.webui_handle.write().await;
    if webui.is_some() {
        return Err("WebUI server is already running".into());
    }

    let server = crate::webui::WebUiServer::start(
        port,
        remote,
        state.db_pool.clone(),
        state.event_bus.clone(),
        None, // dist_dir: 可从 app_data_dir 解析
    )
    .await
    .map_err(|e| e.to_string())?;

    let info = server.info();
    *webui = Some(server);
    let saved = WebUiSettings {
        enabled: true,
        port,
        remote,
    };
    persist_webui_settings(&app_handle, &saved)?;

    tracing::info!(port = port, remote = remote, "WebUI started via command");
    Ok(info)
}

#[tauri::command]
#[specta::specta]
pub async fn stop_webui(
    state: State<'_, AppState>,
    app_handle: AppHandle,
) -> Result<(), String> {
    let current_settings = load_webui_settings(&app_handle)?;
    let mut webui = state.webui_handle.write().await;
    if let Some(mut server) = webui.take() {
        let status = server.status();
        server.stop().await.map_err(|e| e.to_string())?;
        persist_webui_settings(
            &app_handle,
            &WebUiSettings {
                enabled: false,
                port: status.port.unwrap_or(current_settings.port),
                remote: status.remote,
            },
        )?;
    } else {
        persist_webui_settings(
            &app_handle,
            &WebUiSettings {
                enabled: false,
                ..current_settings
            },
        )?;
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn get_webui_status(
    state: State<'_, AppState>,
) -> Result<WebUiStatus, String> {
    let webui = state.webui_handle.read().await;
    match webui.as_ref() {
        Some(server) => Ok(server.status()),
        None => Ok(WebUiStatus {
            running: false,
            port: None,
            remote: false,
            admin_username: DEFAULT_ADMIN_USERNAME.to_string(),
            initial_password: None,
        }),
    }
}

#[tauri::command]
#[specta::specta]
pub async fn change_webui_password(
    state: State<'_, AppState>,
    new_password: String,
) -> Result<(), String> {
    state
        .auth_service
        .change_admin_password(&new_password)
        .await
        .map_err(|e| e.to_string())?;

    let mut webui = state.webui_handle.write().await;
    if let Some(server) = webui.as_mut() {
        server.clear_initial_password();
    }

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn reset_webui_password(
    state: State<'_, AppState>,
) -> Result<ResetWebUiPasswordResult, String> {
    let new_password = state
        .auth_service
        .reset_admin_password()
        .await
        .map_err(|e| e.to_string())?;

    let mut webui = state.webui_handle.write().await;
    if let Some(server) = webui.as_mut() {
        server.set_initial_password(new_password.clone());
    }

    Ok(ResetWebUiPasswordResult {
        password: new_password,
    })
}

fn load_webui_settings(app_handle: &AppHandle) -> Result<WebUiSettings, String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;

    if let Some(value) = store.get(WEBUI_SETTINGS_KEY) {
        if !value.is_null() {
            let settings: WebUiSettings =
                serde_json::from_value(value).map_err(|error| format!("Invalid WebUI settings: {error}"))?;
            return Ok(normalize_webui_settings(settings));
        }
    }

    let enabled = store.get(LEGACY_ENABLED_KEY).and_then(|value| value.as_bool()).unwrap_or(false);
    let remote = store.get(LEGACY_REMOTE_KEY).and_then(|value| value.as_bool()).unwrap_or(false);
    let port = store
        .get(LEGACY_PORT_KEY)
        .and_then(|value| value.as_u64())
        .and_then(|value| u16::try_from(value).ok())
        .unwrap_or(9527);

    Ok(WebUiSettings {
        enabled,
        port,
        remote,
    })
}

fn persist_webui_settings(app_handle: &AppHandle, settings: &WebUiSettings) -> Result<(), String> {
    let normalized = normalize_webui_settings(settings.clone());
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let serialized = serde_json::to_value(&normalized).map_err(|error| error.to_string())?;
    store.set(WEBUI_SETTINGS_KEY, serialized);
    store.set(LEGACY_ENABLED_KEY, serde_json::Value::Bool(normalized.enabled));
    store.set(LEGACY_REMOTE_KEY, serde_json::Value::Bool(normalized.remote));
    store.set(LEGACY_PORT_KEY, serde_json::json!(normalized.port));
    store.save().map_err(|error| error.to_string())?;
    Ok(())
}

fn normalize_webui_settings(mut settings: WebUiSettings) -> WebUiSettings {
    if settings.port == 0 {
        settings.port = 9527;
    }
    settings
}
