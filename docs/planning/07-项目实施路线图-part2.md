# 07 - 项目实施路线图（续）

## 4. 核心重构策略（续）

### 4.2 Zustand替代Context API（续）

```typescript
// 新方案（Zustand）- 只需1个文件
export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  activeChatId: null,

  createChat: async (name: string) => {
    const conv = await invoke('create_chat', { name });
    set(state => ({ chats: [...state.chats, conv] }));
  },

  deleteChat: async (id: string) => {
    await invoke('delete_chat', { id });
    set(state => ({
      chats: state.chats.filter(c => c.id !== id)
    }));
  },
}));

// 使用
const { chats, createChat } = useChatStore();
```

**效果**：
- 代码量减少50%+
- 无需Provider包裹
- 更好的性能（避免不必要的重渲染）
- 内置devtools支持

### 4.3 设置页面框架化

**问题**：10个设置页面结构相似，缺乏统一框架

**解决方案**：声明式配置 + 通用渲染器

```typescript
// 设置页面Schema
const geminiSettingsSchema: SettingsPageSchema = {
  title: 'Gemini Settings',
  sections: [
    {
      title: 'API Configuration',
      fields: [
        {
          key: 'apiKey',
          type: 'password',
          label: 'API Key',
          placeholder: 'Enter your Gemini API key',
          validation: { required: true },
        },
        {
          key: 'model',
          type: 'select',
          label: 'Model',
          options: ['gemini-2.0-flash-exp', 'gemini-1.5-pro'],
          defaultValue: 'gemini-2.0-flash-exp',
        },
      ],
    },
  ],
};

// 通用设置页面组件
<SettingsPage schema={geminiSettingsSchema} />
```

**效果**：
- 10个设置页面代码量减少60%
- 统一的表单验证、保存逻辑
- 易于添加新设置页面

---

## 5. 实施路线图

### 5.1 阶段划分

| 阶段 | 名称 | 目标 | 工期 | 依赖 |
|------|------|------|------|------|
| **P0** | 基础设施 | Rust后端框架、数据库、类型系统 | 2周 | 无 |
| **P1** | 核心功能 | 对话管理、Agent基础、文件系统 | 3周 | P0 |
| **P2** | 前端重构 | 统一聊天架构、Zustand迁移 | 3周 | P1 |
| **P3** | 高级功能 | WebUI、MCP、Cron、扩展 | 2周 | P2 |
| **P4** | 多平台通道 | Telegram、飞书、钉钉 | 2周 | P3 |
| **P5** | 测试与优化 | E2E测试、性能优化、打包 | 2周 | P4 |

**总工期**：14周（约3.5个月）

### 5.2 P0阶段：基础设施（2周）

**目标**：搭建Rust后端框架，建立类型系统，初始化数据库

**任务清单**：

1. **Tauri项目初始化**
   - 创建Tauri 2.x项目
   - 配置tauri.conf.json
   - 设置权限系统
   - 配置构建脚本

2. **Rust后端框架**
   - 设计统一错误类型（AppError）
   - 实现全局状态（AppState）
   - 配置tracing日志系统
   - 设置tokio异步运行时

3. **数据库层**
   - 实现sqlx连接池
   - 设计数据库Schema（15张表）
   - 实现迁移系统
   - 编写数据模型（CRUD）

4. **类型系统**
   - 配置specta + tauri-specta v2
   - 定义核心类型（Chat、Message、Agent等）
   - 自动生成TypeScript类型
   - 设置类型同步工作流

5. **前端基础**
   - 创建Vite + React项目
   - 配置Arco Design + UnoCSS
   - 设置路由（React Router 7）
   - 配置i18next国际化

**交付物**：
- ✅ Tauri项目可运行
- ✅ 数据库Schema完成
- ✅ 类型系统自动同步
- ✅ 前端框架搭建完成

### 5.3 P1阶段：核心功能（3周）

**目标**：实现对话管理、Agent基础、文件系统

**任务清单**：

