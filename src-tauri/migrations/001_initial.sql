-- AionX 初始数据库 Schema
-- 版本: 1
-- 描述: 创建所有核心表

-- 迁移跟踪表
CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 用户表 (WebUI 认证)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    jwt_secret TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_login INTEGER
);

-- 聊天会话表
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'chat',
    model TEXT DEFAULT '',
    agent_type TEXT DEFAULT '',
    workspace_path TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    extra TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    msg_id TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'text',
    role TEXT NOT NULL DEFAULT 'user',
    content TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'complete',
    extra TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- 助手插件表 (AI Agent 配置)
CREATE TABLE IF NOT EXISTS assistant_plugins (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    config TEXT DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'disconnected',
    last_connected INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 助手用户表 (通道用户映射)
CREATE TABLE IF NOT EXISTS assistant_users (
    id TEXT PRIMARY KEY,
    platform_user_id TEXT NOT NULL,
    platform_type TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    authorized_at INTEGER,
    last_active INTEGER,
    session_id TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 通道插件表
CREATE TABLE IF NOT EXISTS channel_plugins (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 0,
    config TEXT DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'stopped',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 通道会话表
CREATE TABLE IF NOT EXISTS channel_sessions (
    id TEXT PRIMARY KEY,
    plugin_id TEXT NOT NULL,
    platform_chat_id TEXT NOT NULL,
    chat_id TEXT,
    user_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (plugin_id) REFERENCES channel_plugins(id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL
);

-- 通道配对码表
CREATE TABLE IF NOT EXISTS channel_pairing_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT,
    platform_type TEXT NOT NULL,
    platform_user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Cron 任务表
CREATE TABLE IF NOT EXISTS cron_jobs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    cron_expression TEXT NOT NULL,
    chat_id TEXT,
    agent_type TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run INTEGER,
    next_run INTEGER,
    status TEXT NOT NULL DEFAULT 'idle',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- MCP 服务器配置表
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'stdio',
    command TEXT DEFAULT '',
    args TEXT DEFAULT '[]',
    env TEXT DEFAULT '{}',
    url TEXT DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    oauth_config TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 扩展表
CREATE TABLE IF NOT EXISTS extensions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '0.0.0',
    description TEXT DEFAULT '',
    path TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    config TEXT DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_workspace ON chats(workspace_path);
CREATE INDEX IF NOT EXISTS idx_chats_updated ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_position ON messages(chat_id, position);
CREATE INDEX IF NOT EXISTS idx_channel_sessions_plugin ON channel_sessions(plugin_id);
CREATE INDEX IF NOT EXISTS idx_channel_sessions_chat ON channel_sessions(platform_chat_id);
CREATE INDEX IF NOT EXISTS idx_cron_jobs_next_run ON cron_jobs(next_run);
