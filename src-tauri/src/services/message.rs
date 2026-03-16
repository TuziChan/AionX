use crate::error::Result;
use crate::models::{CreateMessage, Message};
use sqlx::SqlitePool;

pub struct MessageService {
    pool: SqlitePool,
}

impl MessageService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn add(&self, input: CreateMessage) -> Result<Message> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        // 获取当前会话最大 position
        let max_pos: (i32,) = sqlx::query_as(
            "SELECT COALESCE(MAX(position), -1) FROM messages WHERE chat_id = ?"
        )
        .bind(&input.chat_id)
        .fetch_one(&self.pool)
        .await?;

        let position = max_pos.0 + 1;

        sqlx::query(
            "INSERT INTO messages (id, chat_id, msg_id, type, role, content, position, extra, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.chat_id)
        .bind(input.msg_id.as_deref().unwrap_or(""))
        .bind(input.msg_type.as_deref().unwrap_or("text"))
        .bind(&input.role)
        .bind(&input.content)
        .bind(position)
        .bind(input.extra.as_deref().unwrap_or("{}"))
        .bind(now)
        .execute(&self.pool)
        .await?;

        // 更新聊天会话的 updated_at
        sqlx::query("UPDATE chats SET updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(&input.chat_id)
            .execute(&self.pool)
            .await?;

        let msg = sqlx::query_as::<_, Message>(
            "SELECT id, chat_id, msg_id, type, role, content, position, status, extra, created_at
             FROM messages WHERE id = ?"
        )
        .bind(&id)
        .fetch_one(&self.pool)
        .await?;

        Ok(msg)
    }

    pub async fn get_by_chat(&self, chat_id: &str) -> Result<Vec<Message>> {
        let messages = sqlx::query_as::<_, Message>(
            "SELECT id, chat_id, msg_id, type, role, content, position, status, extra, created_at
             FROM messages WHERE chat_id = ?
             ORDER BY position ASC"
        )
        .bind(chat_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(messages)
    }

    pub async fn update_content(&self, id: &str, content: &str) -> Result<()> {
        sqlx::query("UPDATE messages SET content = ? WHERE id = ?")
            .bind(content)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_status(&self, id: &str, status: &str) -> Result<()> {
        sqlx::query("UPDATE messages SET status = ? WHERE id = ?")
            .bind(status)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete_by_chat(&self, chat_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM messages WHERE chat_id = ?")
            .bind(chat_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
