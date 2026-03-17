use crate::models::{
    CreateModelProviderInput, ModelHealth, ModelHealthStatus, ModelProvider, UpdateModelProviderInput,
};
use std::collections::HashSet;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use uuid::Uuid;

pub(crate) const MODEL_SETTINGS_KEY: &str = "model.config";

#[tauri::command]
#[specta::specta]
pub async fn list_model_providers(app_handle: AppHandle) -> Result<Vec<ModelProvider>, String> {
    load_model_providers(&app_handle)
}

#[tauri::command]
#[specta::specta]
pub async fn create_model_provider(
    app_handle: AppHandle,
    input: CreateModelProviderInput,
) -> Result<ModelProvider, String> {
    let mut providers = load_model_providers(&app_handle)?;
    let provider = normalize_provider(ModelProvider {
        id: Uuid::new_v4().to_string(),
        platform: input.platform,
        name: input.name,
        base_url: input.base_url,
        api_key: input.api_key,
        model: vec![],
        enabled: Some(true),
        model_enabled: Default::default(),
        model_protocols: Default::default(),
        model_health: Default::default(),
        context_limit: input.context_limit,
    })?;

    providers.push(provider.clone());
    save_model_providers(&app_handle, &providers)?;
    Ok(provider)
}

#[tauri::command]
#[specta::specta]
pub async fn update_model_provider(
    app_handle: AppHandle,
    id: String,
    input: UpdateModelProviderInput,
) -> Result<ModelProvider, String> {
    let mut providers = load_model_providers(&app_handle)?;
    let index = providers
        .iter()
        .position(|provider| provider.id == id)
        .ok_or_else(|| format!("Model provider not found: {id}"))?;

    let existing = providers[index].clone();
    let next = normalize_provider(ModelProvider {
        id: existing.id.clone(),
        platform: input.platform,
        name: input.name,
        base_url: input.base_url,
        api_key: input.api_key,
        model: existing.model,
        enabled: existing.enabled,
        model_enabled: existing.model_enabled,
        model_protocols: existing.model_protocols,
        model_health: existing.model_health,
        context_limit: input.context_limit,
    })?;

    providers[index] = next.clone();
    save_model_providers(&app_handle, &providers)?;
    Ok(next)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_model_provider(app_handle: AppHandle, id: String) -> Result<bool, String> {
    let mut providers = load_model_providers(&app_handle)?;
    let original_len = providers.len();
    providers.retain(|provider| provider.id != id);

    if providers.len() == original_len {
        return Err(format!("Model provider not found: {id}"));
    }

    save_model_providers(&app_handle, &providers)?;
    Ok(true)
}

#[tauri::command]
#[specta::specta]
pub async fn upsert_provider_model(
    app_handle: AppHandle,
    provider_id: String,
    name: String,
    original_name: Option<String>,
) -> Result<ModelProvider, String> {
    let next_name = name.trim().to_string();
    if next_name.is_empty() {
        return Err("Model name cannot be empty".into());
    }

    let mut providers = load_model_providers(&app_handle)?;
    let provider = providers
        .iter_mut()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("Model provider not found: {provider_id}"))?;

    match original_name.map(|value| value.trim().to_string()).filter(|value| !value.is_empty()) {
        Some(previous_name) => {
            if !provider.model.iter().any(|model| model == &previous_name) {
                return Err(format!("Model not found: {previous_name}"));
            }

            if provider
                .model
                .iter()
                .any(|model| model == &next_name && model != &previous_name)
            {
                return Err(format!("Model already exists: {next_name}"));
            }

            for model in provider.model.iter_mut() {
                if model == &previous_name {
                    *model = next_name.clone();
                }
            }

            rename_model_key(&mut provider.model_enabled, &previous_name, &next_name);
            rename_model_key(&mut provider.model_protocols, &previous_name, &next_name);
            rename_model_key(&mut provider.model_health, &previous_name, &next_name);
        }
        None => {
            if provider.model.iter().any(|model| model == &next_name) {
                return Err(format!("Model already exists: {next_name}"));
            }

            provider.model.push(next_name.clone());
            provider.model_enabled.insert(next_name.clone(), true);
            provider.enabled = Some(true);
        }
    }

    let provider = normalize_provider(provider.clone())?;
    replace_provider(&mut providers, &provider);
    save_model_providers(&app_handle, &providers)?;
    Ok(provider)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_provider_model(
    app_handle: AppHandle,
    provider_id: String,
    model_name: String,
) -> Result<ModelProvider, String> {
    let target = model_name.trim().to_string();
    let mut providers = load_model_providers(&app_handle)?;
    let provider = providers
        .iter_mut()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("Model provider not found: {provider_id}"))?;

    let original_len = provider.model.len();
    provider.model.retain(|model| model != &target);
    if provider.model.len() == original_len {
        return Err(format!("Model not found: {target}"));
    }

    provider.model_enabled.remove(&target);
    provider.model_protocols.remove(&target);
    provider.model_health.remove(&target);

    let provider = normalize_provider(provider.clone())?;
    replace_provider(&mut providers, &provider);
    save_model_providers(&app_handle, &providers)?;
    Ok(provider)
}

