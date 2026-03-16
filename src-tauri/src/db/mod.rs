pub mod migration;
pub mod repositories;

use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePool, SqlitePoolOptions, SqliteSynchronous};
use std::path::Path;
use crate::error::Result;

/// 初始化数据库连接池并运行迁移
pub async fn init_database(app_data_dir: &Path) -> Result<SqlitePool> {
    let db_path = app_data_dir.join("aionx.db");

    let connect_options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .journal_mode(SqliteJournalMode::Wal)
        .foreign_keys(true)
        .busy_timeout(std::time::Duration::from_secs(5))
        .synchronous(SqliteSynchronous::Normal);

    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect_with(connect_options)
        .await?;

    // 运行迁移
    migration::run_migrations(&pool).await?;

    tracing::info!("Database initialized at {}", db_path.display());
    Ok(pool)
}
