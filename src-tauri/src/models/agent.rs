use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BuiltinAssistant {
    pub id: String,
    pub name: String,
    pub description: String,
    pub avatar: String,
    pub main_agent: String,
    pub enabled: bool,
    pub prompt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BuiltinAssistantPreferences {
    pub main_agent: String,
    pub enabled: bool,
}