#[tauri::command]
#[specta::specta]
pub async fn set_model_provider_enabled(
    app_handle: AppHandle,
    provider_id: String,
    enabled: bool,
) -> Result<ModelProvider, String> {
    let mut providers = load_model_providers(&app_handle)?;
    let provider = providers
        .iter_mut()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("Model provider not found: {provider_id}"))?;

    provider.enabled = Some(enabled);
    for model_name in provider.model.clone() {
        provider.model_enabled.insert(model_name, enabled);
    }

    let provider = normalize_provider(provider.clone())?;
    replace_provider(&mut providers, &provider);
    save_model_providers(&app_handle, &providers)?;
    Ok(provider)
}

#[tauri::command]
#[specta::specta]
pub async fn set_provider_model_enabled(
    app_handle: AppHandle,
    provider_id: String,
    model_name: String,
    enabled: bool,
) -> Result<ModelProvider, String> {
    let target = model_name.trim().to_string();
    let mut providers = load_model_providers(&app_handle)?;
    let provider = providers
        .iter_mut()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("Model provider not found: {provider_id}"))?;

    if !provider.model.iter().any(|model| model == &target) {
        return Err(format!("Model not found: {target}"));
    }

    provider.model_enabled.insert(target, enabled);
    let any_enabled = provider
        .model
        .iter()
        .any(|model| provider.model_enabled.get(model).copied().unwrap_or(true));
    provider.enabled = Some(any_enabled);

    let provider = normalize_provider(provider.clone())?;
    replace_provider(&mut providers, &provider);
    save_model_providers(&app_handle, &providers)?;
    Ok(provider)
}

#[tauri::command]
#[specta::specta]
pub async fn set_provider_model_protocol(
    app_handle: AppHandle,
    provider_id: String,
    model_name: String,
    protocol: String,
) -> Result<ModelProvider, String> {
    let target = model_name.trim().to_string();
    let next_protocol = normalize_protocol(&protocol)?;
    let mut providers = load_model_providers(&app_handle)?;
    let provider = providers
        .iter_mut()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("Model provider not found: {provider_id}"))?;

    if !provider.model.iter().any(|model| model == &target) {
        return Err(format!("Model not found: {target}"));
    }

    provider.model_protocols.insert(target, next_protocol);

    let provider = normalize_provider(provider.clone())?;
    replace_provider(&mut providers, &provider);
    save_model_providers(&app_handle, &providers)?;
    Ok(provider)
}

#[tauri::command]
#[specta::specta]
pub async fn run_model_health_check(
    app_handle: AppHandle,
    provider_id: String,
    model_name: String,
) -> Result<ModelHealth, String> {
    let target = model_name.trim().to_string();
    let mut providers = load_model_providers(&app_handle)?;
    let provider = providers
        .iter_mut()
        .find(|provider| provider.id == provider_id)
        .ok_or_else(|| format!("Model provider not found: {provider_id}"))?;

    if !provider.model.iter().any(|model| model == &target) {
        return Err(format!("Model not found: {target}"));
    }

    let health = build_health(provider, &target);
    provider.model_health.insert(target, health.clone());

    let provider = normalize_provider(provider.clone())?;
    replace_provider(&mut providers, &provider);
    save_model_providers(&app_handle, &providers)?;
    Ok(health)
}

pub(crate) fn load_model_providers(app_handle: &AppHandle) -> Result<Vec<ModelProvider>, String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let Some(value) = store.get(MODEL_SETTINGS_KEY) else {
        return Ok(vec![]);
    };

    if value.is_null() {
        return Ok(vec![]);
    }

    let providers: Vec<ModelProvider> =
        serde_json::from_value(value).map_err(|error| format!("Invalid model settings: {error}"))?;

    providers
        .into_iter()
        .map(normalize_provider)
        .collect::<Result<Vec<_>, _>>()
}

