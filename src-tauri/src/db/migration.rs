use sqlx::SqlitePool;
use crate::error::Result;

struct Migration {
    version: u32,
    description: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        description: "Initial schema",
        sql: include_str!("../../migrations/001_initial.sql"),
    },
];

pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    // 确保迁移跟踪表存在
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            description TEXT NOT NULL,
            applied_at INTEGER NOT NULL DEFAULT (unixepoch())
        );"
    )
    .execute(pool)
    .await?;

    let current_version: (i64,) = sqlx::query_as(
        "SELECT COALESCE(MAX(version), 0) FROM _migrations"
    )
    .fetch_one(pool)
    .await?;

    for migration in MIGRATIONS {
        if migration.version as i64 > current_version.0 {
            tracing::info!(
                "Running migration v{}: {}",
                migration.version,
                migration.description
            );

            sqlx::raw_sql(migration.sql).execute(pool).await?;

            sqlx::query(
                "INSERT OR IGNORE INTO _migrations (version, description) VALUES (?, ?)"
            )
            .bind(migration.version as i64)
            .bind(migration.description)
            .execute(pool)
            .await?;

            tracing::info!("Migration v{} applied successfully", migration.version);
        }
    }

    Ok(())
}
