use crate::dao::ExtensionDao;
use crate::models::extension::{Extension, ExtensionSettingsHostContext, ExtensionSettingsTab, ExtensionUpdate};
use crate::state::AppState;
use serde_json::Value;
use tauri::State;

#[tauri::command]
#[specta::specta]
pub async fn list_extensions(
    state: State<'_, AppState>,
) -> Result<Vec<Extension>, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    dao.find_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_extension(
    state: State<'_, AppState>,
    id: String,
    updates: ExtensionUpdate,
) -> Result<bool, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    dao.update(&id, &updates).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_extension_settings_tabs(
    state: State<'_, AppState>,
) -> Result<Vec<ExtensionSettingsTab>, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    let extensions = dao.find_all().await.map_err(|e| e.to_string())?;
    Ok(extensions.into_iter().map(map_extension_settings_tab).collect())
}

#[tauri::command]
#[specta::specta]
pub async fn get_extension_settings_tab(
    state: State<'_, AppState>,
    tab_id: String,
) -> Result<ExtensionSettingsTab, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    let extensions = dao.find_all().await.map_err(|e| e.to_string())?;

    extensions
        .into_iter()
        .map(map_extension_settings_tab)
        .find(|tab| tab.tab_id == tab_id)
        .ok_or_else(|| format!("未找到扩展设置页：{tab_id}"))
}

#[tauri::command]
#[specta::specta]
pub async fn set_extension_enabled(
    state: State<'_, AppState>,
    extension_id: String,
    enabled: bool,
) -> Result<Extension, String> {
    let dao = ExtensionDao::new(state.db_pool.clone());
    let updates = ExtensionUpdate {
        name: None,
        version: None,
        description: None,
        enabled: Some(enabled),
        config: None,
    };

    dao.update(&extension_id, &updates)
        .await
        .map_err(|e| e.to_string())?;

    dao.find_by_id(&extension_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("未找到扩展：{extension_id}"))
}

#[tauri::command]
#[specta::specta]
pub async fn get_extension_host_context(
    state: State<'_, AppState>,
    tab_id: String,
) -> Result<Option<ExtensionSettingsHostContext>, String> {
    let tab = get_extension_settings_tab(state, tab_id).await?;
    Ok(tab.host)
}

fn map_extension_settings_tab(extension: Extension) -> ExtensionSettingsTab {
    let parsed_config = extension
        .config
        .as_deref()
        .and_then(parse_config_value);

    ExtensionSettingsTab {
        tab_id: extract_tab_id(&extension, parsed_config.as_ref()),
        extension_id: extension.id.clone(),
        name: extension.name.clone(),
        version: extension.version.clone(),
        description: extension.description.clone(),
        path: extension.path.clone(),
        enabled: extension.enabled,
        config: extension.config.clone(),
        host: extract_host_context(parsed_config.as_ref()),
    }
}

fn parse_config_value(config: &str) -> Option<Value> {
    let trimmed = config.trim();
    if trimmed.is_empty() {
        return None;
    }

    serde_json::from_str::<Value>(trimmed).ok()
}

fn extract_tab_id(extension: &Extension, config: Option<&Value>) -> String {
    find_string_by_path(config, &[&["settings", "tabId"], &["settings", "tab_id"], &["settingsTabId"], &["settings_tab_id"]])
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| extension.id.clone())
}

fn extract_host_context(config: Option<&Value>) -> Option<ExtensionSettingsHostContext> {
    let entry_url = find_string_by_path(
        config,
        &[
            &["settings", "host", "entryUrl"],
            &["settings", "host", "entry_url"],
            &["settings", "entryUrl"],
            &["settings", "entry_url"],
            &["settingsUrl"],
            &["settings_url"],
            &["entryUrl"],
            &["entry_url"],
        ],
    )?;

    if entry_url.trim().is_empty() {
        return None;
    }

    Some(ExtensionSettingsHostContext {
        mode: "iframe".to_string(),
        entry_url,
    })
}

fn find_string_by_path(config: Option<&Value>, paths: &[&[&str]]) -> Option<String> {
    let root = config?;

    paths.iter().find_map(|segments| {
        let mut current = root;
        for segment in *segments {
            current = current.get(*segment)?;
        }
        current.as_str().map(|value| value.to_string())
    })
}