1. **对话管理（M02）**
   - 实现对话CRUD Commands
   - 实现消息管理Commands
   - 实现流式响应（Tauri Event）
   - 前端对话列表组件

2. **Agent管理（M03）**
   - 实现Agent管理器
   - 实现ACP Agent（优先）
   - 实现Gemini Agent
   - 实现子进程管理（Codex）

3. **文件系统（M04）**
   - 实现文件读写Commands
   - 实现目录遍历
   - 实现文件监听
   - 工作空间管理

4. **设置系统（M05）**
   - 实现设置CRUD Commands
   - 使用tauri-plugin-store
   - 前端设置框架

**交付物**：
- ✅ 可创建对话并发送消息
- ✅ ACP和Gemini Agent可用
- ✅ 文件系统操作正常
- ✅ 设置可保存和读取

### 5.4 P2阶段：前端重构（3周）

**目标**：统一Agent聊天架构，迁移到Zustand，完成UI复刻

**任务清单**：

1. **统一聊天架构**
   - 实现AgentAdapter接口
   - 实现ChatContainer统一容器
   - 实现ChatMessageList
   - 实现ChatSendBox
   - 实现消息渲染器（8种类型）

2. **Agent适配器**
   - 实现ACP适配器
   - 实现Gemini适配器
   - 实现Codex适配器
   - 实现Nanobot适配器
   - 实现OpenClaw适配器

3. **Zustand状态管理**
   - 实现chatStore
   - 实现settingsStore
   - 实现themeStore
   - 实现workspaceStore
   - 实现authStore

4. **UI组件迁移**
   - 迁移Markdown组件
   - 迁移代码高亮组件
   - 迁移文件预览组件
   - 迁移主题系统
   - 迁移布局组件

5. **设置页面**
   - 实现设置页面框架
   - 迁移10个设置页面
   - 实现设置Schema

**交付物**：
- ✅ 5个Agent聊天界面完全一致
- ✅ 所有状态迁移到Zustand
- ✅ UI 100%复刻原项目
- ✅ 10个设置页面完成

### 5.5 P3阶段：高级功能（2周）

**目标**：实现WebUI、MCP、Cron、扩展系统

**任务清单**：

1. **WebUI服务器（M06）**
   - 实现Axum HTTP服务器
   - 实现JWT认证（argon2）
   - 实现WebSocket
   - 实现QR码登录
   - 实现速率限制

2. **MCP集成（M07）**
   - 实现MCP服务器管理
   - 实现OAuth认证流程
   - 实现MCP工具调用
   - 前端MCP设置页面

3. **定时任务（M08）**
   - 实现Cron调度器
   - 实现任务CRUD
   - 实现任务执行器
   - 前端Cron管理界面

4. **扩展系统（M09）**
   - 实现扩展加载器
   - 实现扩展注册表
   - 实现沙箱隔离
   - 前端扩展设置页面

**交付物**：
- ✅ WebUI可远程访问
- ✅ MCP服务器可配置和使用
- ✅ 定时任务可创建和执行
- ✅ 扩展系统可用

### 5.6 P4阶段：多平台通道（2周）

**目标**：实现Telegram、飞书、钉钉通道

**任务清单**：

1. **通道框架（M10）**
   - 实现通道管理器
   - 实现会话管理
   - 实现配对码系统
   - 实现消息路由

2. **Telegram通道**
   - 集成grammY SDK
   - 实现长轮询
   - 实现消息转换
   - 实现键盘交互

3. **飞书通道**
   - 集成飞书SDK
   - 实现WebSocket连接
   - 实现卡片消息
   - 实现事件处理

4. **钉钉通道**
   - 集成钉钉SDK
   - 实现Stream连接
   - 实现AI Card
   - 实现事件处理

**交付物**：
- ✅ Telegram通道可用
- ✅ 飞书通道可用
- ✅ 钉钉通道可用
- ✅ 配对码系统正常

### 5.7 P5阶段：测试与优化（2周）

**目标**：E2E测试、性能优化、打包发布

