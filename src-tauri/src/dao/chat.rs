use crate::error::{AppError, Result};
use crate::models::{Chat, ChatUpdate, CreateChat, ListParams, PaginatedResult};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const CHAT_COLUMNS: &str = "id, user_id, type, name, agent_type, model, workspace_path, status, extra, created_at, updated_at";

pub struct ChatDao {
    pool: SqlitePool,
}

impl ChatDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateChat, user_id: Option<&str>) -> Result<Chat> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO chats (id, user_id, name, agent_type, model, workspace_path, extra, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(user_id)
        .bind(&input.name)
        .bind(&input.agent_type)
        .bind(input.model.as_deref().unwrap_or(""))
        .bind(input.workspace_path.as_deref().unwrap_or(""))
        .bind(input.extra.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created chat".into())
        })
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Chat>> {
        let sql = format!("SELECT {CHAT_COLUMNS} FROM chats WHERE id = ?");
        let chat = sqlx::query_as::<_, Chat>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(chat)
    }

    pub async fn find_paginated(&self, params: &ListParams) -> Result<PaginatedResult<Chat>> {
        let total: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM chats WHERE status != 'deleted'"
        )
        .fetch_one(&self.pool)
        .await?;

        let sql = format!(
            "SELECT {CHAT_COLUMNS} FROM chats WHERE status != 'deleted'
             ORDER BY updated_at DESC LIMIT ? OFFSET ?"
        );
        let items = sqlx::query_as::<_, Chat>(&sql)
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

    pub async fn update(&self, id: &str, updates: &ChatUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();

        let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE chats SET updated_at = ");
        qb.push_bind(now);

        if let Some(ref name) = updates.name {
            qb.push(", name = ").push_bind(name.clone());
        }
        if let Some(ref model) = updates.model {
            qb.push(", model = ").push_bind(model.clone());
        }
        if let Some(ref status) = updates.status {
            qb.push(", status = ").push_bind(status.clone());
        }
        if let Some(ref extra) = updates.extra {
            qb.push(", extra = ").push_bind(extra.clone());
        }

        qb.push(" WHERE id = ").push_bind(id.to_string());
        let result = qb.build().execute(&self.pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM chats WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn find_by_workspace(&self, path: &str) -> Result<Vec<Chat>> {
        let sql = format!(
            "SELECT {CHAT_COLUMNS} FROM chats WHERE workspace_path = ? AND status != 'deleted'
             ORDER BY updated_at DESC"
        );
        let items = sqlx::query_as::<_, Chat>(&sql)
            .bind(path)
            .fetch_all(&self.pool)
            .await?;
        Ok(items)
    }

    /// 按时间分组查询聊天历史：今天、昨天、本周、本月、更早
    pub async fn find_grouped_history(&self) -> Result<GroupedHistory> {
        let now = chrono::Utc::now().timestamp();
        let today_start = now - (now % 86400); // 今天 00:00 UTC
        let yesterday_start = today_start - 86400;
        let week_start = today_start - 7 * 86400;
        let month_start = today_start - 30 * 86400;

        let sql = format!("SELECT {CHAT_COLUMNS} FROM chats WHERE status != 'deleted' ORDER BY updated_at DESC");
        let all_chats = sqlx::query_as::<_, Chat>(&sql)
            .fetch_all(&self.pool)
            .await?;

        let mut result = GroupedHistory::default();
        for chat in all_chats {
            if chat.updated_at >= today_start {
                result.today.push(chat);
            } else if chat.updated_at >= yesterday_start {
                result.yesterday.push(chat);
            } else if chat.updated_at >= week_start {
                result.this_week.push(chat);
            } else if chat.updated_at >= month_start {
                result.this_month.push(chat);
            } else {
                result.earlier.push(chat);
            }
        }

        Ok(result)
    }

    /// 查询与某个 chat 关联的聊天（通过 extra 字段中的 associate_chat_id）
    pub async fn find_associated(&self, chat_id: &str) -> Result<Option<Chat>> {
        let sql = format!(
            "SELECT {CHAT_COLUMNS} FROM chats WHERE json_extract(extra, '$.associate_chat_id') = ? LIMIT 1"
        );
        let chat = sqlx::query_as::<_, Chat>(&sql)
            .bind(chat_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(chat)
    }

    /// 统计聊天总数
    pub async fn count(&self) -> Result<i64> {
        let (count,): (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM chats WHERE status != 'deleted'"
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(count)
    }
}

use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Default, Serialize, Deserialize, Type)]
pub struct GroupedHistory {
    pub today: Vec<Chat>,
    pub yesterday: Vec<Chat>,
    pub this_week: Vec<Chat>,
    pub this_month: Vec<Chat>,
    pub earlier: Vec<Chat>,
}
