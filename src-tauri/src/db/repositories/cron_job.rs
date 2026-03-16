use crate::error::{AppError, Result};
use crate::models::{CronJob, CreateCronJob, UpdateCronJob};
use sqlx::SqlitePool;

const SELECT_COLS: &str = "id, name, cron_expression, chat_id, agent_type, prompt, enabled, last_run, next_run, status, created_at, updated_at";

pub struct CronJobRepo {
    pool: SqlitePool,
}

impl CronJobRepo {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn insert(&self, id: &str, input: &CreateCronJob, now: i64) -> Result<()> {
        sqlx::query(
            "INSERT INTO cron_jobs (id, name, cron_expression, agent_type, prompt, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id)
        .bind(&input.name)
        .bind(&input.cron_expression)
        .bind(&input.agent_type)
        .bind(&input.prompt)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn find_by_id(&self, id: &str) -> Result<Option<CronJob>> {
        let sql = format!("SELECT {SELECT_COLS} FROM cron_jobs WHERE id = ?");
        Ok(sqlx::query_as::<_, CronJob>(&sql)
            .bind(id)
            .fetch_optional(&self.pool)
            .await?)
    }

    pub async fn find_by_id_required(&self, id: &str) -> Result<CronJob> {
        self.find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("CronJob {id}")))
    }

    pub async fn find_all(&self) -> Result<Vec<CronJob>> {
        let sql = format!("SELECT {SELECT_COLS} FROM cron_jobs ORDER BY created_at DESC");
        Ok(sqlx::query_as::<_, CronJob>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn find_enabled(&self) -> Result<Vec<CronJob>> {
        let sql = format!("SELECT {SELECT_COLS} FROM cron_jobs WHERE enabled = 1 ORDER BY next_run ASC");
        Ok(sqlx::query_as::<_, CronJob>(&sql)
            .fetch_all(&self.pool)
            .await?)
    }

    pub async fn update(&self, id: &str, updates: &UpdateCronJob, now: i64) -> Result<()> {
        let mut sets = vec!["updated_at = ?".to_string()];
        let mut binds: Vec<String> = vec![now.to_string()];

        if let Some(ref v) = updates.name {
            sets.push("name = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.cron_expression {
            sets.push("cron_expression = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(ref v) = updates.prompt {
            sets.push("prompt = ?".to_string());
            binds.push(v.clone());
        }
        if let Some(v) = updates.enabled {
            sets.push("enabled = ?".to_string());
            binds.push((v as i32).to_string());
        }

        let sql = format!("UPDATE cron_jobs SET {} WHERE id = ?", sets.join(", "));
        let mut query = sqlx::query(&sql);
        for b in &binds {
            query = query.bind(b);
        }
        query.bind(id).execute(&self.pool).await?;
        Ok(())
    }

    pub async fn update_last_run(&self, id: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE cron_jobs SET last_run = ?, updated_at = ? WHERE id = ?")
            .bind(now)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_next_run(&self, id: &str, next_run: i64, now: i64) -> Result<()> {
        sqlx::query("UPDATE cron_jobs SET next_run = ?, updated_at = ? WHERE id = ?")
            .bind(next_run)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn update_status(&self, id: &str, status: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE cron_jobs SET status = ?, updated_at = ? WHERE id = ?")
            .bind(status)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn link_chat(&self, id: &str, chat_id: &str, now: i64) -> Result<()> {
        sqlx::query("UPDATE cron_jobs SET chat_id = ?, updated_at = ? WHERE id = ?")
            .bind(chat_id)
            .bind(now)
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM cron_jobs WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
