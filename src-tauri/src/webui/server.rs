use crate::error::{AppError, Result};
use crate::events::EventBus;
use crate::services::AuthService;
use axum::{
    middleware,
    routing::{get, post, delete},
    Extension, Router,
};
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::oneshot;
use tokio::task::JoinHandle;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;

use super::middleware::auth_middleware;
use super::routes::{api, auth, ws};

/// WebUI HTTP 服务器状态
pub struct WebUiServer {
    handle: Option<JoinHandle<()>>,
    shutdown_tx: Option<oneshot::Sender<()>>,
    port: u16,
    remote: bool,
}

/// WebUI 服务器信息（返回给前端）
#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct WebUiInfo {
    pub port: u16,
    pub remote: bool,
    pub url: String,
}

/// WebUI 服务器状态
#[derive(serde::Serialize, serde::Deserialize, specta::Type)]
pub struct WebUiStatus {
    pub running: bool,
    pub port: Option<u16>,
    pub remote: bool,
}

impl WebUiServer {
    /// 启动 WebUI 服务器
    pub async fn start(
        port: u16,
        remote: bool,
        pool: SqlitePool,
        event_bus: EventBus,
        dist_dir: Option<String>,
    ) -> Result<Self> {
        let auth_service = Arc::new(AuthService::new(pool.clone()));
        let pool_arc = Arc::new(pool);

        // 确保至少有一个管理员用户
        auth_service.ensure_admin().await?;

        // 公开路由（无需认证）
        let public_routes = Router::new()
            .route("/api/auth/login", post(auth::login))
            .route("/api/auth/logout", post(auth::logout));

        // 需要认证的 API 路由
        let protected_routes = Router::new()
            .route("/api/auth/user", get(auth::get_current_user))
            .route("/api/chats", get(api::list_chats).post(api::create_chat))
            .route("/api/chats/:id", get(api::get_chat).delete(api::delete_chat))
            .route(
                "/api/chats/:id/messages",
                get(api::get_messages).post(api::create_message),
            )
            .route_layer(middleware::from_fn(auth_middleware));

        // WebSocket 路由
        let ws_routes = Router::new()
            .route("/ws", get(ws::ws_handler));

        // 组合所有路由
        let mut app = Router::new()
            .merge(public_routes)
            .merge(protected_routes)
            .merge(ws_routes)
            .layer(Extension(auth_service))
            .layer(Extension(pool_arc))
            .layer(Extension(event_bus))
            .layer(TraceLayer::new_for_http());

        // CORS
        if remote {
            app = app.layer(CorsLayer::permissive());
        } else {
            app = app.layer(
                CorsLayer::new()
                    .allow_origin(tower_http::cors::Any)
                    .allow_methods(tower_http::cors::Any)
                    .allow_headers(tower_http::cors::Any),
            );
        }

        // 静态资源服务（前端 dist 目录）
        if let Some(dir) = dist_dir {
            app = app.fallback_service(ServeDir::new(dir));
        }

        // 绑定地址
        let addr: SocketAddr = if remote {
            format!("0.0.0.0:{}", port).parse().unwrap()
        } else {
            format!("127.0.0.1:{}", port).parse().unwrap()
        };

        let listener = tokio::net::TcpListener::bind(addr)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to bind port {}: {}", port, e)))?;

        let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();

        let handle = tokio::spawn(async move {
            tracing::info!(%addr, "WebUI server started");
            axum::serve(listener, app)
                .with_graceful_shutdown(async {
                    let _ = shutdown_rx.await;
                })
                .await
                .ok();
            tracing::info!("WebUI server stopped");
        });

        Ok(Self {
            handle: Some(handle),
            shutdown_tx: Some(shutdown_tx),
            port,
            remote,
        })
    }

    /// 停止服务器
    pub async fn stop(&mut self) -> Result<()> {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(());
        }
        if let Some(handle) = self.handle.take() {
            handle.await.ok();
        }
        tracing::info!("WebUI server shut down");
        Ok(())
    }

    /// 获取服务器信息
    pub fn info(&self) -> WebUiInfo {
        let host = if self.remote { "0.0.0.0" } else { "127.0.0.1" };
        WebUiInfo {
            port: self.port,
            remote: self.remote,
            url: format!("http://{}:{}", host, self.port),
        }
    }

    /// 获取状态
    pub fn status(&self) -> WebUiStatus {
        WebUiStatus {
            running: self.handle.is_some(),
            port: if self.handle.is_some() { Some(self.port) } else { None },
            remote: self.remote,
        }
    }
}
