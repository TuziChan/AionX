use crate::models::channel::{ChannelPlugin, ChannelPluginUpdate, CreateChannelPlugin};
use crate::state::AppState;
use tauri::State;
use serde_json::Value;

#[tauri::command]
#[specta::specta]
pub async fn list_channel_plugins(
    state: State<'_, AppState>,
) -> Result<Vec<ChannelPlugin>, String> {
    state
        .channel_service
        .list_plugins()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_channel_plugin(
    state: State<'_, AppState>,
    input: CreateChannelPlugin,
) -> Result<ChannelPlugin, String> {
    validate_channel_plugin_config_payload(&input.plugin_type, input.config.as_deref())?;
    state
        .channel_service
        .create_plugin(input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_channel_plugin(
    state: State<'_, AppState>,
    id: String,
    updates: ChannelPluginUpdate,
) -> Result<(), String> {
    if let Some(config) = updates.config.as_deref() {
        let plugin = state
            .channel_service
            .get_plugin(&id)
            .await
            .map_err(|e| e.to_string())?;
        validate_channel_plugin_config_payload(&plugin.plugin_type, Some(config))?;
    }

    state
        .channel_service
        .update_plugin(&id, updates)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_channel_plugin(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state
        .channel_service
        .delete_plugin(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn validate_channel_plugin_config(
    plugin_type: String,
    config: Option<String>,
) -> Result<(), String> {
    validate_channel_plugin_config_payload(&plugin_type, config.as_deref())
}

fn validate_channel_plugin_config_payload(plugin_type: &str, config: Option<&str>) -> Result<(), String> {
    let raw = config.unwrap_or("{}").trim();
    let parsed: Value = serde_json::from_str(raw).map_err(|error| format!("频道配置必须是有效 JSON: {error}"))?;
    let object = parsed
        .as_object()
        .ok_or_else(|| "频道配置必须是 JSON 对象".to_string())?;

    match plugin_type.trim().to_lowercase().as_str() {
        "telegram" => require_keys(object, &["botToken"])?,
        "lark" => require_keys(object, &["appId", "appSecret"])?,
        "dingtalk" => require_keys(object, &["appKey", "appSecret"])?,
        "slack" => require_keys(object, &["botToken"])?,
        "discord" => require_keys(object, &["botToken"])?,
        other => return Err(format!("Unsupported channel plugin type: {other}")),
    }

    Ok(())
}

fn require_keys(
    object: &serde_json::Map<String, Value>,
    required_keys: &[&str],
) -> Result<(), String> {
    for key in required_keys {
        let valid = object
            .get(*key)
            .and_then(|value| value.as_str())
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .is_some();

        if !valid {
            return Err(format!("频道配置缺少必填字段: {key}"));
        }
    }

    Ok(())
}
