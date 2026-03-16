use crate::db::repositories::ChatRepo;
use crate::error::{AppError, Result};
use crate::models::{Chat, ChatUpdate, CreateChat, ListParams, PaginatedResult};

pub struct ChatService {
    repo: ChatRepo,
}

impl ChatService {
    pub fn new(repo: ChatRepo) -> Self {
        Self { repo }
    }

    pub async fn create(&self, input: CreateChat) -> Result<Chat> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        self.repo.insert(&id, &input, now).await?;
        self.repo.find_by_id_required(&id).await
    }

    pub async fn get(&self, id: &str) -> Result<Option<Chat>> {
        self.repo.find_by_id(id).await
    }

    pub async fn list(&self, params: ListParams) -> Result<PaginatedResult<Chat>> {
        self.repo.find_paginated(&params).await
    }

    pub async fn update(&self, id: &str, updates: ChatUpdate) -> Result<Chat> {
        // 验证存在
        self.repo.find_by_id_required(id).await?;
        let now = chrono::Utc::now().timestamp();
        self.repo.update(id, &updates, now).await?;
        self.repo.find_by_id_required(id).await
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        self.repo.delete(id).await
    }

    pub async fn get_by_workspace(&self, path: &str) -> Result<Vec<Chat>> {
        self.repo.find_by_workspace(path).await
    }

    /// 获取分组历史（今天/昨天/近7天/更早），前端按 updated_at 分组
    pub async fn get_grouped_history(&self) -> Result<Vec<Chat>> {
        self.repo.find_grouped_history().await
    }

    /// 软删除 — 标记状态为 deleted
    pub async fn soft_delete(&self, id: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        self.repo
            .update(
                id,
                &ChatUpdate {
                    status: Some("deleted".to_string()),
                    ..Default::default()
                },
                now,
            )
            .await?;
        Ok(())
    }
}
