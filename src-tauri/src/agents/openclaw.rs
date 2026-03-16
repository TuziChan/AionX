use crate::error::{AppError, Result};
use super::process::ProcessManager;
use super::traits::AgentBackend;
use super::types::*;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use futures::{SinkExt, StreamExt};

/// OpenClaw Agent — WebSocket Gateway v3 协议
///
/// 基于原 AionUi 项目实现：
/// - 通过 WebSocket 连接到 OpenClaw Gateway（默认 ws://127.0.0.1:18789）
/// - Gateway 可以是本地启动的子进程或外部已运行的实例
/// - 协议：RPC 请求/响应 + 事件流
/// - RPC 帧格式：
///   - REQUEST:  `{"type":"req","id":"...","method":"...","params":{...}}`
///   - RESPONSE: `{"type":"res","id":"...","ok":true,"payload":{...}}`
///   - EVENT:    `{"type":"event","event":"...","payload":{...}}`
/// - 关键事件：chat.event（delta/final/aborted/error）、agent.event、exec.approval.request
pub struct OpenClawAgent {
    process_manager: Arc<ProcessManager>,
    status: Arc<RwLock<AgentStatus>>,
    cancel_tx: Arc<RwLock<Option<tokio::sync::oneshot::Sender<()>>>>,
    config: Option<AgentConfig>,
    gateway_port: u16,
    session_key: Arc<RwLock<Option<String>>>,
    /// Gateway 进程 ID（如果是本地启动的）
    gateway_process_id: Arc<RwLock<Option<String>>>,
}

