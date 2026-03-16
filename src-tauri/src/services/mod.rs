pub mod chat;
pub mod message;

pub use chat::ChatService;
pub use message::MessageService;

// 后续阶段扩展的 Service（当前 DAO 已就绪）:
// pub mod user;     // WebUI 认证 - 阶段4
// pub mod cron;     // 定时任务 - 阶段4
// pub mod mcp;      // MCP 集成 - 阶段4
// pub mod channel;  // 通道管理 - 阶段4
// pub mod extension;// 扩展系统 - 阶段4
