use crate::dao::ChatDao;
use crate::dao::chat::GroupedHistory;
use crate::error::{AppError, Result};
use crate::models::{Chat, ChatUpdate, CreateChat, ListParams, PaginatedResult};
use sqlx::SqlitePool;

pub struct ChatService {
    dao: ChatDao,
}

impl ChatService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            dao: ChatDao::new(pool),
        }
    }

    pub async fn create(&self, input: CreateChat) -> Result<Chat> {
        self.dao.insert(&input, None).await
    }

    pub async fn get(&self, id: &str) -> Result<Option<Chat>> {
        self.dao.find_by_id(id).await
    }

    pub async fn get_or_err(&self, id: &str) -> Result<Chat> {
        self.dao
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Chat {id}")))
    }

    pub async fn list(&self, params: ListParams) -> Result<PaginatedResult<Chat>> {
        self.dao.find_paginated(&params).await
    }

    pub async fn update(&self, id: &str, updates: ChatUpdate) -> Result<Chat> {
        self.dao.update(id, &updates).await?;
        self.get_or_err(id).await
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        self.dao.delete(id).await?;
        Ok(())
    }

    pub async fn get_by_workspace(&self, path: &str) -> Result<Vec<Chat>> {
        self.dao.find_by_workspace(path).await
    }

    pub async fn get_grouped_history(&self) -> Result<GroupedHistory> {
        self.dao.find_grouped_history().await
    }

    pub async fn get_associated(&self, chat_id: &str) -> Result<Option<Chat>> {
        self.dao.find_associated(chat_id).await
    }
}
