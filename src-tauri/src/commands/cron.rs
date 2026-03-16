use crate::models::cron_job::{CreateCronJob, CronJob, CronJobUpdate};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn add_cron_job(
    state: State<'_, AppState>,
    input: CreateCronJob,
) -> Result<CronJob, String> {
    state.cron_service.create(input).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_cron_jobs(
    state: State<'_, AppState>,
) -> Result<Vec<CronJob>, String> {
    state.cron_service.list().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_cron_job(
    state: State<'_, AppState>,
    id: String,
) -> Result<CronJob, String> {
    state.cron_service.get(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_cron_job(
    state: State<'_, AppState>,
    id: String,
    updates: CronJobUpdate,
) -> Result<CronJob, String> {
    state.cron_service.update(&id, updates).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn remove_cron_job(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.cron_service.delete(&id).await.map_err(|e| e.to_string())
}
