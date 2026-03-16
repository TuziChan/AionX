pub mod chat;
pub mod message;

pub use chat::ChatService;
pub use message::MessageService;

// 阶段4 扩展的 Service:
// pub mod auth;      // WebUI 认证
// pub mod cron;      // 定时任务
// pub mod mcp;       // MCP 集成
// pub mod channel;   // 通道管理
// pub mod extension; // 扩展系统
// pub mod file;      // 文件操作
