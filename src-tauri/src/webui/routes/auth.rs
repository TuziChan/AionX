use axum::{Extension, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
use crate::models::user::UserInfo;
use crate::services::AuthService;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub user: UserInfo,
    pub token: String,
}

#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
}

/// POST /api/auth/login
pub async fn login(
    Extension(auth_service): Extension<Arc<AuthService>>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ErrorResponse>)> {
    let (user, token) = auth_service
        .login(&body.username, &body.password)
        .await
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(ErrorResponse { error: e.to_string() }),
            )
        })?;

    Ok(Json(LoginResponse { user, token }))
}

/// POST /api/auth/logout
pub async fn logout() -> StatusCode {
    // JWT 是无状态的，客户端丢弃 token 即可
    // 如需服务端失效，可实现 token 黑名单（暂不实现）
    StatusCode::OK
}

/// GET /api/auth/user — 获取当前登录用户信息（需认证）
pub async fn get_current_user(
    Extension(user): Extension<UserInfo>,
) -> Json<UserInfo> {
    Json(user)
}