impl OpenClawAgent {
    pub fn new(process_manager: Arc<ProcessManager>) -> Self {
        Self {
            process_manager,
            status: Arc::new(RwLock::new(AgentStatus::Idle)),
            cancel_tx: Arc::new(RwLock::new(None)),
            config: None,
            gateway_port: 18789,
            session_key: Arc::new(RwLock::new(None)),
            gateway_process_id: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn detect_available() -> DetectedAgent {
        let output = tokio::process::Command::new("openclaw")
            .arg("--version")
            .output()
            .await
            .ok();

        let available = output.as_ref().map(|o| o.status.success()).unwrap_or(false);
        let version = output
            .and_then(|o| String::from_utf8(o.stdout).ok())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        DetectedAgent {
            agent_type: "openclaw".to_string(),
            name: "OpenClaw".to_string(),
            command: "openclaw".to_string(),
            version,
            available,
        }
    }

    /// 启动本地 Gateway 子进程
    async fn start_gateway(&self, command: &str, port: u16) -> Result<()> {
        let process_id = format!("openclaw-gateway-{}", port);

        let args = vec![
            "gateway".to_string(),
            "--port".to_string(),
            port.to_string(),
        ];

        let _ = self.process_manager.spawn(
            &process_id,
            command,
            &args,
            None,
            None,
        ).await?;

        *self.gateway_process_id.write().await = Some(process_id);

        // 等待 Gateway 就绪（轮询端口，最多5秒）
        for _ in 0..50 {
            if tokio::net::TcpStream::connect(format!("127.0.0.1:{}", port)).await.is_ok() {
                tracing::info!(port = port, "OpenClaw gateway is ready");
                return Ok(());
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        Err(AppError::Agent(format!(
            "OpenClaw gateway failed to start on port {}", port
        )))
    }

    /// 构建 RPC 请求帧
    fn make_rpc_request(id: &str, method: &str, params: serde_json::Value) -> String {
        serde_json::json!({
            "type": "req",
            "id": id,
            "method": method,
            "params": params,
        }).to_string()
    }

    /// 解析 Gateway 事件为 AgentEvent
    ///
    /// 原项目事件类型：
    /// - chat.event: { payload: { type: "delta"|"final"|"aborted"|"error", message, seq } }
    /// - agent.event: { payload: { type: "thinking"|"tool"|"assistant"|"lifecycle", ... } }
    /// - exec.approval.request: { payload: { id, description, tool, ... } }
    fn parse_gateway_event(v: &serde_json::Value, ctx: &mut OpenClawContext) -> Vec<AgentEvent> {
        let mut events = Vec::new();

        let event_name = match v.get("event").and_then(|e| e.as_str()) {
            Some(e) => e,
            None => return events,
        };

        let payload = v.get("payload").cloned().unwrap_or(serde_json::Value::Null);

        match event_name {
            "chat.event" => {
                let event_type = payload.get("type").and_then(|t| t.as_str()).unwrap_or("");

                match event_type {
                    "delta" => {
                        // delta 携带累积文本快照，需要计算增量
                        if let Some(text) = Self::extract_text_from_message(&payload.get("message")) {
                            if ctx.current_msg_id.is_empty() {
                                ctx.current_msg_id = uuid::Uuid::new_v4().to_string();
                                events.push(AgentEvent::MessageStart {
                                    msg_id: ctx.current_msg_id.clone(),
                                });
                            }

                            // 计算与上次的差值（delta 是累积的）
                            let delta = if text.len() > ctx.accumulated_text.len()
                                && text.starts_with(&ctx.accumulated_text)
                            {
                                text[ctx.accumulated_text.len()..].to_string()
                            } else if text != ctx.accumulated_text {
                                text.clone()
                            } else {
                                String::new()
                            };

                            if !delta.is_empty() {
                                events.push(AgentEvent::MessageDelta {
                                    msg_id: ctx.current_msg_id.clone(),
                                    content: delta,
                                });
                            }
                            ctx.accumulated_text = text;
                        }
                    }
                    "final" => {
                        if !ctx.current_msg_id.is_empty() {
                            events.push(AgentEvent::MessageComplete {
                                msg_id: ctx.current_msg_id.clone(),
                            });
                            ctx.current_msg_id.clear();
                            ctx.accumulated_text.clear();
                        }
                    }
                    "aborted" => {
                        events.push(AgentEvent::MessageComplete {
                            msg_id: ctx.current_msg_id.clone(),
                        });
                        ctx.current_msg_id.clear();
                        ctx.accumulated_text.clear();
                    }
                    "error" => {
                        let msg = payload.get("error")
                            .and_then(|e| e.as_str())
                            .unwrap_or("Chat error")
                            .to_string();
                        events.push(AgentEvent::Error { message: msg });
                    }
                    _ => {}
                }
            }

            "agent.event" => {
                let event_type = payload.get("type").and_then(|t| t.as_str()).unwrap_or("");

                match event_type {
                    "tool" => {
                        let phase = payload.get("phase").and_then(|p| p.as_str()).unwrap_or("");
                        let tool_name = payload.get("toolName")
                            .or_else(|| payload.get("name"))
                            .and_then(|n| n.as_str())
                            .unwrap_or("unknown")
                            .to_string();

                        match phase {
                            "start" | "update" => {
                                let input = payload.get("args")
                                    .or_else(|| payload.get("input"))
                                    .cloned()
                                    .unwrap_or(serde_json::Value::Null);
                                events.push(AgentEvent::ToolCallStart {
                                    msg_id: ctx.current_msg_id.clone(),
                                    tool: tool_name,
                                    input,
                                });
                            }
                            "result" => {
                                let output = payload.get("result")
                                    .or_else(|| payload.get("output"))
                                    .cloned()
                                    .unwrap_or(serde_json::Value::Null);
                                events.push(AgentEvent::ToolCallResult {
                                    msg_id: ctx.current_msg_id.clone(),
                                    tool: tool_name,
                                    output,
                                });
                            }
                            _ => {}
                        }
                    }
                    "thinking" => {
                        // 思考过程（可选展示）
                    }
                    "assistant" => {
                        // agent.event assistant 作为 fallback（当 chat.event delta 丢失时）
                        if let Some(text) = payload.get("text").and_then(|t| t.as_str()) {
                            if !text.is_empty() && ctx.accumulated_text.is_empty() {
                                events.push(AgentEvent::MessageDelta {
                                    msg_id: ctx.current_msg_id.clone(),
                                    content: text.to_string(),
                                });
                            }
                        }
                    }
                    _ => {}
                }
            }

            "exec.approval.request" => {
                let id = payload.get("id")
                    .and_then(|i| i.as_str())
                    .unwrap_or("")
                    .to_string();
                let description = payload.get("description")
                    .or_else(|| payload.get("tool"))
                    .and_then(|d| d.as_str())
                    .unwrap_or("Permission requested")
                    .to_string();
                events.push(AgentEvent::PermissionRequest { id, description });
            }

            _ => {}
        }

        events
    }

    /// 从消息对象中提取文本内容
    /// 处理多种格式：string / array of blocks / object with .text
    fn extract_text_from_message(message: &Option<&serde_json::Value>) -> Option<String> {
        let msg = (*message)?;

        // 直接字符串
        if let Some(text) = msg.as_str() {
            return Some(text.to_string());
        }

        // 数组格式: [{type: "text", text: "..."}, ...]
        if let Some(arr) = msg.as_array() {
            let texts: Vec<String> = arr.iter()
                .filter_map(|block| {
                    if block.get("type").and_then(|t| t.as_str()) == Some("text") {
                        block.get("text").and_then(|t| t.as_str()).map(|s| s.to_string())
                    } else {
                        None
                    }
                })
                .collect();
            if !texts.is_empty() {
                return Some(texts.join(""));
            }
        }

        // 对象格式: {text: "..."}
        if let Some(text) = msg.get("text").and_then(|t| t.as_str()) {
            return Some(text.to_string());
        }

        None
    }
}

struct OpenClawContext {
    current_msg_id: String,
    accumulated_text: String,
    rpc_counter: u64,
}

#[async_trait::async_trait]
impl AgentBackend for OpenClawAgent {
    async fn start(&mut self, config: &AgentConfig) -> Result<()> {
        let command = config.command.as_deref().unwrap_or("openclaw");

        // 从 env 获取端口配置
        let port = config.env
            .as_ref()
            .and_then(|e| e.get("OPENCLAW_GATEWAY_PORT"))
            .and_then(|p| p.parse::<u16>().ok())
            .unwrap_or(18789);
        self.gateway_port = port;

        // 检查 Gateway 是否已在运行
        let gateway_running = tokio::net::TcpStream::connect(
            format!("127.0.0.1:{}", port)
        ).await.is_ok();

        if !gateway_running {
            // 尝试启动本地 Gateway
            self.start_gateway(command, port).await?;
        } else {
            tracing::info!(port = port, "Using existing OpenClaw gateway");
        }

        self.config = Some(config.clone());
        *self.status.write().await = AgentStatus::Idle;
        tracing::info!(port = port, "OpenClaw agent ready");
        Ok(())
    }

    async fn send_message(
        &self,
        chat_id: &str,
        message: &str,
        _files: Option<Vec<FileAttachment>>,
        tx: mpsc::Sender<AgentEvent>,
    ) -> Result<()> {
        *self.status.write().await = AgentStatus::Running;
        let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Running }).await;

        let port = self.gateway_port;
        let ws_url = format!("ws://127.0.0.1:{}", port);

        // 连接 WebSocket
        let (ws_stream, _) = tokio_tungstenite::connect_async(&ws_url)
            .await
            .map_err(|e| AppError::Agent(format!(
                "Failed to connect to OpenClaw gateway at {}: {}", ws_url, e
            )))?;

        let (mut ws_write, mut ws_read) = ws_stream.split();

        // 发送 connect RPC
        let connect_req = Self::make_rpc_request(
            "connect-1",
            "connect",
            serde_json::json!({
                "protocolVersion": "v3",
                "client": {
                    "id": format!("aionx-{}", chat_id),
                    "displayName": "AionX",
                    "version": env!("CARGO_PKG_VERSION"),
                    "platform": std::env::consts::OS,
                    "mode": "client",
                },
                "capabilities": ["tool-events"],
            }),
        );

        ws_write.send(tokio_tungstenite::tungstenite::Message::Text(connect_req))
            .await
            .map_err(|e| AppError::Agent(format!("WebSocket send error: {}", e)))?;

        // 等待 hello 响应（跳过 challenge 等）
        while let Some(msg) = ws_read.next().await {
            match msg {
                Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                        if v.get("type").and_then(|t| t.as_str()) == Some("res")
                            && v.get("ok").and_then(|o| o.as_bool()) == Some(true)
                        {
                            break; // 连接成功
                        }
                    }
                }
                _ => continue,
            }
        }

        // 解析或创建 session
        let session_key = {
            let existing = self.session_key.read().await.clone();
            if let Some(key) = existing {
                key
            } else {
                let resolve_req = Self::make_rpc_request(
                    "resolve-1",
                    "sessions.resolve",
                    serde_json::json!({
                        "scope": "per-conversation",
                        "externalId": chat_id,
                    }),
                );
                ws_write.send(tokio_tungstenite::tungstenite::Message::Text(resolve_req))
                    .await
                    .map_err(|e| AppError::Agent(format!("WebSocket send error: {}", e)))?;

                // 等待 session 响应
                let mut session_key = chat_id.to_string();
                while let Some(msg) = ws_read.next().await {
                    match msg {
                        Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                                if v.get("type").and_then(|t| t.as_str()) == Some("res") {
                                    if let Some(key) = v.get("payload")
                                        .and_then(|p| p.get("key"))
                                        .and_then(|k| k.as_str())
                                    {
                                        session_key = key.to_string();
                                    }
                                    break;
                                }
                            }
                        }
                        _ => continue,
                    }
                }
                *self.session_key.write().await = Some(session_key.clone());
                session_key
            }
        };

        // 发送 chat.send RPC
        let chat_req = Self::make_rpc_request(
            &format!("chat-{}", uuid::Uuid::new_v4()),
            "chat.send",
            serde_json::json!({
                "sessionKey": session_key,
                "message": message,
                "idempotencyKey": uuid::Uuid::new_v4().to_string(),
            }),
        );
        ws_write.send(tokio_tungstenite::tungstenite::Message::Text(chat_req))
            .await
            .map_err(|e| AppError::Agent(format!("WebSocket send error: {}", e)))?;

        // 设置取消通道
        let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();
        *self.cancel_tx.write().await = Some(cancel_tx);

        let status = self.status.clone();

        // 监听事件流
        tokio::spawn(async move {
            let mut ctx = OpenClawContext {
                current_msg_id: String::new(),
                accumulated_text: String::new(),
                rpc_counter: 0,
            };

            let timeout = tokio::time::Duration::from_secs(600);
            let _ = tokio::time::timeout(timeout, async {
                loop {
                    tokio::select! {
                        msg = ws_read.next() => {
                            match msg {
                                Some(Ok(tokio_tungstenite::tungstenite::Message::Text(text))) => {
                                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) {
                                        let msg_type = v.get("type").and_then(|t| t.as_str()).unwrap_or("");
                                        match msg_type {
                                            "event" => {
                                                for event in OpenClawAgent::parse_gateway_event(&v, &mut ctx) {
                                                    match &event {
                                                        AgentEvent::MessageComplete { .. } => {
                                                            let _ = tx.send(event).await;
                                                            return; // 消息完成，退出循环
                                                        }
                                                        _ => {
                                                            if tx.send(event).await.is_err() { return; }
                                                        }
                                                    }
                                                }
                                            }
                                            "res" => {
                                                // RPC 响应（chat.send 确认等）
                                                if v.get("ok").and_then(|o| o.as_bool()) == Some(false) {
                                                    let error = v.get("error")
                                                        .and_then(|e| e.as_str())
                                                        .unwrap_or("RPC error")
                                                        .to_string();
                                                    let _ = tx.send(AgentEvent::Error { message: error }).await;
                                                    return;
                                                }
                                            }
                                            _ => {}
                                        }
                                    }
                                }
                                Some(Ok(tokio_tungstenite::tungstenite::Message::Close(_))) | None => break,
                                _ => continue,
                            }
                        }
                        _ = &mut cancel_rx => {
                            tracing::info!("OpenClaw task cancelled");
                            break;
                        }
                    }
                }
            }).await;

            *status.write().await = AgentStatus::Idle;
            let _ = tx.send(AgentEvent::StatusChange { status: AgentStatus::Idle }).await;
        });

        Ok(())
    }

    async fn stop(&self, _chat_id: &str) -> Result<()> {
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        *self.status.write().await = AgentStatus::Idle;
        Ok(())
    }

    async fn handle_permission(
        &self,
        _chat_id: &str,
        _request_id: &str,
        _approved: bool,
    ) -> Result<()> {
        // TODO: 通过 WebSocket 发送 exec.approval.response RPC
        // 需要持有 ws_write 引用，当前架构需要调整
        // 暂时不支持，等待后续重构
        tracing::warn!("OpenClaw permission handling not yet implemented via WebSocket");
        Ok(())
    }

    fn status(&self) -> AgentStatus {
        futures::executor::block_on(async {
            self.status.read().await.clone()
        })
    }

    async fn shutdown(&mut self) -> Result<()> {
        if let Some(tx) = self.cancel_tx.write().await.take() {
            let _ = tx.send(());
        }
        // 关闭本地 Gateway 进程
        if let Some(ref pid) = *self.gateway_process_id.read().await {
            self.process_manager.kill(pid).await.ok();
        }
        *self.status.write().await = AgentStatus::Disconnected;
        *self.gateway_process_id.write().await = None;
        *self.session_key.write().await = None;
        tracing::info!("OpenClaw agent shut down");
        Ok(())
    }
}
