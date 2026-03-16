use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct CronJob {
    pub id: String,
    pub name: String,
    pub cron_expression: String,
    pub chat_id: Option<String>,
    pub agent_type: String,
    pub prompt: String,
    pub enabled: bool,
    #[specta(type = Option<f64>)]
    pub last_run: Option<i64>,
    #[specta(type = Option<f64>)]
    pub next_run: Option<i64>,
    pub status: String,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CreateCronJob {
    pub name: String,
    pub cron_expression: String,
    pub agent_type: String,
    pub prompt: String,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CronJobUpdate {
    pub name: Option<String>,
    pub cron_expression: Option<String>,
    pub prompt: Option<String>,
    pub enabled: Option<bool>,
    pub status: Option<String>,
    pub last_run: Option<i64>,
    pub next_run: Option<i64>,
}
