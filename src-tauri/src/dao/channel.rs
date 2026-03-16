use crate::error::{AppError, Result};
use crate::models::channel::{
    ChannelPairingCode, ChannelPlugin, ChannelPluginUpdate, ChannelSession,
    CreateChannelPlugin, CreateChannelSession,
};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const PLUGIN_COLUMNS: &str = "id, type, name, enabled, config, status, created_at, updated_at";
const SESSION_COLUMNS: &str = "id, plugin_id, platform_chat_id, chat_id, user_id, status, created_at, updated_at";
const PAIRING_COLUMNS: &str = "id, code, user_id, platform_type, platform_user_id, status, expires_at, created_at";

pub struct ChannelDao {
    pool: SqlitePool,
}

impl ChannelDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    // --- Plugin CRUD ---

    pub async fn insert_plugin(&self, input: &CreateChannelPlugin) -> Result<ChannelPlugin> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO channel_plugins (id, type, name, config, created_at, updated_at)
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

        self.find_plugin_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created channel plugin".into())
        })
    }

    pub async fn find_plugin_by_id(&self, id: &str) -> Result<Option<ChannelPlugin>> {
        let sql = format!("SELECT {PLUGIN_COLUMNS} FROM channel_plugins WHERE id = ?");
        let plugin = sqlx::query_as::<_, ChannelPlugin>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(plugin)
    }

    pub async fn find_all_plugins(&self) -> Result<Vec<ChannelPlugin>> {
        let sql = format!("SELECT {PLUGIN_COLUMNS} FROM channel_plugins ORDER BY created_at DESC");
        let plugins = sqlx::query_as::<_, ChannelPlugin>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(plugins)
    }

    pub async fn update_plugin(&self, id: &str, updates: &ChannelPluginUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE channel_plugins SET updated_at = ");
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

    pub async fn delete_plugin(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM channel_plugins WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    // --- Session CRUD ---

    pub async fn insert_session(&self, input: &CreateChannelSession) -> Result<ChannelSession> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO channel_sessions (id, plugin_id, platform_chat_id, chat_id, user_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.plugin_id)
        .bind(&input.platform_chat_id)
        .bind(input.chat_id.as_deref())
        .bind(input.user_id.as_deref())
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_session_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created channel session".into())
        })
    }

    pub async fn find_session_by_id(&self, id: &str) -> Result<Option<ChannelSession>> {
        let sql = format!("SELECT {SESSION_COLUMNS} FROM channel_sessions WHERE id = ?");
        let session = sqlx::query_as::<_, ChannelSession>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(session)
    }

    pub async fn find_session_by_platform_chat(
        &self,
        plugin_id: &str,
        platform_chat_id: &str,
    ) -> Result<Option<ChannelSession>> {
        let sql = format!(
            "SELECT {SESSION_COLUMNS} FROM channel_sessions
             WHERE plugin_id = ? AND platform_chat_id = ? AND status = 'active'
             LIMIT 1"
        );
        let session = sqlx::query_as::<_, ChannelSession>(&sql)
            .bind(plugin_id)
            .bind(platform_chat_id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(session)
    }

    pub async fn find_sessions_by_plugin(&self, plugin_id: &str) -> Result<Vec<ChannelSession>> {
        let sql = format!(
            "SELECT {SESSION_COLUMNS} FROM channel_sessions WHERE plugin_id = ? ORDER BY updated_at DESC"
        );
        let sessions = sqlx::query_as::<_, ChannelSession>(&sql)
            .bind(plugin_id)
            .fetch_all(&self.pool)
            .await?;
        Ok(sessions)
    }

    // --- Pairing Code ---

    pub async fn insert_pairing_code(
        &self,
        code: &str,
        platform_type: &str,
        platform_user_id: &str,
        ttl_secs: i64,
    ) -> Result<ChannelPairingCode> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();
        let expires_at = now + ttl_secs;

        sqlx::query(
            "INSERT INTO channel_pairing_codes (id, code, platform_type, platform_user_id, expires_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(code)
        .bind(platform_type)
        .bind(platform_user_id)
        .bind(expires_at)
        .bind(now)
        .execute(&self.pool)
        .await?;

        let sql = format!("SELECT {PAIRING_COLUMNS} FROM channel_pairing_codes WHERE id = ?");
        let pairing = sqlx::query_as::<_, ChannelPairingCode>(&sql)
            .bind(&id)
            .fetch_one(&self.pool)
            .await?;
        Ok(pairing)
    }

    pub async fn find_pairing_code(&self, code: &str) -> Result<Option<ChannelPairingCode>> {
        let now = chrono::Utc::now().timestamp();
        let sql = format!(
            "SELECT {PAIRING_COLUMNS} FROM channel_pairing_codes
             WHERE code = ? AND status = 'pending' AND expires_at > ?"
        );
        let pairing = sqlx::query_as::<_, ChannelPairingCode>(&sql)
            .bind(code)
            .bind(now)
            .fetch_optional(&self.pool)
            .await?;
        Ok(pairing)
    }

    pub async fn use_pairing_code(&self, id: &str, user_id: &str) -> Result<()> {
        sqlx::query("UPDATE channel_pairing_codes SET status = 'used', user_id = ? WHERE id = ?")
            .bind(user_id)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
