use crate::error::{AppError, Result};
use crate::models::{CreateMcpServer, McpServer, UpdateMcpServer};
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, name, type, command, args, env, url, enabled, oauth_config, created_at, updated_at";

pub struct McpServerRepo {
    pool: SqlitePool,
}

impl McpServerRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, id: &str, input: &CreateMcpServer, now: i64) -> Result<()> {
        sqlx::query(
            "INSERT INTO mcp_servers (id, name, type, command, args, env, url, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.server_type)
        .bind(input.command.as_deref().unwrap_or(""))
        .bind(input.args.as_deref().unwrap_or("[]"))
        .bind(input.env.as_deref().unwrap_or("{}"))
        .bind(input.url.as_deref().unwrap_or(""))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<McpServer>> {
        let sql = format!("SELECT {SELECT_COLS} FROM mcp_servers WHERE id = ?");
        Ok(sqlx::query_as::<_, McpServer>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_id_required(&self, id: &str) -> Result<McpServer> {
        self.find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("McpServer {id}")))
    }

    pub async fn find_all(&self) -> Result<Vec<McpServer>> {
        let sql = format!("SELECT {SELECT_COLS} FROM mcp_servers ORDER BY created_at DESC");
        Ok(sqlx::query_as::<_, McpServer>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn find_enabled(&self) -> Result<Vec<McpServer>> {
        let sql = format!("SELECT {SELECT_COLS} FROM mcp_servers WHERE enabled = 1");
        Ok(sqlx::query_as::<_, McpServer>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn update(&self, id: &str, updates: &UpdateMcpServer, now: i64) -> Result<()> {
        let mut sets = vec!["updated_at = ?".to_string()];
        let mut binds: Vec<String> = vec![now.to_string()];

        if let Some(ref v) = updates.name {
            sets.push("name = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.command {
            sets.push("command = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.args {
            sets.push("args = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.env {
            sets.push("env = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.url {
            sets.push("url = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(v) = updates.enabled {
            sets.push("enabled = ?".to_string());
            binds.push((v as i32).to_string());
        }
        if let Some(ref v) = updates.oauth_config {
            sets.push("oauth_config = ?".to_string());
            binds.push(v.clone());
        }

        let sql = format!("UPDATE mcp_servers SET {} WHERE id = ?", sets.join(", "));
        let mut query = sqlx::query(&sql);
        for b in &binds {
            query = query.bind(b);
        }
        query.bind(id).execute(&self.pool).await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM mcp_servers WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
