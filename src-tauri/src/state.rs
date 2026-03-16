use sqlx::SqlitePool;
use crate::events::EventBus;
use crate::services::{ChatService, MessageService};

/// 全局应用状态，通过 Tauri manage() 注入
pub struct AppState {
    pub db_pool: SqlitePool,
    pub event_bus: EventBus,
    pub chat_service: ChatService,
    pub message_service: MessageService,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        let event_bus = EventBus::new();
        let chat_service = ChatService::new(pool.clone());
        let message_service = MessageService::new(pool.clone());

        Self {
            db_pool: pool,
            event_bus,
            chat_service,
            message_service,
        }
    }
}
