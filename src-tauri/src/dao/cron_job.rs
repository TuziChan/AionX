use crate::error::{AppError, Result};
use crate::models::cron_job::{CreateCronJob, CronJob, CronJobUpdate};
use sqlx::{QueryBuilder, Sqlite, SqlitePool};

const COLUMNS: &str = "id, name, cron_expression, chat_id, agent_type, prompt, enabled, last_run, next_run, status, created_at, updated_at";

pub struct CronJobDao {
    pool: SqlitePool,
}

impl CronJobDao {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, input: &CreateCronJob) -> Result<CronJob> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp();

        sqlx::query(
            "INSERT INTO cron_jobs (id, name, cron_expression, agent_type, prompt, enabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&input.name)
        .bind(&input.cron_expression)
        .bind(&input.agent_type)
        .bind(&input.prompt)
        .bind(input.enabled.unwrap_or(true))
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;

        self.find_by_id(&id).await?.ok_or_else(|| {
            AppError::Internal("Failed to retrieve created cron job".into())
        })
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<CronJob>> {
        let sql = format!("SELECT {COLUMNS} FROM cron_jobs WHERE id = ?");
        let job = sqlx::query_as::<_, CronJob>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(job)
    }

    pub async fn find_all(&self) -> Result<Vec<CronJob>> {
        let sql = format!("SELECT {COLUMNS} FROM cron_jobs ORDER BY created_at DESC");
        let jobs = sqlx::query_as::<_, CronJob>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(jobs)
    }

    pub async fn find_enabled(&self) -> Result<Vec<CronJob>> {
        let sql = format!("SELECT {COLUMNS} FROM cron_jobs WHERE enabled = 1 ORDER BY next_run ASC");
        let jobs = sqlx::query_as::<_, CronJob>(&sql)
            .fetch_all(&self.pool)
            .await?;
        Ok(jobs)
    }

    pub async fn update(&self, id: &str, updates: &CronJobUpdate) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut qb: QueryBuilder<Sqlite> = QueryBuilder::new("UPDATE cron_jobs SET updated_at = ");
        qb.push_bind(now);

        if let Some(ref name) = updates.name {
            qb.push(", name = ").push_bind(name.clone());
        }
        if let Some(ref expr) = updates.cron_expression {
            qb.push(", cron_expression = ").push_bind(expr.clone());
        }
        if let Some(ref prompt) = updates.prompt {
            qb.push(", prompt = ").push_bind(prompt.clone());
        }
        if let Some(enabled) = updates.enabled {
            qb.push(", enabled = ").push_bind(enabled);
        }
        if let Some(ref status) = updates.status {
            qb.push(", status = ").push_bind(status.clone());
        }
        if let Some(last_run) = updates.last_run {
            qb.push(", last_run = ").push_bind(last_run);
        }
        if let Some(next_run) = updates.next_run {
            qb.push(", next_run = ").push_bind(next_run);
        }

        qb.push(" WHERE id = ").push_bind(id.to_string());
        let result = qb.build().execute(&self.pool).await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM cron_jobs WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