**任务清单**：

1. **测试**
   - 编写E2E测试（Playwright）
   - 编写单元测试（Vitest）
   - 测试覆盖率>70%
   - 修复发现的Bug

2. **性能优化**
   - 数据库查询优化
   - 前端渲染优化
   - 内存占用优化
   - 启动速度优化

3. **打包与发布**
   - 配置Tauri打包
   - 配置自动更新
   - 生成安装包（Win/Mac/Linux）
   - 编写发布文档

4. **文档**
   - 用户手册
   - 开发者文档
   - API文档
   - 迁移指南

**交付物**：
- ✅ 测试覆盖率>70%
- ✅ 性能达标（启动<3s，内存<200MB）
- ✅ 安装包可用
- ✅ 文档完整

---

## 6. 模块依赖关系

```
                    ┌──────────────┐
                    │  Application │
                    │   (入口)      │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Database │ │  Config  │ │  Events  │
        │  (基础)   │ │  (基础)   │ │  (基础)   │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
    ┌────────┴────────────┴────────────┴────────┐
    ▼        ▼        ▼        ▼        ▼       ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Auth │ │ Chat │ │ File │ │ MCP  │ │ Ext  │ │ Cron │
└──┬───┘ └──┬───┘ └──────┘ └──────┘ └──────┘ └──┬───┘
   │        │                                    │
   ▼        ▼                                    ▼
┌──────┐ ┌──────┐                           ┌──────┐
│WebUI │ │Agent │◄──────────────────────────│ Task │
└──────┘ └──┬───┘                           └──────┘
            │
            ▼
       ┌──────────┐
       │ Channel  │
       └──────────┘
```

**依赖说明**：
- **基础层**（Database、Config、Events）— 无依赖，最先实现
- **业务层**（Auth、Chat、File、MCP、Ext、Cron）— 依赖基础层
- **应用层**（WebUI、Agent、Channel）— 依赖业务层
- **Task** — 依赖Cron和Agent

---

## 7. 数据库设计

### 7.1 核心表结构

**15张表**：

1. **chats** — 对话表
2. **messages** — 消息表
3. **message_attachments** — 消息附件表
4. **workspaces** — 工作空间表
5. **workspace_files** — 工作空间文件表
6. **settings** — 设置表
7. **api_keys** — API密钥表
8. **mcp_servers** — MCP服务器表
9. **mcp_oauth_tokens** — MCP OAuth令牌表
10. **cron_jobs** — 定时任务表
11. **cron_executions** — 任务执行记录表
12. **extensions** — 扩展表
13. **webui_users** — WebUI用户表
14. **channel_sessions** — 通道会话表
15. **pairing_codes** — 配对码表

### 7.2 关键表设计示例

```sql
-- 对话表
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    workspace_path TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    archived BOOLEAN DEFAULT 0
);

-- 消息表
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    type TEXT NOT NULL,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- MCP服务器表
CREATE TABLE mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    args TEXT,
    env TEXT,
    enabled BOOLEAN DEFAULT 1,
    created_at INTEGER NOT NULL
);
```

---

## 8. Tauri Commands接口设计

### 8.1 对话管理Commands

```rust
#[tauri::command]
#[specta::specta]
async fn create_chat(
    name: String,
    agent_type: AgentType,
    workspace_path: Option<String>,
    state: State<'_, AppState>,
) -> Result<Chat, AppError>;

#[tauri::command]
#[specta::specta]
async fn get_chats(
    state: State<'_, AppState>,
) -> Result<Vec<Chat>, AppError>;

#[tauri::command]
#[specta::specta]
async fn delete_chat(
    id: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
#[specta::specta]
async fn send_message(
    chat_id: String,
    content: String,
    attachments: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<Message, AppError>;
```

### 8.2 Agent控制Commands

