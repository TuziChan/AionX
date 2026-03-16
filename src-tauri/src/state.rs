use sqlx::SqlitePool;
use crate::db::repositories::*;
use crate::events::EventBus;
use crate::services::{ChatService, MessageService};

/// 全局应用状态，通过 Tauri manage() 注入
pub struct AppState {
    pub db_pool: SqlitePool,
    pub event_bus: EventBus,
    // Services (业务逻辑层)
    pub chat_service: ChatService,
    pub message_service: MessageService,
    // Repositories (数据访问层) — 供后续阶段的 services 直接使用
    pub user_repo: UserRepo,
    pub assistant_plugin_repo: AssistantPluginRepo,
    pub cron_job_repo: CronJobRepo,
    pub mcp_server_repo: McpServerRepo,
    pub channel_plugin_repo: ChannelPluginRepo,
    pub extension_repo: ExtensionRepo,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        let event_bus = EventBus::new();

        // 创建 repositories
        let chat_repo = ChatRepo::new(pool.clone());
        let message_repo = MessageRepo::new(pool.clone());
        let chat_repo_for_msg = ChatRepo::new(pool.clone());

        // 创建 services（注入 repo）
        let chat_service = ChatService::new(chat_repo);
        let message_service = MessageService::new(message_repo, chat_repo_for_msg);

        // 独立 repos — 供后续阶段使用
        let user_repo = UserRepo::new(pool.clone());
        let assistant_plugin_repo = AssistantPluginRepo::new(pool.clone());
        let cron_job_repo = CronJobRepo::new(pool.clone());
        let mcp_server_repo = McpServerRepo::new(pool.clone());
        let channel_plugin_repo = ChannelPluginRepo::new(pool.clone());
        let extension_repo = ExtensionRepo::new(pool.clone());

        Self {
            db_pool: pool,
            event_bus,
            chat_service,
            message_service,
            user_repo,
            assistant_plugin_repo,
            cron_job_repo,
            mcp_server_repo,
            channel_plugin_repo,
            extension_repo,
        }
    }
}
