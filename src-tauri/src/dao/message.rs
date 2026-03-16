use crate::error::Result;
use crate::models::message::{CreateMessage, Message, MessageRow};
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
        let extra_str = serde_json::to_string(
            &input.extra.clone().unwrap_or(serde_json::Value::Object(Default::default()))
        )?;

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
        .bind(&extra_str)
        .bind(now)
        .execute(&self.pool)
        .await?;

        sqlx::query("UPDATE chats SET updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(&input.chat_id)
            .execute(&self.pool)
            .await?;

        let sql = format!("SELECT {MSG_COLUMNS} FROM messages WHERE id = ?");
        let row = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(&id)
            .fetch_one(&self.pool)
            .await?;

        Ok(Message::from(row))
    }

    pub async fn find_by_chat_id(&self, chat_id: &str) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {MSG_COLUMNS} FROM messages WHERE chat_id = ? ORDER BY position ASC"
        );
        let rows = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(chat_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(Message::from).collect())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Message>> {
        let sql = format!("SELECT {MSG_COLUMNS} FROM messages WHERE id = ?");
        let row = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(Message::from))
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

    pub async fn find_last_n(&self, chat_id: &str, n: i32) -> Result<Vec<Message>> {
        let sql = format!(
            "SELECT {MSG_COLUMNS} FROM messages WHERE chat_id = ?
             ORDER BY position DESC LIMIT ?"
        );
        let rows = sqlx::query_as::<_, MessageRow>(&sql)
            .bind(chat_id)
            .bind(n)
            .fetch_all(&self.pool)
            .await?;
        let mut messages: Vec<Message> = rows.into_iter().map(Message::from).collect();
        messages.reverse();
        Ok(messages)
    }

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