```rust
#[tauri::command]
#[specta::specta]
async fn start_agent(
    agent_type: AgentType,
    config: AgentConfig,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
#[specta::specta]
async fn stop_agent(
    agent_type: AgentType,
    state: State<'_, AppState>,
) -> Result<(), AppError>;

#[tauri::command]
#[specta::specta]
async fn get_agent_status(
    agent_type: AgentType,
    state: State<'_, AppState>,
) -> Result<AgentStatus, AppError>;
```

### 8.3 文件系统Commands

```rust
#[tauri::command]
#[specta::specta]
async fn read_file(
    path: String,
) -> Result<String, AppError>;

#[tauri::command]
#[specta::specta]
async fn write_file(
    path: String,
    content: String,
) -> Result<(), AppError>;

#[tauri::command]
#[specta::specta]
async fn list_directory(
    path: String,
) -> Result<Vec<FileEntry>, AppError>;

#[tauri::command]
#[specta::specta]
async fn watch_workspace(
    path: String,
    state: State<'_, AppState>,
) -> Result<(), AppError>;
```

**总计29个Commands**，覆盖所有功能模块。

---

## 9. 风险评估与应对

### 9.1 技术风险

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| Rust学习曲线陡峭 | 高 | 中 | 提前学习，参考Tauri官方示例 |
| Agent子进程管理复杂 | 高 | 中 | 使用tokio::process，参考原项目逻辑 |
| WebSocket连接稳定性 | 中 | 低 | 实现重连机制，心跳检测 |
| 数据库迁移失败 | 高 | 低 | 充分测试，提供回滚方案 |
| 类型同步不一致 | 中 | 低 | 使用tauri-specta自动生成 |

### 9.2 进度风险

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| 功能范围蔓延 | 高 | 中 | 严格按照路线图执行，拒绝新需求 |
| 测试时间不足 | 中 | 中 | 提前编写测试，持续集成 |
| 依赖库版本冲突 | 低 | 低 | 锁定版本，使用Cargo.lock |
| 打包配置复杂 | 中 | 低 | 参考Tauri官方文档 |

### 9.3 质量风险

| 风险 | 影响 | 概率 | 应对策略 |
|------|------|------|---------|
| UI不一致 | 高 | 中 | 严格对照原项目，像素级复刻 |
| 性能不达标 | 中 | 低 | 持续性能监控，及时优化 |
| 内存泄漏 | 中 | 低 | 使用Rust所有权系统，前端及时清理 |
| 安全漏洞 | 高 | 低 | 代码审查，使用安全的库 |

---

## 10. 性能目标

### 10.1 启动性能

| 指标 | 原项目（Electron） | 目标（Tauri） | 改进 |
|------|-------------------|--------------|------|
| 冷启动时间 | ~5-8s | <3s | 40-60% |
| 热启动时间 | ~2-3s | <1s | 50-66% |
| 首屏渲染 | ~1-2s | <500ms | 50-75% |

### 10.2 内存占用

| 指标 | 原项目（Electron） | 目标（Tauri） | 改进 |
|------|-------------------|--------------|------|
| 空闲内存 | ~300-400MB | <150MB | 50-62% |
| 单对话内存 | ~400-500MB | <200MB | 50-60% |
| 多对话内存 | ~600-800MB | <300MB | 50-62% |

### 10.3 打包体积

| 指标 | 原项目（Electron） | 目标（Tauri） | 改进 |
|------|-------------------|--------------|------|
| Windows安装包 | ~150MB | <20MB | 86% |
| macOS安装包 | ~180MB | <25MB | 86% |
| Linux安装包 | ~160MB | <22MB | 86% |

### 10.4 响应性能

| 指标 | 原项目 | 目标 | 改进 |
|------|--------|------|------|
| 消息发送延迟 | <100ms | <50ms | 50% |
| 文件读取延迟 | <200ms | <100ms | 50% |
| 设置保存延迟 | <150ms | <50ms | 66% |
| 对话切换延迟 | <300ms | <100ms | 66% |

---

## 11. 代码量对比

### 11.1 前端代码量

