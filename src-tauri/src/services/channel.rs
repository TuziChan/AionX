use crate::dao::ChannelDao;
use crate::error::{AppError, Result};
use crate::models::channel::{
    ChannelPairingCode, ChannelPlugin, ChannelPluginUpdate, ChannelSession,
    CreateChannelPlugin, CreateChannelSession,
};
use sqlx::SqlitePool;
use std::sync::Arc;

pub struct ChannelService {
    dao: Arc<ChannelDao>,
}

impl ChannelService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            dao: Arc::new(ChannelDao::new(pool)),
        }
    }

    // --- 插件管理 ---

    pub async fn create_plugin(&self, input: CreateChannelPlugin) -> Result<ChannelPlugin> {
        self.dao.insert_plugin(&input).await
    }

    pub async fn get_plugin(&self, id: &str) -> Result<ChannelPlugin> {
        self.dao
            .find_plugin_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Channel plugin {} not found", id)))
    }

    pub async fn list_plugins(&self) -> Result<Vec<ChannelPlugin>> {
        self.dao.find_all_plugins().await
    }

    pub async fn update_plugin(&self, id: &str, updates: ChannelPluginUpdate) -> Result<()> {
        let updated = self.dao.update_plugin(id, &updates).await?;
        if !updated {
            return Err(AppError::NotFound(format!("Channel plugin {} not found", id)));
        }
        Ok(())
    }

    pub async fn delete_plugin(&self, id: &str) -> Result<()> {
        let deleted = self.dao.delete_plugin(id).await?;
        if !deleted {
            return Err(AppError::NotFound(format!("Channel plugin {} not found", id)));
        }
        Ok(())
    }

    // --- 会话管理（会话隔离） ---

    pub async fn create_session(&self, input: CreateChannelSession) -> Result<ChannelSession> {
        // 检查是否已存在会话
        if let Some(existing) = self
            .dao
            .find_session_by_platform_chat(&input.plugin_id, &input.platform_chat_id)
            .await?
        {
            return Ok(existing);
        }

        self.dao.insert_session(&input).await
    }

    pub async fn get_session(&self, id: &str) -> Result<ChannelSession> {
        self.dao
            .find_session_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Channel session {} not found", id)))
    }

    pub async fn get_session_by_platform_chat(
        &self,
        plugin_id: &str,
        platform_chat_id: &str,
    ) -> Result<Option<ChannelSession>> {
        self.dao
            .find_session_by_platform_chat(plugin_id, platform_chat_id)
            .await
    }

    pub async fn list_sessions(&self, plugin_id: &str) -> Result<Vec<ChannelSession>> {
        self.dao.find_sessions_by_plugin(plugin_id).await
    }

    pub async fn bind_session_to_chat(&self, session_id: &str, chat_id: &str) -> Result<()> {
        self.dao.bind_session_to_chat(session_id, chat_id).await
    }

    pub async fn delete_session(&self, id: &str) -> Result<()> {
        let deleted = self.dao.delete_session(id).await?;
        if !deleted {
            return Err(AppError::NotFound(format!("Channel session {} not found", id)));
        }
        Ok(())
    }

    // --- 配对码管理 ---

    pub async fn generate_pairing_code(
        &self,
        platform_type: &str,
        platform_user_id: &str,
        ttl_seconds: i64,
    ) -> Result<ChannelPairingCode> {
        let code = self.generate_random_code();
        self.dao
            .create_pairing_code(&code, platform_type, platform_user_id, ttl_seconds)
            .await
    }

    pub async fn verify_pairing_code(&self, code: &str) -> Result<Option<ChannelPairingCode>> {
        self.dao.find_pairing_code(code).await
    }

    pub async fn use_pairing_code(&self, code: &str, user_id: &str) -> Result<()> {
        let pairing = self
            .verify_pairing_code(code)
            .await?
            .ok_or_else(|| AppError::Auth("Invalid or expired pairing code".into()))?;

        self.dao.use_pairing_code(&pairing.id, user_id).await
    }

    // --- 辅助方法 ---

    fn generate_random_code(&self) -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        format!("{:06}", rng.gen_range(100000..999999))
    }
}
