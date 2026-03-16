use crate::error::{AppError, Result};
use crate::event::EventBus;
use crate::services::{ChannelService, ChatService, MessageService};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelegramConfig {
    pub bot_token: String,
    pub webhook_url: Option<String>,
    pub allowed_users: Vec<i64>,
}

#[derive(Debug, Deserialize)]
struct TelegramUpdate {
    update_id: i64,
    message: Option<TelegramMessage>,
}

#[derive(Debug, Deserialize)]
struct TelegramMessage {
    message_id: i64,
    from: Option<TelegramUser>,
    chat: TelegramChat,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TelegramUser {
    id: i64,
    first_name: String,
    username: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TelegramChat {
    id: i64,
    #[serde(rename = "type")]
    chat_type: String,
}

#[derive(Debug, Serialize)]
struct SendMessageRequest {
    chat_id: i64,
    text: String,
    parse_mode: Option<String>,
}

pub struct TelegramChannel {
    plugin_id: String,
    config: TelegramConfig,
    client: Client,
    channel_service: Arc<ChannelService>,
    chat_service: Arc<ChatService>,
    message_service: Arc<MessageService>,
    event_bus: EventBus,
    running: Arc<RwLock<bool>>,
    last_update_id: Arc<RwLock<i64>>,
}

impl TelegramChannel {
    pub fn new(
        plugin_id: String,
        config: TelegramConfig,
        channel_service: Arc<ChannelService>,
        chat_service: Arc<ChatService>,
        message_service: Arc<MessageService>,
        event_bus: EventBus,
    ) -> Self {
        Self {
            plugin_id,
            config,
            client: Client::new(),
            channel_service,
            chat_service,
            message_service,
            event_bus,
            running: Arc::new(RwLock::new(false)),
            last_update_id: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn start(&self) -> Result<()> {
        let mut running = self.running.write().await;
        if *running {
            return Err(AppError::Internal("Telegram channel already running".into()));
        }
        *running = true;
        drop(running);

        info!("Starting Telegram channel: {}", self.plugin_id);

        // 启动长轮询
        let self_clone = self.clone_for_task();
        tokio::spawn(async move {
            self_clone.poll_loop().await;
        });

        Ok(())
    }

    pub async fn stop(&self) -> Result<()> {
        let mut running = self.running.write().await;
        *running = false;
        info!("Stopping Telegram channel: {}", self.plugin_id);
        Ok(())
    }

    fn clone_for_task(&self) -> Self {
        Self {
            plugin_id: self.plugin_id.clone(),
            config: self.config.clone(),
            client: self.client.clone(),
            channel_service: Arc::clone(&self.channel_service),
            chat_service: Arc::clone(&self.chat_service),
            message_service: Arc::clone(&self.message_service),
            event_bus: self.event_bus.clone(),
            running: Arc::clone(&self.running),
            last_update_id: Arc::clone(&self.last_update_id),
        }
    }

    async fn poll_loop(&self) {
        while *self.running.read().await {
            if let Err(e) = self.poll_updates().await {
                error!("Telegram poll error: {}", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
        }
    }

    async fn poll_updates(&self) -> Result<()> {
        let offset = *self.last_update_id.read().await + 1;
        let url = format!(
            "https://api.telegram.org/bot{}/getUpdates",
            self.config.bot_token
        );

        let response = self
            .client
            .get(&url)
            .query(&[("offset", offset.to_string()), ("timeout", "30".to_string())])
            .send()
            .await
            .map_err(|e| AppError::External(format!("Telegram API error: {}", e)))?;

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AppError::External(format!("Failed to parse Telegram response: {}", e)))?;

        if let Some(updates) = json["result"].as_array() {
            for update_value in updates {
                let update: TelegramUpdate = serde_json::from_value(update_value.clone())
                    .map_err(|e| AppError::External(format!("Invalid update format: {}", e)))?;

                *self.last_update_id.write().await = update.update_id;

                if let Some(message) = update.message {
                    if let Err(e) = self.handle_message(message).await {
                        error!("Failed to handle Telegram message: {}", e);
                    }
                }
            }
        }

        Ok(())
    }

    async fn handle_message(&self, message: TelegramMessage) -> Result<()> {
        let user = message.from.as_ref().ok_or_else(|| {
            AppError::External("Message has no sender".into())
        })?;

        // 检查用户权限
        if !self.config.allowed_users.is_empty() && !self.config.allowed_users.contains(&user.id) {
            warn!("Unauthorized Telegram user: {}", user.id);
            return Ok(());
        }

        let text = message.text.as_deref().unwrap_or("");
        let platform_chat_id = message.chat.id.to_string();

        // 处理配对码命令
        if text.starts_with("/pair ") {
            let code = text.trim_start_matches("/pair ").trim();
            return self.handle_pairing(code, &platform_chat_id, user.id).await;
        }

        // 获取或创建会话
        let session = self
            .channel_service
            .get_session_by_platform_chat(&self.plugin_id, &platform_chat_id)
            .await?;

        let session = match session {
            Some(s) => s,
            None => {
                self.send_message(
                    message.chat.id,
                    "请先使用 /pair <配对码> 绑定账号".to_string(),
                )
                .await?;
                return Ok(());
            }
        };

        // 检查会话是否绑定到聊天
        let chat_id = session.chat_id.ok_or_else(|| {
            AppError::External("Session not bound to chat".into())
        })?;

        // 保存用户消息
        self.message_service
            .add_message(&chat_id, "user", text, None)
            .await?;

        // 与 Lark 通道保持一致：将消息投递到通道事件总线，由上层统一路由到 AgentService
        self.event_bus
            .emit(
                "channel:message",
                serde_json::json!({ "chat_id": chat_id, "text": text }),
            )
            .await;

        // 回执：告知用户消息已被系统接收并转发
        self.send_message(message.chat.id, "✅ 消息已接收并转发".to_string())
            .await?;

        Ok(())
    }

    async fn handle_pairing(&self, code: &str, platform_chat_id: &str, user_id: i64) -> Result<()> {
        let pairing = self
            .channel_service
            .verify_pairing_code(code)
            .await?
            .ok_or_else(|| AppError::Auth("Invalid or expired pairing code".into()))?;

        // 使用配对码
        self.channel_service
            .use_pairing_code(code, &pairing.user_id.unwrap_or_default())
            .await?;

        // 创建会话
        let session = self
            .channel_service
            .create_session(crate::models::channel::CreateChannelSession {
                plugin_id: self.plugin_id.clone(),
                platform_chat_id: platform_chat_id.to_string(),
                chat_id: None,
                user_id: pairing.user_id.clone(),
            })
            .await?;

        // 创建新聊天
        let chat = self
            .chat_service
            .create_chat(
                pairing.user_id.as_deref(),
                "Telegram Chat",
                "chat",
                None,
                None,
                None,
            )
            .await?;

        // 绑定会话到聊天
        self.channel_service
            .bind_session_to_chat(&session.id, &chat.id)
            .await?;

        self.send_message(user_id, "配对成功！现在可以开始聊天了。".to_string())
            .await?;

        Ok(())
    }

    async fn send_message(&self, chat_id: i64, text: String) -> Result<()> {
        let url = format!(
            "https://api.telegram.org/bot{}/sendMessage",
            self.config.bot_token
        );

        let request = SendMessageRequest {
            chat_id,
            text,
            parse_mode: Some("Markdown".to_string()),
        };

        self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| AppError::External(format!("Failed to send Telegram message: {}", e)))?;

        Ok(())
    }
}
