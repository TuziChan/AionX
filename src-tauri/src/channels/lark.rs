use crate::error::{AppError, Result};
use crate::event::EventBus;
use crate::services::{ChannelService, ChatService, MessageService};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LarkConfig {
    pub app_id: String,
    pub app_secret: String,
    pub verification_token: String,
    pub encrypt_key: Option<String>,
}

#[derive(Debug, Deserialize)]
struct LarkEventCallback {
    #[serde(rename = "type")]
    event_type: String,
    token: String,
    challenge: Option<String>,
    event: Option<LarkEvent>,
}

#[derive(Debug, Deserialize)]
struct LarkEvent {
    #[serde(rename = "type")]
    event_type: String,
    message: Option<LarkMessage>,
    sender: Option<LarkSender>,
}

#[derive(Debug, Deserialize)]
struct LarkMessage {
    message_id: String,
    chat_id: String,
    content: String,
    message_type: String,
}

#[derive(Debug, Deserialize)]
struct LarkSender {
    sender_id: LarkSenderId,
}

#[derive(Debug, Deserialize)]
struct LarkSenderId {
    user_id: String,
}

#[derive(Debug, Serialize)]
struct LarkSendMessageRequest {
    receive_id: String,
    msg_type: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct LarkTenantAccessTokenResponse {
    code: i32,
    msg: String,
    tenant_access_token: Option<String>,
    expire: Option<i64>,
}

pub struct LarkChannel {
    plugin_id: String,
    config: LarkConfig,
    client: Client,
    channel_service: Arc<ChannelService>,
    chat_service: Arc<ChatService>,
    message_service: Arc<MessageService>,
    event_bus: EventBus,
    access_token: Arc<RwLock<Option<String>>>,
    token_expires_at: Arc<RwLock<i64>>,
}

impl LarkChannel {
    pub fn new(
        plugin_id: String,
        config: LarkConfig,
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
            access_token: Arc::new(RwLock::new(None)),
            token_expires_at: Arc::new(RwLock::new(0)),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Lark channel: {}", self.plugin_id);
        self.refresh_access_token().await?;
        Ok(())
    }

    pub async fn stop(&self) -> Result<()> {
        info!("Stopping Lark channel: {}", self.plugin_id);
        Ok(())
    }

    async fn refresh_access_token(&self) -> Result<()> {
        let url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";

        let body = serde_json::json!({
            "app_id": self.config.app_id,
            "app_secret": self.config.app_secret,
        });

        let response = self
            .client
            .post(url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::External(format!("Lark API error: {}", e)))?;

        let result: LarkTenantAccessTokenResponse = response
            .json()
            .await
            .map_err(|e| AppError::External(format!("Failed to parse Lark response: {}", e)))?;

        if result.code != 0 {
            return Err(AppError::External(format!("Lark API error: {}", result.msg)));
        }

        let token = result
            .tenant_access_token
            .ok_or_else(|| AppError::External("No access token in response".into()))?;

        let expires_at = chrono::Utc::now().timestamp() + result.expire.unwrap_or(7200) - 300;

        *self.access_token.write().await = Some(token);
        *self.token_expires_at.write().await = expires_at;

        info!("Lark access token refreshed");
        Ok(())
    }

    async fn ensure_valid_token(&self) -> Result<String> {
        let now = chrono::Utc::now().timestamp();
        let expires_at = *self.token_expires_at.read().await;

        if now >= expires_at {
            self.refresh_access_token().await?;
        }

        self.access_token
            .read()
            .await
            .clone()
            .ok_or_else(|| AppError::External("No access token available".into()))
    }

    pub async fn handle_callback(&self, callback: LarkEventCallback) -> Result<serde_json::Value> {
        // URL验证
        if callback.event_type == "url_verification" {
            return Ok(serde_json::json!({
                "challenge": callback.challenge.unwrap_or_default()
            }));
        }

        // 验证token
        if callback.token != self.config.verification_token {
            return Err(AppError::Auth("Invalid verification token".into()));
        }

        // 处理事件
        if let Some(event) = callback.event {
            if event.event_type == "im.message.receive_v1" {
                if let Err(e) = self.handle_message_event(event).await {
                    error!("Failed to handle Lark message: {}", e);
                }
            }
        }

        Ok(serde_json::json!({}))
    }