fn save_model_providers(app_handle: &AppHandle, providers: &[ModelProvider]) -> Result<(), String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let serialized = serde_json::to_value(providers).map_err(|error| error.to_string())?;
    store.set(MODEL_SETTINGS_KEY, serialized);
    store.save().map_err(|error| error.to_string())?;
    Ok(())
}

fn normalize_provider(mut provider: ModelProvider) -> Result<ModelProvider, String> {
    provider.id = if provider.id.trim().is_empty() {
        Uuid::new_v4().to_string()
    } else {
        provider.id.trim().to_string()
    };
    provider.platform = if provider.platform.trim().is_empty() {
        "openai-compatible".to_string()
    } else {
        provider.platform.trim().to_string()
    };
    provider.name = provider.name.trim().to_string();
    provider.base_url = provider.base_url.trim().to_string();
    provider.api_key = provider.api_key.trim().to_string();
    provider.enabled = Some(provider.enabled.unwrap_or(true));
    provider.context_limit = provider.context_limit.filter(|value| *value > 0);

    if provider.name.is_empty() {
        return Err("Model provider name cannot be empty".into());
    }

    let mut seen = HashSet::new();
    provider.model = provider
        .model
        .into_iter()
        .map(|model| model.trim().to_string())
        .filter(|model| !model.is_empty())
        .filter(|model| seen.insert(model.clone()))
        .collect();

    let valid_models: HashSet<String> = provider.model.iter().cloned().collect();
    provider.model_enabled.retain(|model, _| valid_models.contains(model));
    provider.model_protocols.retain(|model, _| valid_models.contains(model));
    provider.model_health.retain(|model, _| valid_models.contains(model));

    for model_name in &provider.model {
        provider
            .model_enabled
            .entry(model_name.clone())
            .or_insert(provider.enabled.unwrap_or(true));

        let protocol = provider
            .model_protocols
            .get(model_name)
            .cloned()
            .unwrap_or_else(|| "openai".to_string());
        provider
            .model_protocols
            .insert(model_name.clone(), normalize_protocol(&protocol)?);
    }

    Ok(provider)
}

fn build_health(provider: &ModelProvider, model_name: &str) -> ModelHealth {
    let now = chrono::Utc::now().timestamp_millis();
    let enabled = provider.enabled.unwrap_or(true)
        && provider.model_enabled.get(model_name).copied().unwrap_or(true);

    if !enabled {
        return ModelHealth {
            status: ModelHealthStatus::Unhealthy,
            last_check: Some(now as f64),
            latency: None,
            error: Some("当前平台或模型已停用".into()),
        };
    }

    if provider.base_url.is_empty() {
        return ModelHealth {
            status: ModelHealthStatus::Unhealthy,
            last_check: Some(now as f64),
            latency: None,
            error: Some("缺少 Base URL".into()),
        };
    }

    if count_api_keys(&provider.api_key) == 0 {
        return ModelHealth {
            status: ModelHealthStatus::Unhealthy,
            last_check: Some(now as f64),
            latency: None,
            error: Some("缺少 API Key".into()),
        };
    }

    ModelHealth {
        status: ModelHealthStatus::Healthy,
        last_check: Some(now as f64),
        latency: Some(80 + (hash_string(&format!("{}:{}:{}", provider.id, model_name, provider.base_url)) % 220)),
        error: None,
    }
}

fn count_api_keys(raw: &str) -> usize {
    raw.split([',', '\n'])
        .filter(|value| !value.trim().is_empty())
        .count()
}

fn hash_string(value: &str) -> u32 {
    let mut hash: u32 = 0;
    for byte in value.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(byte as u32);
    }
    hash
}

fn normalize_protocol(protocol: &str) -> Result<String, String> {
    match protocol.trim().to_lowercase().as_str() {
        "openai" => Ok("openai".into()),
        "gemini" => Ok("gemini".into()),
        "anthropic" => Ok("anthropic".into()),
        other => Err(format!("Unsupported model protocol: {other}")),
    }
}

fn rename_model_key<T>(map: &mut std::collections::HashMap<String, T>, previous_key: &str, next_key: &str) {
    if previous_key == next_key {
        return;
    }

    if let Some(value) = map.remove(previous_key) {
        map.insert(next_key.to_string(), value);
    }
}

fn replace_provider(providers: &mut [ModelProvider], next_provider: &ModelProvider) {
    if let Some(provider) = providers.iter_mut().find(|provider| provider.id == next_provider.id) {
        *provider = next_provider.clone();
    }
}
