use serde::{Deserialize, Serialize};
use specta::Type;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, Type)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
    #[serde(skip_serializing)]
    #[specta(skip)]
    pub password_hash: String,
    #[serde(skip_serializing)]
    #[specta(skip)]
    pub jwt_secret: String,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub updated_at: i64,
    #[specta(type = Option<f64>)]
    pub last_login: Option<i64>,
}

/// 前端可见的用户信息（不含敏感字段）
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UserInfo {
    pub id: String,
    pub username: String,
    pub email: Option<String>,
}

impl From<User> for UserInfo {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            username: u.username,
            email: u.email,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateUser {
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UserUpdate {
    pub username: Option<String>,
    pub email: Option<String>,
    pub password_hash: Option<String>,
}
