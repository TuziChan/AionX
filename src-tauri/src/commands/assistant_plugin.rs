use crate::dao::AssistantPluginDao;
use crate::models::assistant_plugin::{AssistantPlugin, AssistantPluginUpdate, CreateAssistantPlugin};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn list_assistant_plugins(
    state: State<'_, AppState>,
) -> Result<Vec<AssistantPlugin>, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.find_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_assistant_plugin(
    state: State<'_, AppState>,
    input: CreateAssistantPlugin,
) -> Result<AssistantPlugin, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.insert(&input).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_assistant_plugin(
    state: State<'_, AppState>,
    id: String,
    updates: AssistantPluginUpdate,
) -> Result<bool, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.update(&id, &updates).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn remove_assistant_plugin(
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.delete(&id).await.map_err(|e| e.to_string())
}
