use axum::{
    extract::{Path, Query},
    Extension, Json,
    http::StatusCode,
};
use serde::Deserialize;
use crate::dao::{ChatDao, MessageDao};
use crate::models::chat::{Chat, ChatRow, ChatUpdate, CreateChat};
use crate::models::message::{CreateMessage, Message, MessageRow};
use crate::models::common::ListParams;
use crate::models::user::UserInfo;
use sqlx::SqlitePool;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

// --- Chat API ---

/// GET /api/chats
pub async fn list_chats(
    Extension(pool): Extension<Arc<SqlitePool>>,
    Query(params): Query<PaginationQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let dao = ChatDao::new((*pool).clone());
    let result = dao
        .find_paginated(&ListParams {
            page: params.page,
            page_size: params.page_size,
        })
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(serde_json::json!(result)))
}

/// GET /api/chats/:id
pub async fn get_chat(
    Extension(pool): Extension<Arc<SqlitePool>>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let dao = ChatDao::new((*pool).clone());
    let chat = dao
        .find_by_id(&id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match chat {
        Some(c) => Ok(Json(serde_json::json!(c))),
        None => Err((StatusCode::NOT_FOUND, "Chat not found".into())),
    }
}

/// POST /api/chats
pub async fn create_chat(
    Extension(pool): Extension<Arc<SqlitePool>>,
    Extension(user): Extension<UserInfo>,
    Json(input): Json<CreateChat>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, String)> {
    let dao = ChatDao::new((*pool).clone());
    let chat = dao
        .insert(&input, Some(&user.id))
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((StatusCode::CREATED, Json(serde_json::json!(chat))))
}

/// DELETE /api/chats/:id
pub async fn delete_chat(
    Extension(pool): Extension<Arc<SqlitePool>>,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let dao = ChatDao::new((*pool).clone());
    dao.delete(&id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(StatusCode::NO_CONTENT)
}

// --- Message API ---

/// GET /api/chats/:id/messages
pub async fn get_messages(
    Extension(pool): Extension<Arc<SqlitePool>>,
    Path(chat_id): Path<String>,
) -> Result<Json<Vec<Message>>, (StatusCode, String)> {
    let dao = MessageDao::new((*pool).clone());
    let messages = dao
        .find_by_chat_id(&chat_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(messages))
}

/// POST /api/chats/:id/messages
pub async fn create_message(
    Extension(pool): Extension<Arc<SqlitePool>>,
    Path(chat_id): Path<String>,
    Json(mut input): Json<CreateMessage>,
) -> Result<(StatusCode, Json<Message>), (StatusCode, String)> {
    input.chat_id = chat_id;
    let dao = MessageDao::new((*pool).clone());
    let message = dao
        .insert(&input)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok((StatusCode::CREATED, Json(message)))
}
