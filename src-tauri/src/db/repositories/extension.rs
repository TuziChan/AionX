use crate::error::{AppError, Result};
use crate::models::{CreateExtension, Extension, UpdateExtension};
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, name, version, description, path, enabled, config, created_at, updated_at";

pub struct ExtensionRepo {
    pool: SqlitePool,
}

impl ExtensionRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, id: &str, input: &CreateExtension, now: i64) -> Result<()> {
        sqlx::query(
            "INSERT INTO extensions (id, name, version, description, path, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.version)
        .bind(input.description.as_deref().unwrap_or(""))
        .bind(&input.path)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Extension>> {
        let sql = format!("SELECT {SELECT_COLS} FROM extensions WHERE id = ?");
        Ok(sqlx::query_as::<_, Extension>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_id_required(&self, id: &str) -> Result<Extension> {
        self.find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Extension {id}")))
    }

    pub async fn find_all(&self) -> Result<Vec<Extension>> {
        let sql = format!("SELECT {SELECT_COLS} FROM extensions ORDER BY name ASC");
        Ok(sqlx::query_as::<_, Extension>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn find_enabled(&self) -> Result<Vec<Extension>> {
        let sql = format!("SELECT {SELECT_COLS} FROM extensions WHERE enabled = 1 ORDER BY name ASC");
        Ok(sqlx::query_as::<_, Extension>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn update(&self, id: &str, updates: &UpdateExtension, now: i64) -> Result<()> {
        let mut sets = vec!["updated_at = ?".to_string()];
        let mut binds: Vec<String> = vec![now.to_string()];

        if let Some(ref v) = updates.name {
            sets.push("name = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.version {
            sets.push("version = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.description {
            sets.push("description = ?".to_string());
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

        let sql = format!("UPDATE extensions SET {} WHERE id = ?", sets.join(", "));
        let mut query = sqlx::query(&sql);
        for b in &binds {
            query = query.bind(b);
        }
        query.bind(id).execute(&self.pool).await?;
        Ok(())
    }

    pub async fn toggle_enabled(&self, id: &str, enabled: bool, now: i64) -> Result<()> {
        sqlx::query("UPDATE extensions SET enabled = ?, updated_at = ? WHERE id = ?")
            .bind(enabled)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_config(&self, id: &str, config: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE extensions SET config = ?, updated_at = ? WHERE id = ?")
            .bind(config)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM extensions WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
