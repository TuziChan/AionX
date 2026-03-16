use crate::dao::ExtensionDao;
use crate::models::extension::{Extension, ExtensionUpdate};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn list_extensions(
    state: State<'_, AppState>,
) -> Result<Vec<Extension>, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    dao.find_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_extension(
    state: State<'_, AppState>,
    id: String,
    updates: ExtensionUpdate,
) -> Result<bool, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    dao.update(&id, &updates).await.map_err(|e| e.to_string())
}
