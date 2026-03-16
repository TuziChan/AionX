use crate::error::Result;
use crate::models::{CreateMessage, Message};
use sqlx::SqlitePool;

const MSG_COLUMNS: &str = "id, chat_id, msg_id, type, role, content, position, status, extra, created_at";

pub struct MessageDao {
    pool: SqlitePool,
}

impl MessageDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateMessage) -> Result<Message> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        // 获取当前会话最大 position
        let (max_pos,): (i32,) = sqlx::query_as(
            "SELECT COALESCE(MAX(position), -1) FROM messages WHERE chat_id = ?"
        )
        .bind(&input.chat_id)
        .fetch_one(&self.pool)
        .await?;

        let position = max_pos + 1;

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

        // 同步更新 chat 的 updated_at
        sqlx::query("UPDATE chats SET updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(&input.chat_id)
            .execute(&self.pool)
            .await?;

        let sql = format!("SELECT {MSG_COLUMNS} FROM messages WHERE id = ?");
        let msg = sqlx::query_as::<_, Message>(&sql)
            .bind(&id)
            .fetch_one(&self.pool)
            .await?;

        Ok(msg)
    }

    pub async fn find_by_chat_id(&self, chat_id: &str) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {MSG_COLUMNS} FROM messages WHERE chat_id = ? ORDER BY position ASC"
        );
        let messages = sqlx::query_as::<_, Message>(&sql)
            .bind(chat_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(messages)
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Message>> {
        let sql = format!("SELECT {MSG_COLUMNS} FROM messages WHERE id = ?");
        let msg = sqlx::query_as::<_, Message>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(msg)
    }

    pub async fn update_content(&self, id: &str, content: &str) -> Result<bool> {
        let result = sqlx::query("UPDATE messages SET content = ? WHERE id = ?")
            .bind(content)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn update_status(&self, id: &str, status: &str) -> Result<bool> {
        let result = sqlx::query("UPDATE messages SET status = ? WHERE id = ?")
            .bind(status)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    /// 追加内容（流式场景：agent 分片推送）
    pub async fn append_content(&self, id: &str, delta: &str) -> Result<bool> {
        let result = sqlx::query(
            "UPDATE messages SET content = content || ? WHERE id = ?"
        )
        .bind(delta)
        .bind(id)
        .execute(&self.pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete_by_chat_id(&self, chat_id: &str) -> Result<u64> {
        let result = sqlx::query("DELETE FROM messages WHERE chat_id = ?")
            .bind(chat_id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected())
    }

    pub async fn delete_by_id(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM messages WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    /// 获取会话中最后 N 条消息
    pub async fn find_last_n(&self, chat_id: &str, n: i32) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {MSG_COLUMNS} FROM messages WHERE chat_id = ?
             ORDER BY position DESC LIMIT ?"
        );
        let mut messages = sqlx::query_as::<_, Message>(&sql)
            .bind(chat_id)
            .bind(n)
            .fetch_all(&self.pool)
            .await?;
        messages.reverse(); // 恢复正序
        Ok(messages)
    }

    /// 统计会话消息数
    pub async fn count_by_chat(&self, chat_id: &str) -> Result<i64> {
        let (count,): (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM messages WHERE chat_id = ?"
        )
        .bind(chat_id)
        .fetch_one(&self.pool)
        .await?;
        Ok(count)
    }
}
