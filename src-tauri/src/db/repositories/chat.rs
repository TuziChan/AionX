use crate::error::{AppError, Result};
use crate::models::{Chat, ChatUpdate, CreateChat, ListParams, PaginatedResult};
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, user_id, type, name, agent_type, model, workspace_path, status, extra, created_at, updated_at";

pub struct ChatRepo {
    pool: SqlitePool,
}

impl ChatRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, id: &str, input: &CreateChat, now: i64) -> Result<()> {
        sqlx::query(
            "INSERT INTO chats (id, name, agent_type, model, workspace_path, extra, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.agent_type)
        .bind(input.model.as_deref().unwrap_or(""))
        .bind(input.workspace_path.as_deref().unwrap_or(""))
        .bind(input.extra.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Chat>> {
        let sql = format!("SELECT {SELECT_COLS} FROM chats WHERE id = ?");
        Ok(sqlx::query_as::<_, Chat>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_id_required(&self, id: &str) -> Result<Chat> {
        self.find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Chat {id}")))
    }

    pub async fn find_paginated(&self, params: &ListParams) -> Result<PaginatedResult<Chat>> {
        let (total,): (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM chats WHERE status != 'deleted'",
        )
        .fetch_one(&self.pool)
        .await?;

        let sql = format!(
            "SELECT {SELECT_COLS} FROM chats WHERE status != 'deleted'
             ORDER BY updated_at DESC LIMIT ? OFFSET ?"
        );
        let items = sqlx::query_as::<_, Chat>(&sql)
            .bind(params.limit())
            .bind(params.offset())
            .fetch_all(&self.pool)
            .await?;

        Ok(PaginatedResult {
            items,
            total,
            page: params.page(),
            page_size: params.page_size.unwrap_or(50),
        })
    }

    pub async fn update(&self, id: &str, updates: &ChatUpdate, now: i64) -> Result<()> {
        let mut sets = vec!["updated_at = ?".to_string()];
        let mut binds: Vec<String> = vec![now.to_string()];

        if let Some(ref v) = updates.name {
            sets.push("name = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.model {
            sets.push("model = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.status {
            sets.push("status = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.extra {
            sets.push("extra = ?".to_string());
            binds.push(v.clone());
        }

        let sql = format!("UPDATE chats SET {} WHERE id = ?", sets.join(", "));
        let mut query = sqlx::query(&sql);
        for b in &binds {
            query = query.bind(b);
        }
        query.bind(id).execute(&self.pool).await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM chats WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn find_by_workspace(&self, path: &str) -> Result<Vec<Chat>> {
        let sql = format!(
            "SELECT {SELECT_COLS} FROM chats WHERE workspace_path = ? AND status != 'deleted'
             ORDER BY updated_at DESC"
        );
        Ok(sqlx::query_as::<_, Chat>(&sql)
            .bind(path)
            .fetch_all(&self.pool)
            .await?)
    }

    /// 按时间分组查询聊天历史（今天、昨天、近7天、更早）
    pub async fn find_grouped_history(&self) -> Result<Vec<Chat>> {
        let sql = format!(
            "SELECT {SELECT_COLS} FROM chats WHERE status != 'deleted'
             ORDER BY updated_at DESC LIMIT 200"
        );
        Ok(sqlx::query_as::<_, Chat>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn touch_updated_at(&self, id: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE chats SET updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
