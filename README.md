# AionX

**AionX** 是一个基于 Tauri 2.x 的 AI Agent 协作平台，支持多种 AI Agent 的统一管理和交互。

## ✨ 特性

- 🤖 **多 Agent 支持**：集成 ACP (Claude Code)、Codex、Gemini、Nanobot、OpenClaw 五种 Agent
- 💬 **统一聊天界面**：提供一致的用户体验，支持 Agent 间无缝切换
- 🔐 **安全认证**：基于 Argon2 + JWT 的用户认证系统
- 🌐 **WebUI 支持**：内置 Axum Web 服务器，支持 WebSocket 实时通信
- 📁 **文件系统**：完整的文件操作命令集
- ⏰ **定时任务**：基于 tokio-cron-scheduler 的 Cron 任务调度
- 🔌 **MCP 协议**：支持 Model Context Protocol 扩展
- 💾 **SQLite 数据库**：使用 sqlx + WAL 模式，包含完整的迁移系统

## 🛠️ 技术栈

### 后端 (Rust)
- **框架**: Tauri 2.x
- **数据库**: sqlx + SQLite (WAL 模式)
- **Web 服务**: Axum + WebSocket
- **认证**: Argon2 + JWT
- **异步运行时**: Tokio
- **类型导出**: tauri-specta v2

### 前端 (React)
- **框架**: React 19
- **UI 库**: Arco Design
- **样式**: UnoCSS
- **状态管理**: Zustand
- **路由**: React Router v7
- **国际化**: i18next
- **构建工具**: Vite

## 📦 项目结构

```
AionX/
├── src-tauri/           # Rust 后端
│   ├── src/
│   │   ├── commands/    # Tauri 命令 (43个)
│   │   ├── dao/         # 数据访问层 (8个 DAO)
│   │   ├── services/    # 业务逻辑层
│   │   ├── agents/      # AI Agent 实现 (5个)
│   │   ├── models/      # 数据模型
│   │   ├── utils/       # 工具函数
│   │   └── lib.rs       # 库入口
│   ├── migrations/      # 数据库迁移文件
│   └── Cargo.toml
├── src/                 # React 前端
│   ├── components/      # UI 组件
│   ├── stores/          # Zustand 状态管理
│   ├── pages/           # 页面组件
│   └── bindings.ts      # 自动生成的类型绑定
├── docs/                # 项目文档
│   └── planning/        # 规划文档 (01-09)
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.70
- pnpm / npm / yarn

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# Rust 依赖会在构建时自动安装
```

### 开发模式

```bash
# 启动开发服务器
pnpm tauri dev
```
### Rust 命令执行位置

仓库根目录已配置 Cargo workspace，可直接在根目录执行 Rust 命令：

```bash
# 在仓库根目录执行
cargo check
```


### 构建生产版本

```bash
# 构建应用
pnpm tauri build
```

## 📊 项目统计

- **Tauri 命令**: 43 个
- **Rust 文件**: 68 个 (6096 行代码)
- **TypeScript 文件**: 66 个 (1295 行代码)
- **数据库表**: 12 个
- **编译状态**: ✅ cargo check 0 errors, tsc 0 errors

## 🎯 已完成阶段

- ✅ **Phase 0**: 项目初始化、Specta 类型系统、Tauri 脚手架
- ✅ **Phase 1**: 数据库 (sqlx + WAL + migrations)、配置、事件、日志、错误处理
- ✅ **Phase 2**: DAO 层 (8个)、ChatService、MessageService、ACP Agent (Claude Code stream-json)、前端聊天 UI + Zustand stores
- ✅ **Phase 3**: 5 个 Agent (ACP/Codex/Gemini/Nanobot/OpenClaw)，每个都有官方协议解析，Agent 切换 UI
- ✅ **Phase 4**: 文件系统 (7个命令)、认证 (Argon2+JWT)、WebUI (Axum+WS+CORS)、MCP (5个命令)、Cron (5个命令)
- ✅ **Phase 5**: Clippy 清理、能力更新

## 🤖 支持的 Agent

### ACP (Claude Code)
- 协议: `--output-format stream-json`
- 消息类型: system/assistant/stream_event/result

### Codex
- 协议: `codex exec --json`
- 事件: thread.started/turn/item.started/completed

### Gemini
- 协议: HTTP SSE streamGenerateContent
- 流式响应支持

### Nanobot
- 协议: subprocess per-message
- 命令: `nanobot agent -m --session --no-markdown`

### OpenClaw
- 协议: WebSocket Gateway v3
- 支持: RPC + chat.event (delta/final) + agent.event (tool)

## 📝 开发指南

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/commands/` 中创建命令文件
2. 使用 `#[tauri::command]` 和 `#[specta::specta]` 宏
3. 在 `lib.rs` 中注册命令
4. 运行 `pnpm tauri dev` 自动生成 TypeScript 类型

### 数据库迁移

```bash
# 创建新迁移
sqlx migrate add <migration_name>

# 运行迁移
sqlx migrate run
```

### 类型同步

项目使用 tauri-specta v2 自动生成 TypeScript 类型绑定到 `src/bindings.ts`。

## 📄 许可证

[待定]

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**从 AionUi (Electron) 迁移到 AionX (Tauri)**
