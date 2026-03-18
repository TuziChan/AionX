use crate::models::{GeminiSettings, GoogleAuthStatus};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const GEMINI_SETTINGS_KEY: &str = "gemini.config";
const GOOGLE_ACCOUNT_KEY: &str = "gemini.currentGoogleAccount";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct StoredGeminiSettings {
    #[serde(flatten)]
    snapshot: GeminiSettings,
    #[serde(rename = "accountProjects", default)]
    account_projects: HashMap<String, String>,
}

#[tauri::command]
#[specta::specta]
pub async fn get_gemini_settings(app_handle: AppHandle) -> Result<GeminiSettings, String> {
    let stored = load_stored_gemini_settings(&app_handle)?;
    let current_account = load_current_google_account(&app_handle)?;
    Ok(build_snapshot_for_account(&stored, current_account.as_deref()))
}

#[tauri::command]
#[specta::specta]
pub async fn save_gemini_settings(
    app_handle: AppHandle,
    settings: GeminiSettings,
) -> Result<GeminiSettings, String> {
    let mut stored = load_stored_gemini_settings(&app_handle)?;
    stored.snapshot = normalize_snapshot(settings);

    if let Some(account) = load_current_google_account(&app_handle)? {
        sync_project_binding(&mut stored, &account);
    }

    save_stored_gemini_settings(&app_handle, &stored)?;
    let current_account = load_current_google_account(&app_handle)?;
    Ok(build_snapshot_for_account(&stored, current_account.as_deref()))
}

#[tauri::command]
#[specta::specta]
pub async fn get_google_auth_status(app_handle: AppHandle) -> Result<GoogleAuthStatus, String> {
    let stored = load_stored_gemini_settings(&app_handle)?;
    let current_account = load_current_google_account(&app_handle)?;
    Ok(build_auth_status(&stored, current_account.as_deref()))
}

#[tauri::command]
#[specta::specta]
pub async fn start_google_auth(app_handle: AppHandle, email: String) -> Result<GoogleAuthStatus, String> {
    let next_email = normalize_optional_text(Some(email))
        .ok_or_else(|| "Google 账号邮箱不能为空".to_string())?;
    let stored = load_stored_gemini_settings(&app_handle)?;
    save_current_google_account(&app_handle, Some(&next_email))?;
    Ok(build_auth_status(&stored, Some(next_email.as_str())))
}

#[tauri::command]
#[specta::specta]
pub async fn logout_google_auth(app_handle: AppHandle) -> Result<GoogleAuthStatus, String> {
    let stored = load_stored_gemini_settings(&app_handle)?;
    save_current_google_account(&app_handle, None)?;
    Ok(build_auth_status(&stored, None))
}

fn load_stored_gemini_settings(app_handle: &AppHandle) -> Result<StoredGeminiSettings, String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let Some(value) = store.get(GEMINI_SETTINGS_KEY) else {
        return Ok(StoredGeminiSettings::default());
    };

    if value.is_null() {
        return Ok(StoredGeminiSettings::default());
    }

    let stored: StoredGeminiSettings =
        serde_json::from_value(value).map_err(|error| format!("Invalid Gemini settings: {error}"))?;

    Ok(normalize_stored_settings(stored))
}

fn save_stored_gemini_settings(app_handle: &AppHandle, settings: &StoredGeminiSettings) -> Result<(), String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let serialized = serde_json::to_value(settings).map_err(|error| error.to_string())?;
    store.set(GEMINI_SETTINGS_KEY, serialized);
    store.save().map_err(|error| error.to_string())?;
    Ok(())
}

fn load_current_google_account(app_handle: &AppHandle) -> Result<Option<String>, String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let Some(value) = store.get(GOOGLE_ACCOUNT_KEY) else {
        return Ok(None);
    };

    Ok(normalize_optional_text(value.as_str().map(ToOwned::to_owned)))
}

fn save_current_google_account(app_handle: &AppHandle, email: Option<&str>) -> Result<(), String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    store.set(
        GOOGLE_ACCOUNT_KEY,
        serde_json::Value::String(email.unwrap_or_default().to_string()),
    );
    store.save().map_err(|error| error.to_string())?;
    Ok(())
}

fn normalize_stored_settings(mut stored: StoredGeminiSettings) -> StoredGeminiSettings {
    stored.snapshot = normalize_snapshot(stored.snapshot);
    stored.account_projects = stored
        .account_projects
        .into_iter()
        .filter_map(|(email, project)| {
            let normalized_email = normalize_optional_text(Some(email))?;
            let normalized_project = normalize_optional_text(Some(project))?;
            Some((normalized_email, normalized_project))
        })
        .collect();
    stored
}

fn normalize_snapshot(mut settings: GeminiSettings) -> GeminiSettings {
    settings.auth_type = normalize_optional_text(Some(settings.auth_type))
        .unwrap_or_else(|| "google-account".to_string());
    settings.proxy = settings.proxy.trim().to_string();
    settings.google_gemini_base_url = normalize_optional_text(settings.google_gemini_base_url);
    settings.google_cloud_project = normalize_optional_text(settings.google_cloud_project);
    settings.preferred_mode = normalize_optional_text(Some(settings.preferred_mode)).unwrap_or_default();
    settings
}

fn build_snapshot_for_account(stored: &StoredGeminiSettings, current_account: Option<&str>) -> GeminiSettings {
    let mut snapshot = stored.snapshot.clone();
    if let Some(account) = current_account {
        if let Some(project) = stored.account_projects.get(account) {
            snapshot.google_cloud_project = Some(project.clone());
        }
    }
    snapshot
}

fn build_auth_status(stored: &StoredGeminiSettings, current_account: Option<&str>) -> GoogleAuthStatus {
    let email = current_account.map(ToOwned::to_owned);
    let project_id = current_account
        .and_then(|account| stored.account_projects.get(account).cloned())
        .or_else(|| email.as_ref().and_then(|_| stored.snapshot.google_cloud_project.clone()));

    GoogleAuthStatus {
        connected: email.is_some(),
        email,
        project_id,
    }
}

fn sync_project_binding(stored: &mut StoredGeminiSettings, account: &str) {
    match stored.snapshot.google_cloud_project.clone() {
        Some(project) => {
            stored.account_projects.insert(account.to_string(), project);
        }
        None => {
            stored.account_projects.remove(account);
        }
    }
}

fn normalize_optional_text(value: Option<String>) -> Option<String> {
    value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
}
