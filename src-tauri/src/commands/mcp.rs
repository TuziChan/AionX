use crate::dao::McpServerDao;
use crate::models::mcp_server::{CreateMcpServer, McpServer, McpServerUpdate};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn get_mcp_servers(
    state: State<'_, AppState>,
) -> Result<Vec<McpServer>, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.find_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn add_mcp_server(
    state: State<'_, AppState>,
    input: CreateMcpServer,
) -> Result<McpServer, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.insert(&input).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_mcp_server(
    state: State<'_, AppState>,
    id: String,
    updates: McpServerUpdate,
) -> Result<bool, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.update(&id, &updates).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn remove_mcp_server(
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let dao = McpServerDao::new(state.db_pool.clone());
    dao.delete(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn test_mcp_connection(id: String) -> Result<String, String> {
    // 阶段4 后续完善：实际连接测试
    Ok(format!("Connection test for {} - placeholder", id))
}