| 模块 | 原项目（LOC） | 新项目（LOC） | 减少 |
|------|--------------|--------------|------|
| Agent聊天组件 | ~8,000 | ~2,000 | 75% |
| 设置页面 | ~3,500 | ~1,500 | 57% |
| Context/Provider | ~1,200 | 0 | 100% |
| 共享组件 | ~4,000 | ~3,500 | 12% |
| Hooks | ~2,000 | ~1,500 | 25% |
| 其他 | ~5,000 | ~4,500 | 10% |
| **总计** | **~23,700** | **~13,000** | **45%** |

### 11.2 后端代码量

| 模块 | 原项目（Node.js LOC） | 新项目（Rust LOC） | 变化 |
|------|---------------------|-------------------|------|
| 数据库层 | ~2,000 | ~2,500 | +25% |
| Agent管理 | ~5,000 | ~4,000 | -20% |
| 文件系统 | ~1,500 | ~1,200 | -20% |
| WebUI服务器 | ~2,000 | ~1,800 | -10% |
| 通道系统 | ~3,000 | ~2,800 | -7% |
| 其他 | ~2,500 | ~2,200 | -12% |
| **总计** | **~16,000** | **~14,500** | **-9%** |

### 11.3 总代码量

| 项目 | 原项目（LOC） | 新项目（LOC） | 减少 |
|------|--------------|--------------|------|
| 前端 | 23,700 | 13,000 | 45% |
| 后端 | 16,000 | 14,500 | 9% |
| **总计** | **39,700** | **27,500** | **31%** |

---

## 12. 关键里程碑

| 里程碑 | 时间点 | 标志 |
|--------|--------|------|
| M1 - 项目启动 | Week 0 | Tauri项目初始化完成 |
| M2 - 基础设施完成 | Week 2 | 数据库、类型系统、前端框架就绪 |
| M3 - 核心功能可用 | Week 5 | 可创建对话、发送消息、ACP Agent可用 |
| M4 - 前端重构完成 | Week 8 | 5个Agent界面一致、Zustand迁移完成 |
| M5 - 高级功能完成 | Week 10 | WebUI、MCP、Cron、扩展系统可用 |
| M6 - 通道系统完成 | Week 12 | Telegram、飞书、钉钉通道可用 |
| M7 - 测试完成 | Week 13 | 测试覆盖率>70%，Bug修复完成 |
| M8 - 发布就绪 | Week 14 | 安装包生成，文档完整，性能达标 |

---

## 13. 成功标准

### 13.1 功能完整性

- ✅ 所有原项目功能100%迁移
- ✅ 5个Agent全部可用
- ✅ 10个设置页面全部迁移
- ✅ 6种语言国际化支持
- ✅ WebUI远程访问正常
- ✅ 3个通道平台全部可用

### 13.2 性能达标

- ✅ 启动时间<3s
- ✅ 内存占用<200MB
- ✅ 打包体积<20MB
- ✅ 消息发送延迟<50ms

### 13.3 代码质量

- ✅ 测试覆盖率>70%
- ✅ 无严重Bug
- ✅ 代码重复率<10%
- ✅ 类型安全100%

### 13.4 用户体验

- ✅ UI 100%复刻原项目
- ✅ 交互体验一致
- ✅ 无明显卡顿
- ✅ 文档完整

---

## 14. 总结

本路线图整合了01-09所有文档的分析和设计，提供了清晰的实施路径：

1. **技术选型明确** — Tauri 2.x + Rust + React 19 + Zustand
2. **架构设计完整** — 统一Agent架构、功能模块化、扁平化目录
3. **实施计划详细** — 5个阶段、14周工期、清晰的里程碑
4. **风险可控** — 识别关键风险，制定应对策略
5. **目标明确** — 性能提升、代码减少、UI一致

**预期成果**：
- 打包体积减少85%+
- 内存占用减少50%+
- 代码量减少31%
- 启动速度提升40-60%
- 开发效率提升50%+

项目成功的关键在于：
1. 严格按照路线图执行
2. 持续测试和优化
3. 保持UI 100%一致
4. 及时识别和解决风险
