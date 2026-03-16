use sqlx::SqlitePool;
use tokio::sync::RwLock;
use crate::agents::AgentService;
use crate::events::EventBus;
use crate::services::{AuthService, ChatService, CronService, MessageService};
use crate::webui::WebUiServer;

/// 全局应用状态，通过 Tauri manage() 注入
pub struct AppState {
    pub db_pool: SqlitePool,
    pub event_bus: EventBus,
    pub chat_service: ChatService,
    pub message_service: MessageService,
    pub agent_service: AgentService,
    pub auth_service: AuthService,
    pub cron_service: CronService,
    pub webui_handle: RwLock<Option<WebUiServer>>,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        let event_bus = EventBus::new();
        let chat_service = ChatService::new(pool.clone());
        let message_service = MessageService::new(pool.clone());
        let agent_service = AgentService::new();
        let auth_service = AuthService::new(pool.clone());
        let cron_service = CronService::new(pool.clone());

        Self {
            db_pool: pool,
            event_bus,
            chat_service,
            message_service,
            agent_service,
            auth_service,
            cron_service,
            webui_handle: RwLock::new(None),
        }
    }
}
