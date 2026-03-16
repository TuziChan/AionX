use crate::state::AppState;
use crate::webui::server::{WebUiInfo, WebUiStatus};
use tauri::State;

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
        }),
    }
}
