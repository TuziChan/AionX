use crate::agents::types::*;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn send_message(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
    chat_id: String,
    agent_type: String,
    content: String,
    files: Option<Vec<FileAttachment>>,
    config: AgentConfig,
) -> Result<(), String> {
    state.agent_service
        .send_message(&chat_id, &agent_type, &content, files, &config, &app_handle)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn stop_agent(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<(), String> {
    state.agent_service
        .stop_agent(&chat_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_agent_status(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<AgentStatus, String> {
    Ok(state.agent_service.get_status(&chat_id).await)
}

#[tauri::command]
#[specta::specta]
pub async fn approve_permission(
    state: State<'_, AppState>,
    chat_id: String,
    request_id: String,
    approved: bool,
) -> Result<(), String> {
    state.agent_service
        .handle_permission(&chat_id, &request_id, approved)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn detect_agents() -> Result<Vec<DetectedAgent>, String> {
    Ok(crate::agents::AgentService::detect_agents().await)
}
