use crate::models::{AgentType, Chat};
use crate::error::Result;
use sqlx::SqlitePool;

pub struct ChatService {
    pool: SqlitePool,
}

impl ChatService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create_chat(
        &self,
        title: String,
        agent_type: AgentType,
    ) -> Result<Chat> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        let chat = Chat {
            id: id.clone(),
            title: title.clone(),
            agent_type: agent_type.clone(),
            created_at: now,
            updated_at: now,
        };

        sqlx::query(
            "INSERT INTO chats (id, title, agent_type, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&chat.id)
        .bind(&chat.title)
        .bind(&chat.agent_type)
        .bind(chat.created_at)
        .bind(chat.updated_at)
        .execute(&self.pool)
        .await?;

        Ok(chat)
    }

    pub async fn get_chat(&self, id: &str) -> Result<Option<Chat>> {
        let chat = sqlx::query_as::<_, Chat>(
            "SELECT id, title, agent_type, created_at, updated_at FROM chats WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(chat)
    }

    pub async fn list_chats(&self, limit: i64) -> Result<Vec<Chat>> {
        let chats = sqlx::query_as::<_, Chat>(
            "SELECT id, title, agent_type, created_at, updated_at
             FROM chats
             ORDER BY updated_at DESC
             LIMIT ?"
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(chats)
    }
}
