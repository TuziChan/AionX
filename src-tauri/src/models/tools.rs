use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ImageGenerationSettings {
    pub enabled: bool,
    pub provider_id: Option<String>,
    pub model_name: Option<String>,
}
