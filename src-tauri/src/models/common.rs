use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PaginatedResult<T: specta::Type> {
    pub items: Vec<T>,
    #[specta(type = f64)]
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ListParams {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

impl ListParams {
    pub fn offset(&self) -> i64 {
        let page = self.page.unwrap_or(1).max(1);
        let page_size = self.page_size.unwrap_or(50);
        ((page - 1) * page_size) as i64
    }

    pub fn limit(&self) -> i64 {
        self.page_size.unwrap_or(50) as i64
    }

    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }
}
