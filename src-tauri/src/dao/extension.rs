use crate::error::{AppError, Result};
use crate::models::extension::{CreateExtension, Extension, ExtensionUpdate};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const COLUMNS: &str = "id, name, version, description, path, enabled, config, created_at, updated_at";

pub struct ExtensionDao {
    pool: SqlitePool,
}

impl ExtensionDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateExtension) -> Result<Extension> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO extensions (id, name, version, description, path, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.name)
        .bind(input.version.as_deref().unwrap_or("0.0.0"))
        .bind(input.description.as_deref().unwrap_or(""))
        .bind(&input.path)
        .bind(input.config.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created extension".into())
        })
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<Extension>> {
        let sql = format!("SELECT {COLUMNS} FROM extensions WHERE id = ?");
        let ext = sqlx::query_as::<_, Extension>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(ext)
    }

    pub async fn find_all(&self) -> Result<Vec<Extension>> {
        let sql = format!("SELECT {COLUMNS} FROM extensions ORDER BY name ASC");
        let exts = sqlx::query_as::<_, Extension>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(exts)
    }

    pub async fn find_enabled(&self) -> Result<Vec<Extension>> {
        let sql = format!("SELECT {COLUMNS} FROM extensions WHERE enabled = 1 ORDER BY name ASC");
        let exts = sqlx::query_as::<_, Extension>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(exts)
    }

    pub async fn update(&self, id: &str, updates: &ExtensionUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE extensions SET updated_at = ");
        qb.push_bind(now);

        if let Some(ref name) = updates.name {
            qb.push(", name = ").push_bind(name.clone());
        }
        if let Some(ref version) = updates.version {
            qb.push(", version = ").push_bind(version.clone());
        }
        if let Some(ref desc) = updates.description {
            qb.push(", description = ").push_bind(desc.clone());
        }
        if let Some(enabled) = updates.enabled {
            qb.push(", enabled = ").push_bind(enabled);
        }
        if let Some(ref config) = updates.config {
            qb.push(", config = ").push_bind(config.clone());
        }

        qb.push(" WHERE id = ").push_bind(id.to_string());
        let result = qb.build().execute(&self.pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM extensions WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
