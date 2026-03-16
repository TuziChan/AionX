use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Extension,
};
use crate::models::user::UserInfo;
use crate::services::AuthService;
use std::sync::Arc;

/// JWT 认证中间件
///
/// 从 Authorization: Bearer <token> 头中提取 JWT，
/// 验证后将 UserInfo 注入 request extensions，
/// 下游 handler 通过 Extension<UserInfo> 提取。
pub async fn auth_middleware(
    Extension(auth_service): Extension<Arc<AuthService>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(t) => t,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let user = auth_service
        .verify_token(token)
        .await
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}
