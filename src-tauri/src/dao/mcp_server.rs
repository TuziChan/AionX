use crate::error::{AppError, Result};
use crate::models::mcp_server::{CreateMcpServer, McpServer, McpServerUpdate};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const COLUMNS: &str = "id, name, type, command, args, env, url, enabled, oauth_config, created_at, updated_at";

pub struct McpServerDao {
    pool: SqlitePool,
}

impl McpServerDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateMcpServer) -> Result<McpServer> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO mcp_servers (id, name, type, command, args, env, url, oauth_config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.name)
        .bind(&input.server_type)
        .bind(input.command.as_deref().unwrap_or(""))
        .bind(input.args.as_deref().unwrap_or("[]"))
        .bind(input.env.as_deref().unwrap_or("{}"))
        .bind(input.url.as_deref().unwrap_or(""))
        .bind(input.oauth_config.as_deref().unwrap_or("{}"))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created MCP server".into())
        })
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<McpServer>> {
        let sql = format!("SELECT {COLUMNS} FROM mcp_servers WHERE id = ?");
        let server = sqlx::query_as::<_, McpServer>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(server)
    }

    pub async fn find_all(&self) -> Result<Vec<McpServer>> {
        let sql = format!("SELECT {COLUMNS} FROM mcp_servers ORDER BY created_at DESC");
        let servers = sqlx::query_as::<_, McpServer>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(servers)
    }

    pub async fn find_enabled(&self) -> Result<Vec<McpServer>> {
        let sql = format!("SELECT {COLUMNS} FROM mcp_servers WHERE enabled = 1 ORDER BY name ASC");
        let servers = sqlx::query_as::<_, McpServer>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(servers)
    }

    pub async fn update(&self, id: &str, updates: &McpServerUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE mcp_servers SET updated_at = ");
        qb.push_bind(now);

        if let Some(ref name) = updates.name {
            qb.push(", name = ").push_bind(name.clone());
        }
        if let Some(ref command) = updates.command {
            qb.push(", command = ").push_bind(command.clone());
        }
        if let Some(ref args) = updates.args {
            qb.push(", args = ").push_bind(args.clone());
        }
        if let Some(ref env) = updates.env {
            qb.push(", env = ").push_bind(env.clone());
        }
        if let Some(ref url) = updates.url {
            qb.push(", url = ").push_bind(url.clone());
        }
        if let Some(enabled) = updates.enabled {
            qb.push(", enabled = ").push_bind(enabled);
        }
        if let Some(ref oauth) = updates.oauth_config {
            qb.push(", oauth_config = ").push_bind(oauth.clone());
        }

        qb.push(" WHERE id = ").push_bind(id.to_string());
        let result = qb.build().execute(&self.pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM mcp_servers WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
