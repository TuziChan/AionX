use crate::state::AppState;
use crate::services::DEFAULT_ADMIN_USERNAME;
use crate::webui::server::{WebUiInfo, WebUiStatus};
use tauri::State;

#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct ResetWebUiPasswordResult {
    pub password: String,
}

#[tauri::command]
#[specta::specta]
pub async fn start_webui(
    state: State<'_, AppState>,
    port: Option<u16>,
    remote: Option<bool>,
) -> Result<WebUiInfo, String> {
    let port = port.unwrap_or(9527);
    let remote = remote.unwrap_or(false);

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

    tracing::info!(port = port, remote = remote, "WebUI started via command");
    Ok(info)
}

#[tauri::command]
#[specta::specta]
pub async fn stop_webui(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut webui = state.webui_handle.write().await;
    if let Some(mut server) = webui.take() {
        server.stop().await.map_err(|e| e.to_string())?;
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
