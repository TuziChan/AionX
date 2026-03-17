use crate::commands::model::load_model_providers;
use crate::models::ImageGenerationSettings;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const IMAGE_GENERATION_SETTINGS_KEY: &str = "tools.imageGenerationModel";

#[tauri::command]
#[specta::specta]
pub async fn get_image_generation_settings(app_handle: AppHandle) -> Result<ImageGenerationSettings, String> {
    let current = load_image_generation_settings(&app_handle)?;
    normalize_image_generation_settings(&app_handle, current)
}

#[tauri::command]
#[specta::specta]
pub async fn save_image_generation_settings(
    app_handle: AppHandle,
    settings: ImageGenerationSettings,
) -> Result<ImageGenerationSettings, String> {
    let next = normalize_image_generation_settings(&app_handle, settings)?;
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let serialized = serde_json::to_value(&next).map_err(|error| error.to_string())?;
    store.set(IMAGE_GENERATION_SETTINGS_KEY, serialized);
    store.save().map_err(|error| error.to_string())?;
    Ok(next)
}

fn load_image_generation_settings(app_handle: &AppHandle) -> Result<ImageGenerationSettings, String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let Some(value) = store.get(IMAGE_GENERATION_SETTINGS_KEY) else {
        return Ok(ImageGenerationSettings {
            enabled: false,
            provider_id: None,
            model_name: None,
        });
    };

    if value.is_null() {
        return Ok(ImageGenerationSettings {
            enabled: false,
            provider_id: None,
            model_name: None,
        });
    }

    if let Ok(settings) = serde_json::from_value::<ImageGenerationSettings>(value.clone()) {
        return Ok(settings);
    }

    parse_legacy_image_generation_settings(value)
}

fn parse_legacy_image_generation_settings(value: serde_json::Value) -> Result<ImageGenerationSettings, String> {
    let object = value
        .as_object()
        .ok_or_else(|| "Invalid image generation settings payload".to_string())?;

    let enabled = object.get("switch").and_then(|value| value.as_bool()).unwrap_or(false);
    let provider_id = object.get("id").and_then(|value| value.as_str()).map(ToOwned::to_owned);
    let model_name = object
        .get("useModel")
        .and_then(|value| value.as_str())
        .map(ToOwned::to_owned);

    Ok(ImageGenerationSettings {
        enabled,
        provider_id,
        model_name,
    })
}

fn normalize_image_generation_settings(
    app_handle: &AppHandle,
    settings: ImageGenerationSettings,
) -> Result<ImageGenerationSettings, String> {
    let provider_id = settings
        .provider_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned);
    let model_name = settings
        .model_name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned);

    match (&provider_id, &model_name) {
        (None, None) => {
            return Ok(ImageGenerationSettings {
                enabled: false,
                provider_id: None,
                model_name: None,
            })
        }
        (Some(_), None) | (None, Some(_)) => {
            return Err("图像生成设置必须同时指定平台和模型".into())
        }
        _ => {}
    }

    let providers = load_model_providers(app_handle)?;
    let provider = providers
        .iter()
        .find(|provider| provider.id == provider_id.clone().unwrap_or_default())
        .ok_or_else(|| "图像生成设置引用了不存在的模型平台".to_string())?;

    let target_model = model_name.clone().unwrap_or_default();
    if !provider.model.iter().any(|model| model == &target_model) {
        return Err("图像生成设置引用了不存在的模型".into());
    }

    Ok(ImageGenerationSettings {
        enabled: settings.enabled,
        provider_id,
        model_name,
    })
}
