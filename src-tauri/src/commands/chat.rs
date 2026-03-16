use crate::models::{AgentType, Chat};
use crate::services::ChatService;
use specta::Type;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Type)]
pub struct CreateChatRequest {
    pub title: String,
    pub agent_type: AgentType,
}

#[tauri::command]
#[specta::specta]
pub async fn create_chat(
    service: State<'_, ChatService>,
    request: CreateChatRequest,
) -> Result<Chat, String> {
    service
        .create_chat(request.title, request.agent_type)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_chat(
    service: State<'_, ChatService>,
    id: String,
) -> Result<Option<Chat>, String> {
    service
        .get_chat(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_chats(
    service: State<'_, ChatService>,
    limit: u32,
) -> Result<Vec<Chat>, String> {
    service
        .list_chats(limit as i64)
        .await
        .map_err(|e| e.to_string())
}
