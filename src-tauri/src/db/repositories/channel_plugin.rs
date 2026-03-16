use crate::error::{AppError, Result};
use crate::models::{ChannelPlugin, CreateChannelPlugin, UpdateChannelPlugin};
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, type, name, enabled, config, status, created_at, updated_at";

pub struct ChannelPluginRepo {
    pool: SqlitePool,
}

impl ChannelPluginRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, id: &str, input: &CreateChannelPlugin, now: i64) -> Result<()> {
        sqlx::query(
            "INSERT INTO channel_plugins (id, type, name, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(&input.plugin_type)
        .bind(&input.name)
        .bind(input.config.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<ChannelPlugin>> {
        let sql = format!("SELECT {SELECT_COLS} FROM channel_plugins WHERE id = ?");
        Ok(sqlx::query_as::<_, ChannelPlugin>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_id_required(&self, id: &str) -> Result<ChannelPlugin> {
        self.find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("ChannelPlugin {id}")))
    }

    pub async fn find_all(&self) -> Result<Vec<ChannelPlugin>> {
        let sql = format!("SELECT {SELECT_COLS} FROM channel_plugins ORDER BY created_at DESC");
        Ok(sqlx::query_as::<_, ChannelPlugin>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn find_enabled(&self) -> Result<Vec<ChannelPlugin>> {
        let sql = format!("SELECT {SELECT_COLS} FROM channel_plugins WHERE enabled = 1");
        Ok(sqlx::query_as::<_, ChannelPlugin>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn update(&self, id: &str, updates: &UpdateChannelPlugin, now: i64) -> Result<()> {
        let mut sets = vec!["updated_at = ?".to_string()];
        let mut binds: Vec<String> = vec![now.to_string()];

        if let Some(ref v) = updates.name {
            sets.push("name = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(v) = updates.enabled {
            sets.push("enabled = ?".to_string());
            binds.push((v as i32).to_string());
        }
        if let Some(ref v) = updates.config {
            sets.push("config = ?".to_string());
            binds.push(v.clone());
        }

        let sql = format!("UPDATE channel_plugins SET {} WHERE id = ?", sets.join(", "));
        let mut query = sqlx::query(&sql);
        for b in &binds {
            query = query.bind(b);
        }
        query.bind(id).execute(&self.pool).await?;
        Ok(())
    }

    pub async fn update_status(&self, id: &str, status: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE channel_plugins SET status = ?, updated_at = ? WHERE id = ?")
            .bind(status)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn toggle_enabled(&self, id: &str, enabled: bool, now: i64) -> Result<()> {
        sqlx::query("UPDATE channel_plugins SET enabled = ?, updated_at = ? WHERE id = ?")
            .bind(enabled)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM channel_plugins WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
