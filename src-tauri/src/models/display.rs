use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DisplaySettings {
    pub theme: String,
    pub zoom_factor: f64,
    pub custom_css: String,
}
