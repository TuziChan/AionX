use crate::error::Result;
use crate::models::{CreateMessage, Message};
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, chat_id, msg_id, type, role, content, position, status, extra, created_at";

pub struct MessageRepo {
    pool: SqlitePool,
}

impl MessageRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn next_position(&self, chat_id: &str) -> Result<i32> {
        let (max,): (i32,) = sqlx::query_as(
            "SELECT COALESCE(MAX(position), -1) FROM messages WHERE chat_id = ?",
        )
        .bind(chat_id)
        .fetch_one(&self.pool)
        .await?;
        Ok(max + 1)
    }

    pub async fn insert(
        &self,
        id: &str,
        input: &CreateMessage,
        position: i32,
        now: i64,
    ) -> Result<()> {
        sqlx::query(
            "INSERT INTO messages (id, chat_id, msg_id, type, role, content, position, extra, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
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
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Message>> {
        let sql = format!("SELECT {SELECT_COLS} FROM messages WHERE id = ?");
        Ok(sqlx::query_as::<_, Message>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_chat_id(&self, chat_id: &str) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {SELECT_COLS} FROM messages WHERE chat_id = ? ORDER BY position ASC"
        );
        Ok(sqlx::query_as::<_, Message>(&sql)
            .bind(chat_id)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn find_by_chat_id_paginated(
        &self,
        chat_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {SELECT_COLS} FROM messages WHERE chat_id = ?
             ORDER BY position ASC LIMIT ? OFFSET ?"
        );
        Ok(sqlx::query_as::<_, Message>(&sql)
            .bind(chat_id)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn count_by_chat_id(&self, chat_id: &str) -> Result<i64> {
        let (count,): (i64,) =
            sqlx::query_as("SELECT COUNT(*) FROM messages WHERE chat_id = ?")
                .bind(chat_id)
                .fetch_one(&self.pool)
                .await?;
        Ok(count)
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

    pub async fn append_content(&self, id: &str, delta: &str) -> Result<()> {
        sqlx::query("UPDATE messages SET content = content || ? WHERE id = ?")
            .bind(delta)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete_by_id(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM messages WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete_by_chat_id(&self, chat_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM messages WHERE chat_id = ?")
            .bind(chat_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    /// 获取指定会话中特定 position 之后的最新消息
    pub async fn find_latest_by_chat(
        &self,
        chat_id: &str,
        limit: i64,
    ) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {SELECT_COLS} FROM messages WHERE chat_id = ?
             ORDER BY position DESC LIMIT ?"
        );
        let mut msgs = sqlx::query_as::<_, Message>(&sql)
            .bind(chat_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;
        msgs.reverse();
        Ok(msgs)
    }
}
