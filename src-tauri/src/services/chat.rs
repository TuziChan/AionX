use crate::error::{AppError, Result};
use crate::models::{Chat, ChatUpdate, CreateChat, ListParams, PaginatedResult};
use sqlx::SqlitePool;

pub struct ChatService {
    pool: SqlitePool,
}

impl ChatService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, input: CreateChat) -> Result<Chat> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO chats (id, name, agent_type, model, workspace_path, extra, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.name)
        .bind(&input.agent_type)
        .bind(input.model.as_deref().unwrap_or(""))
        .bind(input.workspace_path.as_deref().unwrap_or(""))
        .bind(input.extra.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.get(&id).await?.ok_or_else(|| AppError::Internal("Failed to retrieve created chat".to_string()))
    }

    pub async fn get(&self, id: &str) -> Result<Option<Chat>> {
        let chat = sqlx::query_as::<_, Chat>(
            "SELECT id, user_id, type, name, agent_type, model, workspace_path, status, extra, created_at, updated_at
             FROM chats WHERE id = ?"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(chat)
    }

    pub async fn list(&self, params: ListParams) -> Result<PaginatedResult<Chat>> {
        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM chats WHERE status != 'deleted'"
        )
        .fetch_one(&self.pool)
        .await?;

        let items = sqlx::query_as::<_, Chat>(
            "SELECT id, user_id, type, name, agent_type, model, workspace_path, status, extra, created_at, updated_at
             FROM chats WHERE status != 'deleted'
             ORDER BY updated_at DESC LIMIT ? OFFSET ?"
        )
        .bind(params.limit())
        .bind(params.offset())
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            items,
            total: total.0,
            page: params.page(),
            page_size: params.page_size.unwrap_or(50),
        })
    }

    pub async fn update(&self, id: &str, updates: ChatUpdate) -> Result<Chat> {
        let now = chrono::Utc::now().timestamp();

        // 动态构建更新语句
        let mut sets = vec!["updated_at = ?".to_string()];
        let mut binds: Vec<String> = vec![now.to_string()];

        if let Some(ref name) = updates.name {
            sets.push("name = ?".to_string());
            binds.push(name.clone());
        }
        if let Some(ref model) = updates.model {
            sets.push("model = ?".to_string());
            binds.push(model.clone());
        }
        if let Some(ref status) = updates.status {
            sets.push("status = ?".to_string());
            binds.push(status.clone());
        }
        if let Some(ref extra) = updates.extra {
            sets.push("extra = ?".to_string());
            binds.push(extra.clone());
        }

        let sql = format!("UPDATE chats SET {} WHERE id = ?", sets.join(", "));

        let mut query = sqlx::query(&sql);
        for bind in &binds {
            query = query.bind(bind);
        }
        query = query.bind(id);
        query.execute(&self.pool).await?;

        self.get(id).await?.ok_or_else(|| AppError::NotFound(format!("Chat {id}")))
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM chats WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn get_by_workspace(&self, path: &str) -> Result<Vec<Chat>> {
        let items = sqlx::query_as::<_, Chat>(
            "SELECT id, user_id, type, name, agent_type, model, workspace_path, status, extra, created_at, updated_at
             FROM chats WHERE workspace_path = ? AND status != 'deleted'
             ORDER BY updated_at DESC"
        )
        .bind(path)
        .fetch_all(&self.pool)
        .await?;
        Ok(items)
    }
}
