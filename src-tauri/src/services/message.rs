use crate::db::repositories::{ChatRepo, MessageRepo};
use crate::error::Result;
use crate::models::{CreateMessage, Message};

pub struct MessageService {
    repo: MessageRepo,
    chat_repo: ChatRepo,
}

impl MessageService {
    pub fn new(repo: MessageRepo, chat_repo: ChatRepo) -> Self {
        Self { repo, chat_repo }
    }

    pub async fn add(&self, input: CreateMessage) -> Result<Message> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        let position = self.repo.next_position(&input.chat_id).await?;

        self.repo.insert(&id, &input, position, now).await?;

        // 自动更新聊天会话的 updated_at
        self.chat_repo.touch_updated_at(&input.chat_id, now).await?;

        self.repo
            .find_by_id(&id)
            .await?
            .ok_or_else(|| crate::error::AppError::Internal("Failed to retrieve created message".to_string()))
    }

    pub async fn get_by_chat(&self, chat_id: &str) -> Result<Vec<Message>> {
        self.repo.find_by_chat_id(chat_id).await
    }

    pub async fn get_by_chat_paginated(
        &self,
        chat_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Message>> {
        self.repo
            .find_by_chat_id_paginated(chat_id, limit, offset)
            .await
    }

    pub async fn get_latest(&self, chat_id: &str, limit: i64) -> Result<Vec<Message>> {
        self.repo.find_latest_by_chat(chat_id, limit).await
    }

    pub async fn count(&self, chat_id: &str) -> Result<i64> {
        self.repo.count_by_chat_id(chat_id).await
    }

    pub async fn update_content(&self, id: &str, content: &str) -> Result<()> {
        self.repo.update_content(id, content).await
    }

    pub async fn append_content(&self, id: &str, delta: &str) -> Result<()> {
        self.repo.append_content(id, delta).await
    }

    pub async fn update_status(&self, id: &str, status: &str) -> Result<()> {
        self.repo.update_status(id, status).await
    }

    pub async fn delete_by_chat(&self, chat_id: &str) -> Result<()> {
        self.repo.delete_by_chat_id(chat_id).await
    }
}