    async fn handle_message_event(&self, event: LarkEvent) -> Result<()> {
        let message = event.message.ok_or_else(|| {
            AppError::External("Event has no message".into())
        })?;

        let sender = event.sender.ok_or_else(|| {
            AppError::External("Event has no sender".into())
        })?;

        // 只处理文本消息
        if message.message_type != "text" {
            return Ok(());
        }

        let content: serde_json::Value = serde_json::from_str(&message.content)
            .map_err(|e| AppError::External(format!("Invalid message content: {}", e)))?;

        let text = content["text"]
            .as_str()
            .ok_or_else(|| AppError::External("No text in message".into()))?;

        let platform_chat_id = message.chat_id;
        let user_id = sender.sender_id.user_id;

        // 处理配对码命令
        if text.starts_with("/pair ") {
            let code = text.trim_start_matches("/pair ").trim();
            return self.handle_pairing(code, &platform_chat_id, &user_id).await;
        }

        // 获取会话
        let session = self
            .channel_service
            .get_session_by_platform_chat(&self.plugin_id, &platform_chat_id)
            .await?;

        let session = match session {
            Some(s) => s,
            None => {
                self.send_message(&platform_chat_id, "请先使用 /pair <配对码> 绑定您的账户")
                    .await?;
                return Ok(());
            }
        };

        let chat_id = session.chat_id.ok_or_else(|| {
            AppError::External("Session not bound to chat".into())
        })?;

        // 保存用户消息
        use crate::models::message::CreateMessage;
        self.message_service
            .create(CreateMessage {
                chat_id: chat_id.clone(),
                msg_id: None,
                msg_type: "text".to_string(),
                role: "user".to_string(),
                content: text.to_string(),
                position: None,
                status: Some("complete".to_string()),
                extra: None,
            })
            .await?;

        // 发送事件通知
        self.event_bus
            .emit("channel:message", serde_json::json!({ "chat_id": chat_id, "text": text }))
            .await;

        Ok(())
    }

    async fn handle_pairing(&self, code: &str, platform_chat_id: &str, user_id: &str) -> Result<()> {
        let pairing = self
            .channel_service
            .verify_pairing_code(code)
            .await?
            .ok_or_else(|| AppError::Auth("Invalid or expired pairing code".into()))?;

        self.channel_service
            .use_pairing_code(code, &pairing.user_id.unwrap_or_default())
            .await?;

        use crate::models::channel::CreateChannelSession;
        let session = self
            .channel_service
            .create_session(CreateChannelSession {
                plugin_id: self.plugin_id.clone(),
                platform_chat_id: platform_chat_id.to_string(),
                chat_id: None,
                user_id: pairing.user_id.clone(),
            })
            .await?;

        use crate::models::chat::CreateChat;
        let chat = self
            .chat_service
            .create(CreateChat {
                user_id: pairing.user_id,
                name: format!("Lark Chat {}", user_id),
                chat_type: "chat".to_string(),
                model: None,
                agent_type: Some("acp".to_string()),
                workspace_path: None,
                extra: None,
            })
            .await?;

        self.channel_service
            .bind_session_to_chat(&session.id, &chat.id)
            .await?;

        self.send_message(platform_chat_id, "✅ 配对成功！现在可以开始对话了。")
            .await?;

        Ok(())
    }

    async fn send_message(&self, chat_id: &str, text: &str) -> Result<()> {
        let token = self.ensure_valid_token().await?;
        let url = "https://open.feishu.cn/open-apis/im/v1/messages";

        let content = serde_json::json!({
            "text": text
        });

        let request = LarkSendMessageRequest {
            receive_id: chat_id.to_string(),
            msg_type: "text".to_string(),
            content: content.to_string(),
        };

        self.client
            .post(url)
            .header("Authorization", format!("Bearer {}", token))
            .query(&[("receive_id_type", "chat_id")])
            .json(&request)
            .send()
            .await
            .map_err(|e| AppError::External(format!("Failed to send Lark message: {}", e)))?;

        Ok(())
    }
}
