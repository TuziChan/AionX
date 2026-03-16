use std::sync::Arc;
use tokio::sync::RwLock;
use sqlx::SqlitePool;

/// 全局应用状态
#[derive(Clone)]
pub struct AppState {
    /// 数据库连接池
    pub db_pool: SqlitePool,

    /// 配置存储
    pub config: Arc<RwLock<AppConfig>>,
}

impl AppState {
    pub fn new(db_pool: SqlitePool) -> Self {
        Self {
            db_pool,
            config: Arc::new(RwLock::new(AppConfig::default())),
        }
    }
}

/// 应用配置
#[derive(Debug, Clone, Default)]
pub struct AppConfig {
    pub theme: String,
    pub language: String,
}
