use crate::dao::MessageDao;
use crate::error::Result;
use crate::models::{CreateMessage, Message};
use sqlx::SqlitePool;

pub struct MessageService {
    dao: MessageDao,
}

impl MessageService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            dao: MessageDao::new(pool),
        }
    }

    pub async fn add(&self, input: CreateMessage) -> Result<Message> {
        self.dao.insert(&input).await
    }

    pub async fn get_by_chat(&self, chat_id: &str) -> Result<Vec<Message>> {
        self.dao.find_by_chat_id(chat_id).await
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<Message>> {
        self.dao.find_by_id(id).await
    }

    pub async fn update_content(&self, id: &str, content: &str) -> Result<()> {
        self.dao.update_content(id, content).await?;
        Ok(())
    }

    pub async fn update_status(&self, id: &str, status: &str) -> Result<()> {
        self.dao.update_status(id, status).await?;
        Ok(())
    }

    pub async fn append_content(&self, id: &str, delta: &str) -> Result<()> {
        self.dao.append_content(id, delta).await?;
        Ok(())
    }

    pub async fn delete_by_chat(&self, chat_id: &str) -> Result<u64> {
        self.dao.delete_by_chat_id(chat_id).await
    }

    pub async fn get_last_n(&self, chat_id: &str, n: i32) -> Result<Vec<Message>> {
        self.dao.find_last_n(chat_id, n).await
    }

    pub async fn count_by_chat(&self, chat_id: &str) -> Result<i64> {
        self.dao.count_by_chat(chat_id).await
    }
}
