use crate::dao::AssistantPluginDao;
use crate::models::agent::{BuiltinAssistant, BuiltinAssistantPreferences};
use crate::models::assistant_plugin::{AssistantPlugin, AssistantPluginUpdate, CreateAssistantPlugin};
use serde_json::Value;
use crate::state::AppState;
use tauri::AppHandle;
use tauri::State;
use tauri_plugin_store::StoreExt;

const BUILTIN_ASSISTANT_PREFIX: &str = "assistant.builtin.";

#[tauri::command]
#[specta::specta]
pub async fn list_assistant_plugins(
    state: State<'_, AppState>,
) -> Result<Vec<AssistantPlugin>, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.find_all().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn create_assistant_plugin(
    state: State<'_, AppState>,
    input: CreateAssistantPlugin,
) -> Result<AssistantPlugin, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.insert(&input).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_assistant_plugin(
    state: State<'_, AppState>,
    id: String,
    updates: AssistantPluginUpdate,
) -> Result<bool, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.update(&id, &updates).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn remove_assistant_plugin(
    state: State<'_, AppState>,
    id: String,
) -> Result<bool, String> {
    let dao = AssistantPluginDao::new(state.db_pool.clone());
    dao.delete(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn list_builtin_assistants(app_handle: AppHandle) -> Result<Vec<BuiltinAssistant>, String> {
    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;

    builtin_assistant_catalog()
        .into_iter()
        .map(|assistant| {
            let key = builtin_assistant_key(&assistant.id);
            Ok(merge_builtin_preferences(assistant, store.get(&key)))
        })
        .collect()
}

#[tauri::command]
#[specta::specta]
pub async fn save_builtin_assistant_preferences(
    app_handle: AppHandle,
    id: String,
    preferences: BuiltinAssistantPreferences,
) -> Result<BuiltinAssistant, String> {
    let assistant = builtin_assistant_catalog()
        .into_iter()
        .find(|item| item.id == id)
        .ok_or_else(|| format!("Unknown builtin assistant: {id}"))?;

    let normalized = BuiltinAssistantPreferences {
        main_agent: normalize_text(Some(preferences.main_agent))
            .unwrap_or_else(|| assistant.main_agent.clone()),
        enabled: preferences.enabled,
    };

    let store = app_handle.store("config.json").map_err(|error| error.to_string())?;
    let serialized = serde_json::to_value(&normalized).map_err(|error| error.to_string())?;
    store.set(&builtin_assistant_key(&assistant.id), serialized);
    store.save().map_err(|error| error.to_string())?;

    Ok(BuiltinAssistant {
        main_agent: normalized.main_agent,
        enabled: normalized.enabled,
        ..assistant
    })
}

fn builtin_assistant_catalog() -> Vec<BuiltinAssistant> {
    vec![
        BuiltinAssistant {
            id: "builtin-star-office-helper".to_string(),
            name: "Star Office 助手".to_string(),
            description: "用于在 Aion 预览中安装、连接并排查 Star-Office-UI 可视化问题。".to_string(),
            avatar: "📺".to_string(),
            main_agent: "gemini".to_string(),
            enabled: true,
            prompt: String::new(),
        },
        BuiltinAssistant {
            id: "builtin-openclaw-setup".to_string(),
            name: "OpenClaw 部署专家".to_string(),
            description: "OpenClaw 安装、部署、配置和故障排查专家。".to_string(),
            avatar: "🦞".to_string(),
            main_agent: "gemini".to_string(),
            enabled: true,
            prompt: String::new(),
        },
        BuiltinAssistant {
            id: "builtin-cowork".to_string(),
            name: "Cowork".to_string(),
            description: "具有文件操作、文档处理和多步骤工作流规划的自主任务执行助手。".to_string(),
            avatar: "🛠️".to_string(),
            main_agent: "gemini".to_string(),
            enabled: true,
            prompt: String::new(),
        },
        BuiltinAssistant {
            id: "builtin-ui-ux-pro-max".to_string(),
            name: "UI/UX 专业设计师".to_string(),
            description: "专业 UI/UX 设计智能助手。".to_string(),
            avatar: "🎨".to_string(),
            main_agent: "gemini".to_string(),
            enabled: true,
            prompt: String::new(),
        },
        BuiltinAssistant {
            id: "builtin-planning-with-files".to_string(),
            name: "文件规划助手".to_string(),
            description: "Manus 风格的文件规划，用于复杂任务。".to_string(),
            avatar: "📋".to_string(),
            main_agent: "gemini".to_string(),
            enabled: true,
            prompt: String::new(),
        },
    ]
}

fn merge_builtin_preferences(assistant: BuiltinAssistant, value: Option<Value>) -> BuiltinAssistant {
    let Some(value) = value else {
        return assistant;
    };

    let Some(preferences) = parse_builtin_preferences(value) else {
        return assistant;
    };

    BuiltinAssistant {
        main_agent: preferences.main_agent,
        enabled: preferences.enabled,
        ..assistant
    }
}

fn parse_builtin_preferences(value: Value) -> Option<BuiltinAssistantPreferences> {
    if value.is_null() {
        return None;
    }

    serde_json::from_value::<BuiltinAssistantPreferences>(value.clone())
        .ok()
        .map(normalize_builtin_preferences)
        .or_else(|| {
            let object = value.as_object()?;
            Some(normalize_builtin_preferences(BuiltinAssistantPreferences {
                main_agent: object
                    .get("main_agent")
                    .or_else(|| object.get("mainAgent"))
                    .and_then(Value::as_str)
                    .map(ToOwned::to_owned)
                    .unwrap_or_default(),
                enabled: object.get("enabled").and_then(Value::as_bool).unwrap_or(true),
            }))
        })
}

fn normalize_builtin_preferences(preferences: BuiltinAssistantPreferences) -> BuiltinAssistantPreferences {
    BuiltinAssistantPreferences {
        main_agent: normalize_text(Some(preferences.main_agent)).unwrap_or_else(|| "gemini".to_string()),
        enabled: preferences.enabled,
    }
}

fn normalize_text(value: Option<String>) -> Option<String> {
    value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
}

fn builtin_assistant_key(id: &str) -> String {
    format!("{BUILTIN_ASSISTANT_PREFIX}{id}")
}
