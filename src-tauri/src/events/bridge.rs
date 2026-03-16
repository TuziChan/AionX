use tauri::{AppHandle, Emitter};
use tokio::sync::broadcast;
use super::types::InternalEvent;

/// 启动事件桥接：监听内部 EventBus，转发为 Tauri 前端事件
pub fn spawn_event_bridge(app_handle: AppHandle, mut rx: broadcast::Receiver<InternalEvent>) {
    tauri::async_runtime::spawn(async move {
        loop {
            match rx.recv().await {
                Ok(event) => forward_to_frontend(&app_handle, &event),
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!("Event bridge lagged, missed {} events", n);
                }
                Err(broadcast::error::RecvError::Closed) => {
                    tracing::info!("Event bus closed, stopping bridge");
                    break;
                }
            }
        }
    });
}

fn forward_to_frontend(app: &AppHandle, event: &InternalEvent) {
    let result = match event {
        InternalEvent::ChatCreated { chat_id } => {
            app.emit("chat:created", chat_id)
        }
        InternalEvent::ChatDeleted { chat_id } => {
            app.emit("chat:deleted", chat_id)
        }
        InternalEvent::ChatUpdated { chat_id } => {
            app.emit("chat:updated", chat_id)
        }
        InternalEvent::MessageAdded { chat_id, message_id } => {
            app.emit("message:added", serde_json::json!({
                "chat_id": chat_id,
                "message_id": message_id,
            }))
        }
        InternalEvent::AgentStarted { chat_id, agent_type } => {
            app.emit("agent:status-change", serde_json::json!({
                "chat_id": chat_id,
                "agent_type": agent_type,
                "status": "started",
            }))
        }
        InternalEvent::AgentStopped { chat_id } => {
            app.emit("agent:status-change", serde_json::json!({
                "chat_id": chat_id,
                "status": "stopped",
            }))
        }
        InternalEvent::SettingsChanged { category } => {
            app.emit("settings:changed", category)
        }
        InternalEvent::WorkspaceChanged { path } => {
            app.emit("workspace:changed", path)
        }
    };

    if let Err(e) = result {
        tracing::error!("Failed to emit Tauri event: {}", e);
    }
}
