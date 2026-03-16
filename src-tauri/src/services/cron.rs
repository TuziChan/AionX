use crate::dao::CronJobDao;
use crate::error::{AppError, Result};
use crate::models::cron_job::{CreateCronJob, CronJob, CronJobUpdate};
use sqlx::SqlitePool;

pub struct CronService {
    dao: CronJobDao,
}

impl CronService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            dao: CronJobDao::new(pool),
        }
    }

    pub async fn create(&self, input: CreateCronJob) -> Result<CronJob> {
        // 验证 cron 表达式合法性
        if input.cron_expression.is_empty() {
            return Err(AppError::InvalidInput("Cron expression cannot be empty".into()));
        }
        self.dao.insert(&input).await
    }

    pub async fn list(&self) -> Result<Vec<CronJob>> {
        self.dao.find_all().await
    }

    pub async fn get(&self, id: &str) -> Result<CronJob> {
        self.dao.find_by_id(id).await?.ok_or_else(|| {
            AppError::NotFound(format!("CronJob {}", id))
        })
    }

    pub async fn update(&self, id: &str, updates: CronJobUpdate) -> Result<CronJob> {
        self.dao.update(id, &updates).await?;
        self.get(id).await
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        self.dao.delete(id).await?;
        Ok(())
    }

    pub async fn get_enabled(&self) -> Result<Vec<CronJob>> {
        self.dao.find_enabled().await
    }
}
