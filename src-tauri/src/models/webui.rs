use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct WebUiSettings {
    pub enabled: bool,
    pub port: u16,
    pub remote: bool,
}
