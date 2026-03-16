use crate::models::channel::{ChannelPlugin, ChannelPluginUpdate, CreateChannelPlugin};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn list_channel_plugins(
    state: State<'_, AppState>,
) -> Result<Vec<ChannelPlugin>, String> {
    state
        .channel_service
        .list_plugins()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_channel_plugin(
    state: State<'_, AppState>,
    input: CreateChannelPlugin,
) -> Result<ChannelPlugin, String> {
    state
        .channel_service
        .create_plugin(input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_channel_plugin(
    state: State<'_, AppState>,
    id: String,
    updates: ChannelPluginUpdate,
) -> Result<(), String> {
    state
        .channel_service
        .update_plugin(&id, updates)
        .await
        .map_err(|e| e.to_string())
}
