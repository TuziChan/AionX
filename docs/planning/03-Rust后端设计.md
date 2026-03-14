# 03 - Rust 后端设计

## 1. Cargo 项目结构

```toml
# Cargo.toml
[package]
name = "aionui-tauri"
version = "2.0.0"
edition = "2021"

[dependencies]
# Tauri 核心
tauri = { version = "2", features = ["tray-icon", "protocol-asset"] }
tauri-plugin-shell = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-notification = "2"
tauri-plugin-updater = "2"
tauri-plugin-deep-link = "2"
tauri-plugin-single-instance = "2"
tauri-plugin-store = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-http = "2"
tauri-plugin-os = "2"
tauri-plugin-process = "2"
tauri-plugin-window-state = "2"

# 异步运行时
tokio = { version = "1", features = ["full"] }

# 数据库
rusqlite = { version = "0.31", features = ["bundled", "serde_json"] }
r2d2 = "0.8"
r2d2_sqlite = "0.24"

# Web 服务器 (WebUI)
axum = { version = "0.7", features = ["ws", "multipart"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "fs", "trace"] }

# 序列化
serde = { version = "1", features = ["derive"] }
serde_json = "1"
toml = "0.8"

# 认证
argon2 = "0.5"
jsonwebtoken = "9"

# HTTP 客户端
reqwest = { version = "0.12", features = ["json", "stream", "multipart"] }

# 工具
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
regex = "1"
tracing = "0.1"
tracing-subscriber = "0.3"
thiserror = "1"
anyhow = "1"
zip = "0.6"
base64 = "0.22"
rand = "0.8"

# Cron 调度
tokio-cron-scheduler = "0.10"

# 进程管理 (AI Agent)
portable-pty = "0.8"  # 可选，用于 PTY 支持
```

## 2. 模块设计

### 2.1 入口与初始化

```rust
// src-tauri/src/main.rs
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // ... 其他插件
        .setup(|app| {
            // 初始化数据库
            // 初始化服务
            // 启动后台任务
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 注册所有 Commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.2 应用状态管理

```rust
// src-tauri/src/state.rs
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct AppState {
    pub db: Arc<DatabasePool>,
    pub conversation_service: Arc<ConversationService>,
    pub agent_service: Arc<AgentService>,
    pub cron_service: Arc<RwLock<CronService>>,
    pub mcp_service: Arc<McpService>,
    pub channel_service: Arc<RwLock<ChannelService>>,
    pub auth_service: Arc<AuthService>,
    pub extension_service: Arc<ExtensionService>,
    pub file_service: Arc<FileService>,
    pub config: Arc<RwLock<AppConfig>>,
    pub webui_handle: Arc<RwLock<Option<WebUiHandle>>>,
}
```

### 2.3 统一错误处理

```rust
// src-tauri/src/error.rs
use thiserror::Error;
use serde::Serialize;

#[derive(Error, Debug, Serialize)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(String),

    #[error("认证失败: {0}")]
    Auth(String),

    #[error("未找到: {0}")]
    NotFound(String),

    #[error("Agent 错误: {0}")]
    Agent(String),

    #[error("文件操作错误: {0}")]
    FileSystem(String),

    #[error("配置错误: {0}")]
    Config(String),

    #[error("网络错误: {0}")]
    Network(String),

    #[error("内部错误: {0}")]
    Internal(String),
}

// 实现 Tauri 的 InvokeError 转换
impl From<AppError> for tauri::ipc::InvokeError {
    fn from(err: AppError) -> Self {
        tauri::ipc::InvokeError::from(err.to_string())
    }
}
```

## 3. Commands 层设计

### 3.1 对话管理 Commands

```rust
// src-tauri/src/commands/conversation.rs

#[tauri::command]
async fn create_conversation(
    name: String,
    agent_type: String,
    model: Option<String>,
    state: State<'_, AppState>,
) -> Result<Conversation, AppError>;

#[tauri::command]
async fn get_conversation(
    id: String,
    state: State<'_, AppState>,
) -> Result<Conversation, AppError>;

#[tauri::command]
async fn list_conversations(
    page: Option<u32>,
    page_size: Option<u32>,
    state: State<'_, AppState>,
) -> Result<PaginatedResult<Conversation>, AppError>;

