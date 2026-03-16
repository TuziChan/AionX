use crate::dao::chat::GroupedHistory;
use crate::models::{Chat, ChatUpdate, CreateChat, CreateMessage, ListParams, Message, PaginatedResult};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn create_chat(
    state: State<'_, AppState>,
    input: CreateChat,
) -> Result<Chat, String> {
    state.chat_service.create(input).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_chat(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Chat>, String> {
    state.chat_service.get(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_chats(
    state: State<'_, AppState>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<PaginatedResult<Chat>, String> {
    state.chat_service.list(ListParams { page, page_size }).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_chat(
    state: State<'_, AppState>,
    id: String,
    updates: ChatUpdate,
) -> Result<Chat, String> {
    state.chat_service.update(&id, updates).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_chat(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.chat_service.delete(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_workspace_chats(
    state: State<'_, AppState>,
    workspace_path: String,
) -> Result<Vec<Chat>, String> {
    state.chat_service.get_by_workspace(&workspace_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_grouped_history(
    state: State<'_, AppState>,
) -> Result<GroupedHistory, String> {
    state.chat_service.get_grouped_history().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_associated_chat(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<Option<Chat>, String> {
    state.chat_service.get_associated(&chat_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_messages(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<Vec<Message>, String> {
    state.message_service.get_by_chat(&chat_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn add_message(
    state: State<'_, AppState>,
    input: CreateMessage,
) -> Result<Message, String> {
    state.message_service.add(input).await.map_err(|e| e.to_string())
}
