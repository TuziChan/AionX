use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "lowercase")]
pub enum ModelHealthStatus {
    Unknown,
    Healthy,
    Unhealthy,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModelHealth {
    pub status: ModelHealthStatus,
    pub last_check: Option<f64>,
    pub latency: Option<u32>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModelProvider {
    pub id: String,
    pub platform: String,
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    #[serde(default)]
    pub model: Vec<String>,
    pub enabled: Option<bool>,
    #[serde(default)]
    pub model_enabled: HashMap<String, bool>,
    #[serde(default)]
    pub model_protocols: HashMap<String, String>,
    #[serde(default)]
    pub model_health: HashMap<String, ModelHealth>,
    pub context_limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CreateModelProviderInput {
    pub platform: String,
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    pub context_limit: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct UpdateModelProviderInput {
    pub platform: String,
    pub name: String,
    pub base_url: String,
    pub api_key: String,
    pub context_limit: Option<u32>,
}
