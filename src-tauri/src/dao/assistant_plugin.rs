use crate::error::{AppError, Result};
use crate::models::assistant_plugin::{AssistantPlugin, AssistantPluginUpdate, CreateAssistantPlugin};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const COLUMNS: &str = "id, type, name, enabled, config, status, last_connected, created_at, updated_at";

pub struct AssistantPluginDao {
    pool: SqlitePool,
}

impl AssistantPluginDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateAssistantPlugin) -> Result<AssistantPlugin> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO assistant_plugins (id, type, name, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.plugin_type)
        .bind(&input.name)
        .bind(input.config.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created assistant plugin".into())
        })
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<AssistantPlugin>> {
        let sql = format!("SELECT {COLUMNS} FROM assistant_plugins WHERE id = ?");
        let plugin = sqlx::query_as::<_, AssistantPlugin>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(plugin)
    }

    pub async fn find_all(&self) -> Result<Vec<AssistantPlugin>> {
        let sql = format!("SELECT {COLUMNS} FROM assistant_plugins ORDER BY created_at DESC");
        let plugins = sqlx::query_as::<_, AssistantPlugin>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(plugins)
    }

    pub async fn find_by_type(&self, plugin_type: &str) -> Result<Option<AssistantPlugin>> {
        let sql = format!("SELECT {COLUMNS} FROM assistant_plugins WHERE type = ? LIMIT 1");
        let plugin = sqlx::query_as::<_, AssistantPlugin>(&sql)
            .bind(plugin_type)
            .fetch_optional(&self.pool)
            .await?;
        Ok(plugin)
    }

    pub async fn update(&self, id: &str, updates: &AssistantPluginUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE assistant_plugins SET updated_at = ");
        qb.push_bind(now);

        if let Some(ref name) = updates.name {
            qb.push(", name = ").push_bind(name.clone());
        }
        if let Some(enabled) = updates.enabled {
            qb.push(", enabled = ").push_bind(enabled);
        }
        if let Some(ref config) = updates.config {
            qb.push(", config = ").push_bind(config.clone());
        }
        if let Some(ref status) = updates.status {
            qb.push(", status = ").push_bind(status.clone());
        }

        qb.push(" WHERE id = ").push_bind(id.to_string());
        let result = qb.build().execute(&self.pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn update_status(&self, id: &str, status: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        sqlx::query("UPDATE assistant_plugins SET status = ?, last_connected = ?, updated_at = ? WHERE id = ?")
            .bind(status)
            .bind(if status == "connected" { Some(now) } else { None })
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM assistant_plugins WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