#[tauri::command]
async fn delete_conversation(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn update_conversation(
    id: String,
    updates: ConversationUpdate,
    state: State<'_, AppState>,
) -> Result<Conversation, AppError>;

#[tauri::command]
async fn get_messages(
    conversation_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Message>, AppError>;

#[tauri::command]
async fn get_associate_conversation(
    conversation_id: String,
    state: State<'_, AppState>,
) -> Result<Option<Conversation>, AppError>;

#[tauri::command]
async fn get_workspace_conversations(
    workspace_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<Conversation>, AppError>;
```

### 3.2 Agent Commands

```rust
// src-tauri/src/commands/agent.rs

#[tauri::command]
async fn send_message(
    conversation_id: String,
    content: String,
    files: Option<Vec<FileAttachment>>,
    app_handle: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn stop_agent(
    conversation_id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn get_agent_status(
    conversation_id: String,
    state: State<'_, AppState>,
) -> Result<AgentStatus, AppError>;

#[tauri::command]
async fn approve_permission(
    conversation_id: String,
    request_id: String,
    approved: bool,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn detect_agents() -> Result<Vec<DetectedAgent>, AppError>;

#[tauri::command]
async fn get_agent_config(
    agent_type: String,
    state: State<'_, AppState>,
) -> Result<AgentConfig, AppError>;

#[tauri::command]
async fn update_agent_config(
    agent_type: String,
    config: AgentConfig,
    state: State<'_, AppState>,
) -> Result<(), AppError>;
```

### 3.3 文件系统 Commands

```rust
// src-tauri/src/commands/filesystem.rs

#[tauri::command]
async fn read_file(path: String) -> Result<FileContent, AppError>;

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), AppError>;

#[tauri::command]
async fn list_directory(
    path: String,
    recursive: Option<bool>,
) -> Result<Vec<FileEntry>, AppError>;

#[tauri::command]
async fn create_zip(
    paths: Vec<String>,
    output: String,
) -> Result<String, AppError>;

#[tauri::command]
async fn extract_zip(
    path: String,
    output: String,
) -> Result<(), AppError>;

#[tauri::command]
async fn download_remote_image(
    url: String,
    save_path: String,
) -> Result<String, AppError>;

#[tauri::command]
async fn get_file_type(path: String) -> Result<FileTypeInfo, AppError>;

#[tauri::command]
async fn select_directory() -> Result<Option<String>, AppError>;
```

### 3.4 设置 Commands

```rust
// src-tauri/src/commands/settings.rs

#[tauri::command]
async fn get_settings(
    category: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, AppError>;

#[tauri::command]
async fn update_settings(
    category: String,
    settings: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn change_language(
    language: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, AppError>;

#[tauri::command]
async fn open_dev_tools(window: Window) -> Result<(), AppError>;

#[tauri::command]
async fn set_zoom_factor(
    factor: f64,
    window: Window,
) -> Result<(), AppError>;
```

### 3.5 Cron Commands

```rust
// src-tauri/src/commands/cron.rs

#[tauri::command]
async fn add_cron_job(
    job: CronJobInput,
    state: State<'_, AppState>,
) -> Result<CronJob, AppError>;

#[tauri::command]
async fn update_cron_job(
    id: String,
    updates: CronJobUpdate,
    state: State<'_, AppState>,
) -> Result<CronJob, AppError>;

#[tauri::command]
async fn remove_cron_job(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn list_cron_jobs(
    state: State<'_, AppState>,
) -> Result<Vec<CronJob>, AppError>;

#[tauri::command]
async fn get_cron_job(
    id: String,
    state: State<'_, AppState>,
) -> Result<CronJob, AppError>;
```

### 3.6 MCP Commands

```rust
// src-tauri/src/commands/mcp.rs

#[tauri::command]
async fn get_mcp_servers(
    state: State<'_, AppState>,
) -> Result<Vec<McpServer>, AppError>;

#[tauri::command]
async fn add_mcp_server(
    config: McpServerConfig,
    state: State<'_, AppState>,
) -> Result<McpServer, AppError>;

#[tauri::command]
async fn remove_mcp_server(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn test_mcp_connection(
    id: String,
    state: State<'_, AppState>,
) -> Result<McpConnectionStatus, AppError>;

#[tauri::command]
async fn sync_mcp_to_agent(
    server_id: String,
    agent_type: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;
```

### 3.7 Channel Commands

```rust
// src-tauri/src/commands/channel.rs

#[tauri::command]
async fn get_channel_plugins(
    state: State<'_, AppState>,
) -> Result<Vec<ChannelPlugin>, AppError>;

#[tauri::command]
async fn add_channel_plugin(
    plugin: ChannelPluginInput,
    state: State<'_, AppState>,
) -> Result<ChannelPlugin, AppError>;

#[tauri::command]
async fn toggle_channel_plugin(
    id: String,
    enabled: bool,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn remove_channel_plugin(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn generate_pairing_code(
    state: State<'_, AppState>,
) -> Result<PairingCode, AppError>;
```

### 3.8 WebUI Commands

```rust
// src-tauri/src/commands/webui.rs

#[tauri::command]
async fn start_webui(
    port: Option<u16>,
    remote: Option<bool>,
    state: State<'_, AppState>,
) -> Result<WebUiInfo, AppError>;

#[tauri::command]
async fn stop_webui(
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn get_webui_status(
    state: State<'_, AppState>,
) -> Result<WebUiStatus, AppError>;

#[tauri::command]
async fn reset_webui_password(
    state: State<'_, AppState>,
) -> Result<String, AppError>;
```

### 3.9 Extension Commands

```rust
// src-tauri/src/commands/extension.rs

#[tauri::command]
async fn list_extensions(
    state: State<'_, AppState>,
) -> Result<Vec<Extension>, AppError>;

#[tauri::command]
async fn install_extension(
    path: String,
    state: State<'_, AppState>,
) -> Result<Extension, AppError>;

#[tauri::command]
async fn uninstall_extension(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn toggle_extension(
    id: String,
    enabled: bool,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
async fn get_extension_settings(
    id: String,
    state: State<'_, AppState>,
) -> Result<serde_json::Value, AppError>;

#[tauri::command]
async fn update_extension_settings(
    id: String,
    settings: serde_json::Value,
    state: State<'_, AppState>,
) -> Result<(), AppError>;
```

## 4. Services 层设计

### 4.1 Agent Service（核心）

```rust
// src-tauri/src/services/agent/mod.rs

/// Agent 统一接口 trait
pub trait AgentBackend: Send + Sync {
    /// 启动 Agent 进程
    async fn start(&self, config: &AgentConfig) -> Result<(), AppError>;

    /// 发送消息并获取流式响应
    async fn send_message(
        &self,
        conversation_id: &str,
        message: &str,
        files: Option<Vec<FileAttachment>>,
        tx: mpsc::Sender<AgentEvent>,
    ) -> Result<(), AppError>;

    /// 停止当前任务
    async fn stop(&self, conversation_id: &str) -> Result<(), AppError>;

    /// 处理权限请求
    async fn handle_permission(
        &self,
        conversation_id: &str,
        request_id: &str,
        approved: bool,
    ) -> Result<(), AppError>;

    /// 获取状态
    fn status(&self) -> AgentStatus;

    /// 关闭 Agent
    async fn shutdown(&self) -> Result<(), AppError>;
}

/// Agent 事件类型
pub enum AgentEvent {
    MessageStart { msg_id: String },
    MessageDelta { content: String },
    MessageComplete { message: Message },
    ToolCallStart { tool: String, input: Value },
    ToolCallResult { tool: String, output: Value },
    PermissionRequest { id: String, description: String },
    StatusChange { status: AgentStatus },
    Error { message: String },
}

/// Agent 管理器
pub struct AgentService {
    agents: RwLock<HashMap<String, Box<dyn AgentBackend>>>,
    app_handle: AppHandle,
}

impl AgentService {
    /// 为对话创建或获取 Agent 实例
    pub async fn get_or_create(
        &self,
        conversation_id: &str,
        agent_type: &str,
    ) -> Result<Arc<dyn AgentBackend>, AppError>;

    /// 转发 Agent 事件到前端
    async fn forward_events(
        app_handle: AppHandle,
        conversation_id: String,
        mut rx: mpsc::Receiver<AgentEvent>,
    );
}
```

### 4.2 ACP Agent 实现

```rust
// src-tauri/src/services/agent/acp.rs

/// ACP (Anthropic Claude Protocol) Agent
/// 通过子进程与 Claude Code / Codebuddy 通信
pub struct AcpAgent {
    process: Option<Child>,
    stdin: Option<ChildStdin>,
    status: Arc<RwLock<AgentStatus>>,
    config: AcpConfig,
}

impl AcpAgent {
    /// 检测系统中可用的 ACP 兼容工具
    pub fn detect_available() -> Vec<DetectedAgent>;

    /// 启动子进程（claude, codebuddy, codex 等）
    async fn spawn_process(&mut self) -> Result<(), AppError>;

    /// 通过 stdin/stdout JSON-RPC 通信
    async fn send_jsonrpc(&self, method: &str, params: Value) -> Result<Value, AppError>;
}

impl AgentBackend for AcpAgent {
    // ... trait 实现
}
```

### 4.3 Conversation Service

```rust
// src-tauri/src/services/conversation.rs

pub struct ConversationService {
    db: Arc<DatabasePool>,
}

impl ConversationService {
    pub async fn create(&self, input: CreateConversation) -> Result<Conversation, AppError>;
    pub async fn get(&self, id: &str) -> Result<Conversation, AppError>;
    pub async fn list(&self, params: ListParams) -> Result<PaginatedResult<Conversation>, AppError>;
    pub async fn update(&self, id: &str, updates: ConversationUpdate) -> Result<Conversation, AppError>;
    pub async fn delete(&self, id: &str) -> Result<(), AppError>;
    pub async fn add_message(&self, conv_id: &str, msg: CreateMessage) -> Result<Message, AppError>;
    pub async fn get_messages(&self, conv_id: &str) -> Result<Vec<Message>, AppError>;
    pub async fn get_by_workspace(&self, path: &str) -> Result<Vec<Conversation>, AppError>;
    pub async fn get_grouped_history(&self) -> Result<GroupedHistory, AppError>;
}
```

### 4.4 Cron Service

```rust
// src-tauri/src/services/cron.rs

pub struct CronService {
    scheduler: JobScheduler,
    jobs: HashMap<String, CronJob>,
    db: Arc<DatabasePool>,
    agent_service: Arc<AgentService>,
    busy_guard: Arc<Mutex<HashSet<String>>>,
}

impl CronService {
    pub async fn init(db: Arc<DatabasePool>, agent: Arc<AgentService>) -> Result<Self, AppError>;
    pub async fn add_job(&mut self, input: CronJobInput) -> Result<CronJob, AppError>;
    pub async fn update_job(&mut self, id: &str, updates: CronJobUpdate) -> Result<CronJob, AppError>;
    pub async fn remove_job(&mut self, id: &str) -> Result<(), AppError>;
    pub async fn list_jobs(&self) -> Vec<CronJob>;
    pub async fn get_job(&self, id: &str) -> Result<CronJob, AppError>;

    /// 执行 Cron 任务（带并发保护）
    async fn execute_job(&self, job_id: &str) -> Result<(), AppError>;
}
```

### 4.5 Channel Service

```rust
// src-tauri/src/services/channel/mod.rs

/// 通道插件统一接口
pub trait ChannelPlugin: Send + Sync {
    async fn start(&mut self) -> Result<(), AppError>;
    async fn stop(&mut self) -> Result<(), AppError>;
    async fn send_message(&self, session_id: &str, content: &str) -> Result<(), AppError>;
    fn status(&self) -> PluginStatus;
}

pub struct ChannelService {
    plugins: HashMap<String, Box<dyn ChannelPlugin>>,
    session_manager: SessionManager,
    pairing_service: PairingService,
    db: Arc<DatabasePool>,
}

// 各平台实现
pub struct TelegramPlugin { /* grammY 等效 Rust 实现 */ }
pub struct LarkPlugin { /* 飞书 SDK Rust 实现 */ }
pub struct DingTalkPlugin { /* 钉钉 Stream Rust 实现 */ }
```

### 4.6 WebUI Server (Axum)

```rust
// src-tauri/src/webui/server.rs

pub struct WebUiServer {
    handle: Option<JoinHandle<()>>,
    shutdown_tx: Option<oneshot::Sender<()>>,
    port: u16,
}

impl WebUiServer {
    pub async fn start(
        port: u16,
        remote: bool,
        state: Arc<AppState>,
    ) -> Result<Self, AppError> {
        let app = Router::new()
            // 认证路由
            .route("/login", post(auth::login))
            .route("/logout", post(auth::logout))
            .route("/api/auth/user", get(auth::get_user))
            .route("/api/auth/qr-login", get(auth::qr_login))
            // API 路由
            .nest("/api", api_routes())
            // WebSocket
            .route("/ws", get(websocket::handler))
            // 静态资源
            .fallback_service(ServeDir::new("dist"))
            // 中间件
            .layer(CorsLayer::permissive())
            .layer(TraceLayer::new_for_http())
            .with_state(state);

        // 启动服务器
        let listener = tokio::net::TcpListener::bind(addr).await?;
        // ...
    }

    pub async fn stop(&mut self) -> Result<(), AppError>;
}
```

## 5. 事件系统设计

### 5.1 后端 → 前端事件

```rust
// 事件名称常量
pub mod events {
    pub const AGENT_MESSAGE_START: &str = "agent:message-start";
    pub const AGENT_MESSAGE_DELTA: &str = "agent:message-delta";
    pub const AGENT_MESSAGE_COMPLETE: &str = "agent:message-complete";
    pub const AGENT_TOOL_CALL: &str = "agent:tool-call";
    pub const AGENT_PERMISSION_REQUEST: &str = "agent:permission-request";
    pub const AGENT_STATUS_CHANGE: &str = "agent:status-change";
    pub const AGENT_ERROR: &str = "agent:error";

    pub const CRON_JOB_STARTED: &str = "cron:job-started";
    pub const CRON_JOB_COMPLETED: &str = "cron:job-completed";
    pub const CRON_JOB_FAILED: &str = "cron:job-failed";

    pub const CHANNEL_MESSAGE: &str = "channel:message";
    pub const CHANNEL_STATUS: &str = "channel:status";

    pub const SETTINGS_CHANGED: &str = "settings:changed";
    pub const LANGUAGE_CHANGED: &str = "settings:language-changed";
    pub const THEME_CHANGED: &str = "settings:theme-changed";

    pub const UPDATE_AVAILABLE: &str = "update:available";
    pub const UPDATE_PROGRESS: &str = "update:progress";
}
```

### 5.2 内部事件总线

```rust
// 使用 tokio broadcast channel 实现内部事件总线
pub struct EventBus {
    tx: broadcast::Sender<InternalEvent>,
}

pub enum InternalEvent {
    ConversationCreated(String),
    ConversationDeleted(String),
    AgentStarted { conversation_id: String, agent_type: String },
    AgentStopped { conversation_id: String },
    SettingsChanged { category: String },
    // ...
}
```

## 6. 进程管理策略

### 6.1 AI Agent 子进程

```
┌─────────────────────────────────────────┐
│            Tauri Rust Backend            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │       AgentService              │    │
│  │  ┌───────────┐ ┌────────────┐   │    │
│  │  │ AcpAgent  │ │GeminiAgent │   │    │
│  │  │           │ │            │   │    │
│  │  │ stdin ──► │ │ HTTP API ──┤   │    │
│  │  │ ◄── stdout│ │ ◄── SSE   │   │    │
│  │  └─────┬─────┘ └─────┬──────┘   │    │
│  │        │              │          │    │
│  └────────┼──────────────┼──────────┘    │
│           │              │               │
├───────────┼──────────────┼───────────────┤
│           ▼              ▼               │
│    ┌──────────┐   ┌───────────┐          │
│    │ claude   │   │ Gemini    │          │
│    │ codex    │   │ HTTP API  │          │
│    │ codebuddy│   │           │          │
│    └──────────┘   └───────────┘          │
│    (子进程)        (HTTP 请求)            │
└─────────────────────────────────────────┘
```

### 6.2 进程生命周期

```rust
/// 子进程管理器
pub struct ProcessManager {
    processes: Arc<RwLock<HashMap<String, ManagedProcess>>>,
}

pub struct ManagedProcess {
    child: Child,
    pid: u32,
    started_at: chrono::DateTime<chrono::Utc>,
    process_type: ProcessType,
}

impl ProcessManager {
    /// 启动子进程
    pub async fn spawn(
        &self,
        id: &str,
        command: &str,
        args: &[&str],
        env: HashMap<String, String>,
    ) -> Result<ManagedProcess, AppError>;

    /// 优雅关闭子进程
    pub async fn terminate(&self, id: &str) -> Result<(), AppError>;

    /// 强制杀死子进程
    pub async fn kill(&self, id: &str) -> Result<(), AppError>;

    /// 应用退出时清理所有子进程
    pub async fn cleanup_all(&self);
}
```

## 7. 日志与监控

```rust
// 使用 tracing 框架
use tracing::{info, warn, error, debug, instrument};

// 初始化
fn init_tracing() {
    tracing_subscriber::fmt()
        .with_env_filter("aionui=debug,axum=info")
        .with_file(true)
        .with_line_number(true)
        .init();
}

// 使用示例
#[instrument(skip(state))]
async fn create_conversation(
    name: String,
    state: State<'_, AppState>,
) -> Result<Conversation, AppError> {
    info!(name = %name, "Creating new conversation");
    // ...
}
```
