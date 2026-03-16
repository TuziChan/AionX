use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    Extension,
};
use crate::events::EventBus;
use futures::{SinkExt, StreamExt};

/// GET /ws — WebSocket 连接，推送实时事件到 WebUI 客户端
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Extension(event_bus): Extension<EventBus>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, event_bus))
}

async fn handle_ws(socket: WebSocket, event_bus: EventBus) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = event_bus.subscribe();

    // 事件推送任务：从 EventBus 读取事件并转发给 WebSocket 客户端
    let send_task = tokio::spawn(async move {
        loop {
            match rx.recv().await {
                Ok(event) => {
                    let payload = serde_json::json!({
                        "type": "event",
                        "data": format!("{:?}", event),
                    });
                    if sender
                        .send(Message::Text(payload.to_string()))
                        .await
                        .is_err()
                    {
                        break;
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!("WebSocket client lagged by {} events", n);
                }
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    });

    // 接收任务：处理客户端消息（心跳/命令）
    let recv_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    tracing::debug!(msg = %text, "WebSocket message received");
                    // 可扩展：处理客户端命令（如 agent 交互）
                }
                Ok(Message::Close(_)) => break,
                Err(e) => {
                    tracing::error!("WebSocket error: {}", e);
                    break;
                }
                _ => {}
            }
        }
    });

    // 等待任一任务结束
    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }

    tracing::info!("WebSocket connection closed");
}
