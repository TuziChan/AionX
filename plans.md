# 完成设置页迁移并在不破坏现有架构的前提下做高保真复刻

本计划是一份持续维护的执行文档。执行过程中必须始终更新 `Progress`、`Surprises & Discoveries`、`Decision Log` 和 `Outcomes & Retrospective` 四个章节，保证任何新的执行者只依赖这一个文件和当前工作树，就能继续把任务做完。

当前仓库根目录没有已检入的 `PLANS.md` 文件，因此本文件不依赖外部计划规范文件，所有执行说明都直接写在这里。

本计划中提到的“原项目”特指本地参考仓库 `F:\Work\AionUi`。后续所有“高保真复刻”“旧页面对照”“原项目布局/尺寸/样式核查”都必须优先以这个路径下的实现为准，而不是仅凭当前仓库中的历史残留文件推断。

## Purpose / Big Picture

这项工作的最终目标有两层。第一层是把设置页剩余的两个老页面 `Display` 和 `About` 迁移到已经建立好的 `SettingsLayout + registry + per-page domain + typed API` 架构下，让 `/settings/*` 的九个页面全部完成真实迁移、真实接口接入和真实自动化验证。第二层是在迁移全部完成后，逐页核查并修正视觉结果，使每一页在组件尺寸、间距、排版、块级结构、控件位置、页面布局和交互层次上，尽可能精确复刻旧实现的视觉与信息架构，但实现方式必须继续遵守当前新架构，不能为了“看起来像”而把旧单文件页面直接搬回来。

完成后，用户可以打开 `#/settings/gemini` 到 `#/settings/about` 的所有设置页，看到统一的独立设置工作区，并且每一页都既符合现在的架构边界，又在视觉上最大程度贴近原始页面。可见证据必须包括：`npm run build` 通过，`cargo check` 通过，`npm run e2e:debug:desktop` 通过，`npm run e2e:debug:responsive` 通过，并且对每一页完成一次基于历史实现的高保真核查。

## Progress

- [x] (2026-03-18 00:07 +08:00) 确认仓库中没有已检入的 `PLANS.md`；本计划必须完全自包含。
- [x] (2026-03-18 00:07 +08:00) 确认当前真实基线为 `R-001`、`L-001`、`S-001`、`M-001`、`P-001`、`P-002`、`P-003`、`P-004`、`P-005`、`P-006`、`P-007` 已完成，下一阶段是 `P-008`。
- [x] (2026-03-18 00:43 +08:00) 完成 `P-008`：新增 `src/features/settings/api/display.ts`、`src/features/settings/pages/display/{page,types,hooks,components}`，接入 `get_display_settings/save_display_settings` typed API，切换 [src/features/settings/routes.tsx](src/features/settings/routes.tsx) 到新页面，删除旧的 [src/features/settings/pages/DisplaySettings.tsx](src/features/settings/pages/DisplaySettings.tsx)，并通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 验证。
- [x] (2026-03-18 01:05 +08:00) 完成 `P-009`：新增 `src/features/settings/api/about.ts`、`src/features/settings/pages/about/{page,types,hooks,components}`，补齐 Rust 端 `get_app_metadata/get_update_preferences/save_update_preferences/check_for_updates` typed API，切换 [src/features/settings/routes.tsx](src/features/settings/routes.tsx) 到新页面，删除旧的 [src/features/settings/pages/About.tsx](src/features/settings/pages/About.tsx)，并通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 验证。
- [x] (2026-03-18 00:43 +08:00) 更新 [docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md) 中 `P-008` 的状态、验证结果与下一阶段起点。
- [x] (2026-03-18 01:05 +08:00) 更新 [docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md) 中 `P-009` 的状态、验证结果、updater 启动阻塞修复和下一阶段起点。
- [ ] (2026-03-18 01:15 +08:00) 为所有九个设置页收集“旧实现参考物”（已完成：创建 `tmp/settings-aionui-reference/` 与 `tmp/settings-legacy/`，导出 AionUi settings wrappers、modal contents 以及当前仓库九页旧单文件快照；剩余：补记每页直接依赖组件与逐页来源清单）。
- [x] (2026-03-18 01:26 +08:00) 完成 `gemini` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\GeminiModalContent.tsx` 与 `tmp/settings-legacy/GeminiSettings.tsx` 收敛为单个窄栏表单卡片、移除 hero/多卡片布局、将 registry 宽度切到 `narrow`，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 01:35 +08:00) 完成 `model` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\ModelModalContent.tsx`，把当前双栏主从结构收敛为单列平台栈，保留现有 hook/API/modals 分层，并重新通过 `npm run build`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 01:54 +08:00) 完成 `agent` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\AgentModalContent.tsx` 与 `AssistantManagement.tsx`，将当前双栏主从页收敛为单卡片助手列表 + 抽屉编辑器，补齐列表内启停、复制与配置入口，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 02:04 +08:00) 完成 `display` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\DisplayModalContent.tsx` 与 `tmp/settings-legacy/DisplaySettings.tsx`，将主题切换器、缩放控件和 CSS 区块节奏收敛到 AionUi 的单卡片 + 折叠段落结构，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 07:59 +08:00) 完成 `webui` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\WebuiModalContent.tsx`、`ChannelModalContent.tsx` 与各平台表单组件，把当前页面收敛为 `WebUI / Channels` 内部 tab、服务卡片 + 登录信息卡片、固定频道折叠卡片与行内表单结构；修复频道字段 `id` 从 camelCase 漂移到 smoke 使用的 kebab-case 导致的桌面端失败，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 08:11 +08:00) 完成 `system` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\SystemModalContent.tsx` 与 `tmp/settings-legacy/SystemSettings.tsx`，把当前页面从双卡片结构收敛为单张主卡片 + 内部分区，补齐通知总开关与任务完成通知的 typed system settings，保留语言/托盘/运行环境与目录能力，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 08:43 +08:00) 完成共享 settings 组件视觉基线首轮对齐：对照 `F:\Work\AionUi\src\renderer\pages\settings\settings.css`、`GeminiModalContent.tsx`、`DisplayModalContent.tsx`、`SystemModalContent.tsx` 与 `ToolsModalContent.tsx`，统一收敛 `settings-group-card`、`settings-preference-row`、settings 作用域输入/选择器、split-view 间距以及 Model/Tools/Agent/WebUI/Extension 等高频卡片的圆角、padding、控件字体和列表项尺寸；同时通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 回归确认这轮共享样式改动没有破坏设置链路。
- [x] (2026-03-18 09:07 +08:00) 完成 `tools` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\ToolsModalContent.tsx`、`McpServerItem.tsx`、`McpServerHeader.tsx` 与 `McpServerToolsList.tsx`，将当前页面从持久双栏主从结构收敛为单列管理卡 + 内联 server 管理行 + 下接详情区的结构，补齐列表项内的测试/编辑/删除/启停动作、活动项展开预览，以及图像生成卡的“标题行开关 + 单表单项”节奏，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 09:24 +08:00) 完成 `about` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\AboutModalContent.tsx` 与 `tmp/settings-legacy/About.tsx`，把当前页面收敛为更接近 AionUi 的窄栏中心结构，补齐 `contactUrl` typed metadata 以恢复 5 行资源入口节奏，收紧版本徽标/GitHub 入口/更新卡密度，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 09:40 +08:00) 完成 `extension` 页首轮高保真复刻核查：对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\ExtensionSettingsTabContent.tsx` 与 `ExtensionSettingsPage.tsx`，把当前页面收敛为“宿主区优先、元信息为次”的 host-first 结构，移除额外 hero 感、收紧标签与按钮密度，并保持 `extension-missing-state`、`extension-host-card`、`extension-host-frame` smoke 选择器不变；该轮代码已先前通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-18 10:04 +08:00) 完成最终审计首轮共享样式修正：新增 `e2e-tests/webdriverio/tests/visual.audit.e2e.mjs` 生成 `tmp/settings-parity/{desktop,responsive}` 真实 Tauri 截图，基于截图修复移动端 settings 顶栏标题被 `SettingsBackLink` 宽度挤压的问题，并移除 `Tools` 管理卡列表区不必要的 `420px` 最小高度，消除短列表场景的大块留白。
- [x] (2026-03-18 10:45 +08:00) 解决 extension 最终审计阻塞：确认 direct WDIO visual audit 失败的根因不是 `extension` 页面结构回退，而是直接执行 `wdio.conf.mjs` 时没有注入 `AIONX_E2E_SEED_EXTENSION=1`，导致 `host-smoke` 未写入 Tauri 测试库；随后在 [e2e-tests/webdriverio/wdio.conf.mjs](e2e-tests/webdriverio/wdio.conf.mjs) 中统一集中 `e2eEnv` 并为该变量提供默认值，重新通过 direct visual audit desktop / responsive、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`，并刷新 `tmp/settings-parity/` 下的 extension 截图工件。
- [x] (2026-03-18 10:58 +08:00) 完成最终审计第二轮共享壳层/组件密度对齐：依据 `F:\Work\AionUi\src\renderer\pages\settings\SettingsSider.tsx` 与多个 modal content 中的 `rd-8px/12px/16px`、`px-12px/32px`、`text-14px` 节奏，进一步收紧 [src/styles/app-shell.css](src/styles/app-shell.css) 中的 settings 侧栏导航、桌面页头、共享卡片圆角和 `settings-group-card__body--padded` 内边距，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 以及 direct visual audit desktop / responsive，刷新整套 `tmp/settings-parity/` 截图工件。
- [ ] (2026-03-18 09:40 +08:00) 进入九个设置页最终全页/全组件审计（已完成：九页首轮结构收敛、共享 settings 组件视觉基线首轮对齐、extension host-first 收敛与文档同步；剩余：逐页核对组件尺寸、padding、字体、颜色、卡片顺序、控件位置和移动端堆叠，必要时继续微调共享样式与局部页面样式）。
- [x] (2026-03-18 10:04 +08:00) 复跑阶段性回归：`npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 全部通过；同时重新生成并核对 `tmp/settings-parity/` 截图，确认移动端顶栏标题恢复单行显示、`Tools` 桌面主卡片留白收紧且未破坏现有 smoke。
- [ ] (2026-03-18 00:07 +08:00) 完成最终回归验证：`npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`，并把本计划与迁移清单更新为最终状态。

## Surprises & Discoveries

- Observation: 仓库中没有已检入的 `PLANS.md`，因此执行计划不能通过“引用已有总规范文件”来省略说明。
  Evidence: 在仓库根目录递归搜索 `PLANS.md` 未找到结果。

- Observation: 设置页九个页面现在都已经切到 `page + api + hooks/components` 新结构，`About` 是最后一个完成迁移的页面。
  Evidence: [src/features/settings/routes.tsx](src/features/settings/routes.tsx) 已把 `gemini`、`model`、`agent`、`display`、`webui`、`system`、`tools`、`about`、`ext/:tabId` 全部指向领域目录页面，旧 [src/features/settings/pages/About.tsx](src/features/settings/pages/About.tsx) 已删除。

- Observation: 现有迁移链路的真实约束已经很明确，后续页面和最终复刻核查都必须继续复用这条链路，不能引入“视觉像旧版、行为退回旧版”的折返。
  Evidence: [docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md) 已明确禁止恢复 wrapper、modal/page 双态、全局 Sidebar settings 模式和页面直连 `commands`。

- Observation: 两条 WebDriver 调试命令必须串行运行，否则会争抢 `tauri-driver` 的 `4444` 端口。
  Evidence: [docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md) 的状态区已经记录这一约束。

- Observation: `F:\Work\AionUi` 的 `DisplaySettings.tsx` 只是 wrapper，真正的显示页结构来自 `components/SettingsModal/contents/DisplayModalContent.tsx`，内容只覆盖主题、字体缩放和 CSS 主题设置。
  Evidence: 原项目中 `DisplaySettings.tsx` 只渲染 `DisplayModalContent`，而 `DisplayModalContent.tsx` 内部引用的组件是 `ThemeSwitcher`、`FontSizeControl` 和 `CssThemeSettings`。

- Observation: 当前仓库旧 `DisplaySettings.tsx` 里的“启用沉浸标题栏”开关并不属于原项目显示页能力，应从迁移目标里移除，而不是继续带入新架构。
  Evidence: `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\DisplayModalContent.tsx` 没有任何标题栏相关设置项，本轮新页面也只保留主题、缩放和自定义 CSS。

- Observation: 仅在 `setup` 中注册 `tauri-plugin-updater` 还不足以让应用启动；如果 `src-tauri/tauri.conf.json` 缺少 `plugins.updater` 对象，真实 Tauri debug 启动会先于页面渲染直接 panic。
  Evidence: 首次执行 `npm run e2e:debug:desktop` 时，应用输出 `Failed to setup app: failed to initialize plugin updater: Error deserializing 'plugins.updater' within your Tauri configuration: invalid type: null, expected struct Config`；补上最小 `plugins.updater` 配置后，desktop 与 responsive smoke 均恢复通过。

- Observation: AionUi 的 settings 页面 wrapper 不能单独作为复刻依据；真正决定内容块结构的，通常是 `components/SettingsModal/contents/*.tsx`，并且若干页面还依赖这些 contents 之外的专用组件。
  Evidence: `DisplaySettings.tsx` 实际只包裹 `DisplayModalContent.tsx`，而 `DisplayModalContent.tsx` 继续依赖 `ThemeSwitcher`、`FontSizeControl`、`CssThemeSettings`；`AgentModalContent.tsx` 继续依赖 `AssistantManagement`；`WebuiModalContent.tsx` 继续依赖 `ChannelModalContent.tsx` 与各平台表单组件。

- Observation: AionUi 的 Gemini 页面不是 hero 卡片加多 section，而是一个窄栏单卡片表单，可见项只有个人认证、代理配置和 `GOOGLE_CLOUD_PROJECT`。
  Evidence: `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\GeminiModalContent.tsx` 只渲染一个 `Form` 容器，字段顺序是 `googleAccount`、`proxy`、`GOOGLE_CLOUD_PROJECT`；当前仓库导出的 `tmp/settings-legacy/GeminiSettings.tsx` 才额外暴露 `authType`、`GOOGLE_GEMINI_BASE_URL`、`yoloMode`、`preferredMode`。

- Observation: Gemini 页收敛到单卡片窄栏结构后，现有真实登录、项目绑定和路由切换持久化链路没有回退，桌面与移动端 smoke 都继续通过。
  Evidence: 2026-03-18 01:26 +08:00 重新执行 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 全部成功；桌面 smoke 仍经过 `connectGeminiAccountAndBindProject` 与 `expectGeminiProjectPersistence`，响应式 smoke 仍覆盖 `#/settings/gemini` 入口。

- Observation: AionUi 的模型页主参考源同样不是当前 AionX 的双栏主从页，而是单列的平台折叠栈；当前新页面原先的 split-view 结构明显偏离原项目信息架构。
  Evidence: `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\ModelModalContent.tsx` 以单个 header 和一组 `Collapse.Item` 渲染平台列表，每个平台在同一列展开模型行；本轮改造后 `npm run e2e:debug:desktop` 仍能完成新增平台、添加模型与健康检查。

- Observation: AionUi 的 Agent 页面同样不是双栏列表/详情页，而是“单个折叠卡片中的助手列表 + 右侧抽屉编辑器”；当前 AionX 初版的 split-view 结构偏离了原项目的交互模型。
  Evidence: `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\AgentModalContent.tsx` 只渲染一个 `Collapse` 包裹的 `AssistantManagement`，而 `AssistantManagement.tsx` 的主结构是可点击助手列表与 `Drawer` 表单；本轮改造后重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。

- Observation: Agent 页改成抽屉交互后，桌面 smoke 不能再沿用“详情常驻页”的操作顺序，必须在读取内置助手信息后先关闭抽屉，再点击“新建助手”或切换到其他行。
  Evidence: 首次回归时 `agent-add-assistant` 被抽屉内 `settings-tools-page__meta-card` 覆盖，`npm run e2e:debug:desktop` 报 `element click intercepted`；将 smoke helper 调整为先关闭抽屉后继续，回归恢复通过。

- Observation: AionUi 的 Display 页虽然表面上只有主题、缩放和 CSS 三块，但其中 `CssThemeSettings` 实际是完整的皮肤主题管理器，而当前 AionX 的 typed Display API 只暴露 `customCss` 单字段。
  Evidence: `F:\Work\AionUi\src\renderer\components\CssThemeSettings\index.tsx` 包含主题卡片列表、激活主题状态和编辑弹窗；当前仓库的 [src/features/settings/api/display.ts](src/features/settings/api/display.ts) 与 [src-tauri/src/models/display.rs](src-tauri/src/models/display.rs) 只定义 `theme`、`zoomFactor`、`customCss` 三项。

- Observation: WebUI 频道区桌面端 smoke 失败的直接原因不是折叠面板未展开，而是字段 `id` 命名从既有的 kebab-case 漂移成了 camelCase，导致 WebDriver 一直找不到 `#webui-channel-default-model-telegram` 与 `#webui-channel-bot-token-telegram`。
  Evidence: `tmp/webui-desktop.log` 中连续报 `no such element: #webui-channel-default-model-telegram`；[src/features/settings/pages/webui/components/ChannelsTab.tsx](src/features/settings/pages/webui/components/ChannelsTab.tsx) 原先使用 ``webui-channel-${field.key}-${preset.type}`` 生成 `id`，将 `defaultModel` 和 `botToken` 分别渲染成了 `defaultModel`、`botToken`，修复为统一 kebab-case 后 `npm run e2e:debug:desktop` 与 `npm run e2e:debug:responsive` 均恢复通过。

- Observation: AionUi 的 System 页面主体并不是当前 AionX 初版的“两张独立卡片”，而是单张主卡片中连续排列的偏好行、通知折叠区和目录输入区；要做到高保真复刻，单纯调间距不够，必须把页面骨架收敛回同一张卡片。
  Evidence: `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\SystemModalContent.tsx` 使用单个 `bg-2 rd-16px` 容器包住 `PreferenceRow`、通知 `Collapse` 和目录 `Form`；本轮将 [src/features/settings/pages/system/page.tsx](src/features/settings/pages/system/page.tsx) 改为单张 `settings-group-card` 包裹两个内部 section 后，`npm run e2e:debug:desktop` 与 `npm run e2e:debug:responsive` 都继续通过。

- Observation: AionUi 的通知总开关与任务完成通知子开关在当前 AionX 的 typed system settings 中原本并不存在，但底层配置存储完全足以承载这两个布尔值，不需要回退到旧 bridge 架构。
  Evidence: 本轮在 [src-tauri/src/models/system.rs](src-tauri/src/models/system.rs) 与 [src-tauri/src/commands/settings.rs](src-tauri/src/commands/settings.rs) 新增 `notification_enabled`、`cron_notification_enabled` 字段及对应 store key 后，`cargo check` 通过，桌面与响应式 smoke 也继续通过。

- Observation: 共享组件视觉基线这一步如果不先做，后续每个页面都会重复修同一批卡片和控件漂移，尤其是圆角、内边距、偏好行高度和输入框尺寸。
  Evidence: 当前 [src/styles/app-shell.css](src/styles/app-shell.css) 原先把 `settings-group-card` 设成 `24px` 圆角、`settings-preference-row` 设成 `92px` 最小高度、若干设置卡片仍保留 `20px` padding；而 AionUi 的 `settings.css` 与各 modal content 主要落点都在 `rd-16px`、`py-12px`、`px-28px/32px` 这一级别。

- Observation: 本轮第一次执行桌面 smoke 失败并不是视觉改动引起的断言回归，而是上一次调试残留的 `aionx` 进程锁住了 `%APPDATA%\\com.aionx.app\\aionx.db`，导致 `onPrepare` 无法清理测试数据，后续 `tauri-driver` 也没有成功接管 `4444` 端口。
  Evidence: `npm run e2e:debug:desktop` 首次输出同时包含 `EBUSY: resource busy or locked, unlink 'C:\\Users\\Victory\\AppData\\Roaming\\com.aionx.app\\aionx.db'` 与 `Unable to connect to "http://127.0.0.1:4444/"`；终止残留 `aionx` 进程后同一命令立即恢复通过。

- Observation: 当前 AionX 的 typed `McpServer` 只暴露基础配置字段，不包含 AionUi `McpServerItem` 依赖的 `status` 与 `tools` 富信息，因此 Tools 页只能在现有 typed API 边界内逼近原项目的 server item 层级，不能凭空复原“展开工具列表”。
  Evidence: [src/bindings.ts](src/bindings.ts) 中 `McpServer` 仅包含 `id/name/type/command/args/env/url/enabled/oauth_config/created_at/updated_at`；[src-tauri/src/models/mcp_server.rs](src-tauri/src/models/mcp_server.rs) 与 [src-tauri/src/commands/mcp.rs](src-tauri/src/commands/mcp.rs) 也只返回这些字段，而 `F:\Work\AionUi\src\renderer\pages\settings\McpManagement\McpServerItem.tsx` 会读取 `server.tools` 与连接状态。

- Observation: AionUi 的 About 资源区是 5 行入口，但当前 AionX 本地源码没有可直接复用的“官方网站”常量；若要在不杜撰品牌地址的前提下恢复原稿节奏，只能把第五行落到可追溯的 `contactUrl`。
  Evidence: [src-tauri/src/commands/settings.rs](src-tauri/src/commands/settings.rs) 在本轮之前只暴露 `repository/releases/issues/docs` 四个 URL 常量；[README.md](README.md) 与当前仓库品牌文案中也没有额外的 AionX 官方站点地址。

- Observation: AionUi 的 Extension 设置内容几乎不承担额外“介绍卡片”职责，核心是尽快把用户带进宿主页；因此 AionX 页面若把元信息卡、标签和说明文案放得比宿主区更重，就会明显偏离原项目的信息优先级。
  Evidence: `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\ExtensionSettingsTabContent.tsx` 与 `ExtensionSettingsPage.tsx` 的主体都近似于“直接渲染 host 容器”，只保留最薄的一层 loading/错误包裹；当前 AionX 已把 [src/features/settings/pages/extension/page.tsx](src/features/settings/pages/extension/page.tsx) 调整为 host-first，元信息卡仅作辅助排障信息。

- Observation: 移动端 settings 顶栏标题被挤成残缺竖排，不是页面内容本身的问题，而是共享 `SettingsBackLink` 在顶栏上下文里仍保留了 `width: 100%`。
  Evidence: 首轮 `tmp/settings-parity/responsive/gemini-mobile.png` 与 `tools-mobile.png` 右上出现被压缩的标题残片；在 [src/styles/app-shell.css](src/styles/app-shell.css) 中为 `.settings-layout__topbar .settings-back-link` 改成 `width: auto` 并为标题加 `text-overflow` 后，更新截图恢复为单行标题。

- Observation: `Tools` 页的大块空白不是数据缺失导致，而是列表容器被固定成了 `420px` 最小高度；当 server 很少或为空时，这个共享高度会直接把主卡片节奏拉松。
  Evidence: [src/styles/app-shell.css](src/styles/app-shell.css) 中 `.settings-tools-page__list-body` 之前设置了 `min-height: 420px`，首轮 `tmp/settings-parity/desktop/tools-desktop.png` 和 `responsive/tools-mobile.png` 都能看到明显空白；移除该最小高度后，更新截图中的列表区与详情区距离明显收紧。

- Observation: extension 页在 direct WDIO visual audit 中回退到缺失态，不是 host-first UI 被改坏，而是该执行路径没有像 `npm run e2e:debug:*` 包装脚本那样默认注入 `AIONX_E2E_SEED_EXTENSION=1`，导致 `host-smoke` 从未写入测试数据库。
  Evidence: 阻塞时的调试输出显示 hash 为 `#/settings/ext/host-smoke`，但标题退回 `Extension` 且正文为“未找到对应的扩展设置页，请确认扩展仍然存在。”；在 [src-tauri/src/lib.rs](src-tauri/src/lib.rs) 已确认 E2E 种子扩展 `tabId: "host-smoke"` 存在后，将默认种子环境集中到 [e2e-tests/webdriverio/wdio.conf.mjs](e2e-tests/webdriverio/wdio.conf.mjs)，direct visual audit desktop / responsive 随即恢复通过并重新生成 `tmp/settings-parity/desktop/extension-host-desktop.png`、`tmp/settings-parity/desktop/extension-fallback-desktop.png`、`tmp/settings-parity/responsive/extension-host-mobile.png`、`tmp/settings-parity/responsive/extension-fallback-mobile.png`。

- Observation: 共享 settings 壳层虽然已经过一轮收紧，但和 `F:\Work\AionUi` 相比仍残留“侧栏导航过圆、页头过高、共享卡片移动端圆角过大、Gemini 这类 padded card 横向留白偏宽”的一致性偏差；这些偏差集中在 `app-shell.css` 的共享选择器里，而不是分散在单页业务组件里。
  Evidence: `F:\Work\AionUi\src\renderer\pages\settings\SettingsSider.tsx` 的导航项使用 `px-12px py-8px rd-8px text-14px`，而多个 modal content 卡片使用 `rd-12px md:rd-16px` 与 `px-[12px] md:px-[32px]`；对照本轮修正前的 `tmp/settings-parity/desktop/gemini-desktop.png`、`tools-desktop.png` 与 `responsive/gemini-mobile.png`，可见导航胶囊、页头留白和卡片外轮廓都比原项目更松。本轮收敛这些共享值后，新截图时间戳已更新至 2026-03-18 10:56-10:58 +08:00。

## Decision Log

- Decision: 这份 `plans.md` 先以“完成剩余阶段任务”为第一目标，再以“逐页高保真复刻核查”为第二目标，中间不穿插未完成阶段的视觉微调。
  Rationale: 如果 `Display` 和 `About` 还停留在旧单文件实现，就无法对全部九页做统一标准的高保真核查；先把架构迁移全部收口，才能在同一结构上做视觉收敛。
  Date/Author: 2026-03-18 / Codex

- Decision: “原项目参考物”定义为当前仓库中仍存在的旧单文件页面，加上已删除页面在 git 历史里的最后一个有效版本，而不是把旧架构直接恢复到工作树。
  Rationale: 用户要求完美复刻视觉与布局，但同时明确禁止违反架构原则照抄原项目；因此参考物必须只作为视觉和信息架构对照，而不是实现模板。
  Date/Author: 2026-03-18 / Codex

- Decision: 高保真复刻的边界以现有 `SettingsLayout + registry + typed API + page/components/hooks` 架构不变为前提。
  Rationale: 这是用户明确提出的非妥协条件；“像旧版”必须体现在结果上，而不是通过恢复旧技术结构来取巧。
  Date/Author: 2026-03-18 / Codex

- Decision: 视觉复刻核查将覆盖桌面与移动端，而不是只校正桌面截图。
  Rationale: 当前设置页已经有独立移动端壳层，用户要求“页面布局、组件位置、尺寸和样式”完美复刻时，移动端退化同样属于页面结果的一部分。
  Date/Author: 2026-03-18 / Codex

- Decision: `Display` 页以 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\DisplayModalContent.tsx` 为主参考源，而不是以当前仓库残留的旧 `DisplaySettings.tsx` 为准。
  Rationale: 当前仓库旧页面包含原项目没有的“沉浸标题栏”假设置项，若继续沿用会把非原项目能力误判为应复刻内容；直接对齐 `DisplayModalContent` 才符合用户要求的原项目高保真复刻。
  Date/Author: 2026-03-18 / Codex

- Decision: `About` 页启用真实更新检查链路时，先在 [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) 中补一个最小 `plugins.updater` 配置对象，而不是把 updater 插件注册整体撤回。
  Rationale: 用户要求页面“必须跑通”，而 `check_for_updates` 又必须保留真实 typed 路径；最小配置可以让应用稳定启动，并在尚未接入发布源时通过 `EmptyEndpoints` 返回明确“未配置更新源”的结果，而不是在 setup 阶段直接崩溃。
  Date/Author: 2026-03-18 / Codex

- Decision: About 页第五条资源入口恢复为 `contactUrl`，而不是擅自新增一个当前仓库里没有权威来源的“官方网站”链接。
  Rationale: 用户要求既要高保真贴近原项目，也不能违背 AionX 自身产品语义。AionUi 原稿确实是五条资源入口，但当前 AionX 本地源码只能稳定证明仓库、版本日志、问题反馈、文档和仓库归属作者资料这五类真实目的地；因此本轮通过 typed metadata 新增 `contactUrl` 保持列表密度与节奏，同时避免杜撰站点地址。
  Date/Author: 2026-03-18 / Codex

- Decision: 高保真复刻阶段对每一页都同时保留两类参考物：AionUi 的 page wrapper / modal content，以及当前仓库删除前的单文件快照。
  Rationale: AionUi 是主参考源，但有些页面在当前仓库里已经做过本地化适配或命名调整；把两类参考物同时冻结到 `tmp/` 中，可以在不恢复旧架构的前提下同时对照“原项目视觉骨架”和“AionX 既有语义落点”。
  Date/Author: 2026-03-18 / Codex

- Decision: 在继续 `tools -> about -> extension` 之前，先做一轮共享 settings 组件视觉基线对齐，再进入剩余页面的结构核查。
  Rationale: 用户明确指出“只对齐页面没用”，而当前多页共同存在的卡片圆角、padding、偏好行高度和控件尺寸漂移，已经开始压过单页结构差异本身；先把共享 primitives 收敛，后续逐页复刻才不会反复返工。
  Date/Author: 2026-03-18 / Codex

- Decision: Gemini 页高保真复刻以 AionUi 的单卡片窄栏表单为准，不继续沿用当前仓库旧快照衍生出的 hero、项目卡和“默认行为”卡。
  Rationale: 用户要求原项目 `F:\Work\AionUi` 为最高优先级参考源；Gemini 的 wrapper 与 modal content 都明确指向单卡片布局。为避免丢失现有 typed API 能力，本轮只隐藏 `authType/baseUrl/yoloMode/preferredMode` 的 UI 暴露，不删除其数据字段与持久化路径。
  Date/Author: 2026-03-18 / Codex

- Decision: Model 页高保真复刻以 AionUi 的单列平台栈为准，不保留当前新架构初版里的 `split-view` 双栏承载方式；现有 API、hooks 和编辑弹窗继续复用，但页面模板从视觉上收敛到单列展开列表。
  Rationale: 用户要求“原项目优先、架构不变”，因此保留新的 typed API 和 modal 组件即可，页面层不需要继续维持与原项目明显不一致的左右栏结构；同时 smoke 已证明新增平台、模型编辑和健康检查在单列结构下仍可跑通。
  Date/Author: 2026-03-18 / Codex

- Decision: Agent 页高保真复刻以 AionUi 的“单卡片列表 + 抽屉编辑器”为准，不保留当前新架构初版里的 `split-view` 双栏详情模板；现有 typed API、hooks 和类型模型继续复用，只把页面层和 smoke 交互收敛到抽屉模型。
  Rationale: 原项目 `AgentModalContent.tsx` 与 `AssistantManagement.tsx` 已清楚证明 Agent 的信息架构重点在“列表管理 + 抽屉编辑”，而不在常驻详情栏；把 `layoutMode` 改成 `form-stack` 并补齐列表内开关/复制入口，可以在不破坏新架构的前提下复刻原项目交互。
  Date/Author: 2026-03-18 / Codex

- Decision: Display 页首轮收敛先严格对齐 AionUi 的卡片结构、主题切换器形态、缩放控件节奏和 CSS 折叠容器，但不在这一轮直接把 `CssThemeSettings` 的完整皮肤主题管理器整体照搬进来；该能力需要作为后续跨页面主题系统缺口单独补齐。
  Rationale: 用户要求“原项目优先、架构不变”，而当前仓库现有 typed Display API 只覆盖 `customCss` 单字段。先把可见布局和基础交互收敛到正确的结构，不会破坏现有 API 边界；同时把“完整主题管理器尚未迁入”明确记录下来，避免后续误把当前简化实现当成最终形态。
  Date/Author: 2026-03-18 / Codex

- Decision: WebUI 频道表单继续使用现有固定字段行内表单结构，但所有可自动化访问的输入 `id` 必须回到稳定的 kebab-case 命名，并为频道内容体额外补 `data-testid`。
  Rationale: 用户要求“必须跑通”，而当前 typed WebUI 架构下桌面与响应式 smoke 都依赖稳定选择器。将 `defaultModel`、`botToken` 等字段统一映射为 `default-model`、`bot-token`，可以在不改变页面结构与 API 边界的前提下恢复真实自动化闭环，也避免后续继续核查 WebUI 视觉时再被命名漂移打断。
  Date/Author: 2026-03-18 / Codex

- Decision: System 页高保真复刻以 AionUi 的单张主卡片信息架构为准，并在当前 typed system settings 中补齐 `notificationEnabled` 与 `cronNotificationEnabled`，而不是继续保留双卡片结构或回退到旧 bridge 命令。
  Rationale: 用户要求“原项目优先、架构不变、必须跑通”。AionUi 的 System 页面核心差异在于骨架和通知区块，而当前 AionX 的 typed system settings 只缺两个布尔字段，不缺承载能力；因此最合理的做法是在现有 `api + hooks + typed Rust model` 链路内补齐通知字段，再把页面层收敛成单卡片结构。
  Date/Author: 2026-03-18 / Codex

- Decision: Tools 页高保真复刻采用“单列管理卡内联 server 管理行 + 下接详情区”的折中结构，而不恢复 persistent split-view，也不伪造原项目中当前 typed API 尚未提供的 `tools/status` 数据。
  Rationale: AionUi 的主参考源明确表明 Tools 更接近单列管理卡，但当前 AionX 的 typed `McpServer` 没有 `server.tools` 与连接状态对象，无法无损复原原项目 collapse item 的全部信息。保留当前 `page + hooks + typed API + detail pane` 架构，并把列表项动作、展开预览和图像生成卡节奏收敛到 AionUi，是在现有边界内最接近原项目且不违背架构原则的实现。
  Date/Author: 2026-03-18 / Codex

- Decision: Extension 页高保真复刻以“宿主区优先、元信息卡次级化”为准，不再保留额外 hero 氛围或把 metadata 卡放在视觉上比 host 更重的位置。
  Rationale: AionUi 的 `ExtensionSettingsTabContent.tsx` 与 `ExtensionSettingsPage.tsx` 本质上都把注意力集中在宿主页本身，页面只提供最薄的加载与错误承载。当前 AionX 保留 `ExtensionSettingsHost + metadata fallback` 架构是必要的，但视觉层级必须回到 host-first，才能在不回退架构的前提下更接近原项目。
  Date/Author: 2026-03-18 / Codex

- Decision: 最终全页/全组件审计采用真实 Tauri WebDriver 截图而不是浏览器直开页面，截图脚本保留在 `e2e-tests/webdriverio/tests/visual.audit.e2e.mjs` 作为后续持续审计工件。
  Rationale: 当前前端没有浏览器态的 Tauri 数据兜底，直接用 Vite 页面做视觉核查会偏离真实产品渲染；复用已有 WDIO + tauri-driver 流程生成 `tmp/settings-parity/`，可以稳定复现桌面和移动端 settings 壳层、真实数据状态与扩展宿主页。
  Date/Author: 2026-03-18 / Codex

- Decision: 移动端顶栏不去改动通用 `SettingsBackLink` 组件本身，而只在 `.settings-layout__topbar` 上下文里覆盖其宽度与收缩行为。
  Rationale: 侧栏返回入口仍需要保留整行点击宽度和既有布局；问题只出在移动端 topbar 的横向排列。用上下文选择器修复可以避免副作用，同时让顶栏标题恢复与 AionUi 移动导航相近的单行层级。
  Date/Author: 2026-03-18 / Codex

- Decision: extension 最终审计相关的 E2E 种子环境统一收口到 [e2e-tests/webdriverio/wdio.conf.mjs](e2e-tests/webdriverio/wdio.conf.mjs)，为 direct WDIO 执行和 `npm run e2e:debug:*` 两条路径同时提供默认 `AIONX_E2E_SEED_EXTENSION=1`。
  Rationale: 用户要求“按照文档必须跑通”，而最终审计已经依赖 direct visual audit 命令生成真实 Tauri 截图。若种子环境只存在于上层脚本里，手动或自动直跑 `wdio.conf.mjs` 时就会再次退回扩展缺失态，导致审计结论不稳定。把默认值集中到 WDIO 配置可以避免同类漂移，同时不改变显式覆写该变量的能力。
  Date/Author: 2026-03-18 / Codex

- Decision: 最终审计第二轮优先继续打共享壳层和通用组件，而不是立刻进入单页 CSS 细修；具体收敛点固定为 settings 侧栏导航、桌面页头、共享卡片圆角和 padded card 横向内边距。
  Rationale: `F:\Work\AionUi` 的偏差证据已经表明，这一批漂移集中在 [src/styles/app-shell.css](src/styles/app-shell.css) 里的共享 primitives。先把这些基础值拉回 `rd-8px/12px/16px`、`px-12px/32px` 与 `text-14px` 节奏，能同时改善 Gemini、Tools、Extension、System 等多页截图，避免后续逐页返工。
  Date/Author: 2026-03-18 / Codex

## Outcomes & Retrospective

设置页的迁移收口已经完成。`About` 现已和 `Display` 一样切换到 `page + api + hooks + components` 结构，九个设置页面全部落在当前 `SettingsLayout + registry + typed API` 架构内，并且 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 都在 `P-009` 完成后重新通过。

当前剩余工作不再是“把老页面迁完”，而是进入用户明确要求的最终高保真复刻阶段：先冻结九页旧实现参考物，再逐页核查尺寸、间距、布局、控件位置和移动端退化。Gemini、Model、Agent、Display、WebUI、System、Tools、About 与 Extension 都已完成首轮结构收敛，并在本轮开始用 `visual.audit.e2e.mjs` 生成真实 Tauri 截图作为共享审计基线。基于这批截图，目前已经连续解决四类共享偏差：移动端 settings 顶栏标题不再被返回入口挤坏，`Tools` 页短列表场景的大块留白已收紧，extension 页 direct visual audit 不再因为缺失 E2E 种子而错误退回 fallback，settings 侧栏/桌面页头/共享卡片圆角与横向内边距也进一步贴近 AionUi 的 `rd-8px/12px/16px` 与 `px-12px/32px` 节奏。下一步仍是继续沿着 `tmp/settings-parity/` 逐页收敛共享组件尺寸、卡片 padding、表单控件高度、标签密度、按钮位置与移动端堆叠。已知仍需单独记录的差异是：AionX 当前尚未配置真实更新发布源，因此 `About` 页的检查更新会通过真实 updater 路径返回“未配置更新源/不可用”结果，而不是检测到线上版本；另外 Display 页的完整 CSS 皮肤主题管理器仍属于后续跨页面主题系统缺口，Tools 页由于当前 typed `McpServer` 不含 `status/tools` 富信息，暂时也无法无损复原 AionUi 的展开工具列表。

## Context and Orientation

设置页当前的工作区壳层位于 [src/features/settings/layout/SettingsLayout.tsx](src/features/settings/layout/SettingsLayout.tsx)。这是 `/settings/*` 的统一容器，它负责桌面端的 settings 侧栏、移动端 topbar 和 tabs、页头标题以及内容区域宽度控制。任何页面级改动都不能把这些职责再拉回页面内部。

用于视觉与布局复刻的原项目路径是 `F:\Work\AionUi`。执行高保真复刻时，应直接读取这个路径下对应设置页、组件和样式文件，把它作为视觉参考源；只有当该路径下不存在对应实现时，才允许退回到当前仓库的 git 历史快照作为次级参考物。

设置页路由位于 [src/features/settings/routes.tsx](src/features/settings/routes.tsx)。这里已经把 `gemini`、`model`、`agent`、`display`、`webui`、`system`、`tools`、`about`、`extension` 全部指向新目录结构。旧的单文件设置页已经全部移除，因此后续视觉核查所需的旧页面参考物必须从 `F:\Work\AionUi` 或当前仓库 git 历史导出，而不是再从工作树现成读取。

设置页导航元信息位于 [src/features/settings/registry/settingsRegistry.ts](src/features/settings/registry/settingsRegistry.ts)。这里定义了每个页面的标题、描述、宽度预设和布局模式。所谓“宽度预设”指的是页面内容区使用固定的最大宽度规则，例如 `regular` 表示中等宽度表单页，`wide` 表示主从结构页。视觉复刻时可以调整页面内部结构，但不能破坏 registry 控制页面宽度这一原则。

现有迁移完成的页面都遵循相同的目录和分层方式。例如：

- [src/features/settings/pages/model/page.tsx](src/features/settings/pages/model/page.tsx) 展示了列表和详情拆分后的主从结构页面。
- [src/features/settings/pages/agent/page.tsx](src/features/settings/pages/agent/page.tsx) 展示了 `page + components + hooks + api` 的完整分层。
- [src/features/settings/pages/system/page.tsx](src/features/settings/pages/system/page.tsx) 展示了表单型页面如何在新架构下拆成行为卡片和运行目录卡片。

设置页相关 API 层位于 `src/features/settings/api/`。迁移规范要求页面组件不能直接调用 Tauri 的 `commands`；所有后端调用都必须先进入 API 文件，再由 hook 或页面组件消费。这一约束在视觉复刻阶段也不能破坏，即使参考物是旧单文件页面，也只能复刻视觉和行为结果，不能把页面再次变成“组件里直接 invoke 命令”的写法。

设置页的自动化冒烟测试位于 [e2e-tests/webdriverio/tests/helpers/settings-flow.mjs](e2e-tests/webdriverio/tests/helpers/settings-flow.mjs)、[e2e-tests/webdriverio/tests/smoke.desktop.e2e.mjs](e2e-tests/webdriverio/tests/smoke.desktop.e2e.mjs) 和 [e2e-tests/webdriverio/tests/smoke.responsive.e2e.mjs](e2e-tests/webdriverio/tests/smoke.responsive.e2e.mjs)。任何阶段完成后都必须把真实页面入口纳入这两条 smoke，用桌面和移动端两条真实 Tauri debug 路径证明功能没有回退。

迁移状态总账位于 [docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md)。每完成一个阶段，都必须同步更新状态区、对应任务小节和底部更新说明。后续高保真复刻核查如果发现明显视觉差异，也要在这个计划文件的 `Surprises & Discoveries` 中记录。

“高保真复刻”在本仓库中指：相对于旧设置页面的最终可见结果，保持组件外轮廓尺寸、间距、块顺序、控件位置、文本层级、列表与详情分配比例、按钮位置和移动端退化方式的一致或近似一致。它不等于把旧 JSX、旧类名和旧存储方式直接抄回来。用户明确要求“基于现有架构不变”，因此高保真复刻的唯一允许手段是：在新架构内重排组件、补齐共享样式、调整卡片结构、细化局部组件，而不是恢复旧实现。

## Plan of Work

第一阶段的迁移任务已经全部完成。`Display` 与 `About` 现在都位于各自的领域目录下，其中 `About` 通过 [src/features/settings/api/about.ts](src/features/settings/api/about.ts) 和 Rust 端 typed 命令提供应用元数据、更新偏好持久化与真实更新检查结果；同时 [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) 已补齐最小 `plugins.updater` 配置，保证真实 Tauri debug 环境下不会在应用启动阶段崩溃。

接下来进入九页统一的高保真复刻核查。核查不是凭印象完成，而是先建立参考物。由于工作树中的旧单文件设置页已经全部删除，`Display`、`About` 以及更早完成迁移的页面都必须从 `F:\Work\AionUi` 或当前仓库 git 历史导出到 `tmp/settings-legacy/`。需要同时收集这些页面使用到的旧样式类和相关辅助组件，因为“组件尺寸和位置”往往由类名和容器结构共同决定。

如果 `F:\Work\AionUi` 中存在对应页面或样式实现，那么这一步必须先从 `F:\Work\AionUi` 提取参考物，再补充当前仓库 git 历史快照。换句话说，`F:\Work\AionUi` 是主参考源，当前仓库历史只是补充源。

第三阶段按页面逐个核查。每一页都需要从六个方面比较新旧结果：一是内容块顺序，二是页面主容器宽度和卡片宽度，三是卡片内边距和行间距，四是控件类型和控件位置，五是按钮和次要操作的摆放位置，六是移动端下的堆叠和退化方式。核查时允许保留新的布局壳层、typed API 和 hook 分层，但不允许出现“为了兼容新架构所以随便改成另一种布局”的妥协。如果某个旧页面是双栏主从结构，就必须在新架构中恢复等价的主从信息层次；如果某个旧页面是窄栏卡片堆叠，就必须在新架构中恢复相近的块宽和纵向节奏。

第四阶段做最终回归。这里不仅要重复功能验证，还要确认视觉修正没有破坏先前完成的真实行为能力。完成后，要同时更新 [docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md) 和本计划文件，把剩余任务、发现、决定和结果都写清楚，保证后续就算继续做细节 polish，也不会失去上下文。

## Milestones

### Milestone 1: 完成 `P-008` Display 迁移

这一里程碑结束时，`Display` 页面不再由旧单文件 [src/features/settings/pages/DisplaySettings.tsx](src/features/settings/pages/DisplaySettings.tsx) 承载，而是切换到 `pages/display/` 目录下的新实现。用户能在 `#/settings/display` 打开新页面，看到拆分后的主题、缩放、自定义 CSS 结构；缩放和 CSS 的保存是 typed API 负责的真实能力；页面里不再出现 AionUi 对齐文案；桌面和移动端 smoke 都能稳定进入该页。

需要编辑的主文件应至少包括：新增 `src/features/settings/api/display.ts`，新增 `src/features/settings/pages/display/page.tsx`，新增 `src/features/settings/pages/display/types.ts`，以及用于拆卡的 `components/ThemeCard.tsx` 和 `components/CustomCssCard.tsx`。后端若仍缺 typed 命令，则补充到 `src-tauri/src/commands/` 与 `src-tauri/src/models/`，并在 `src-tauri/src/lib.rs` 注册。随后更新 [src/features/settings/routes.tsx](src/features/settings/routes.tsx) 指向新页面，并删除旧的 [src/features/settings/pages/DisplaySettings.tsx](src/features/settings/pages/DisplaySettings.tsx)。

验收必须体现为行为而不是文件存在。运行构建后，打开 `#/settings/display`，应能真实读取当前主题与缩放值，修改后持久保存；自定义 CSS 输入后应在预览上生效并写回持久化存储；桌面和响应式 smoke 都覆盖该页的基本可用性。

### Milestone 2: 完成 `P-009` About 迁移

这一里程碑结束时，`About` 页面不再由旧单文件 [src/features/settings/pages/About.tsx](src/features/settings/pages/About.tsx) 承载，而是切换到 `pages/about/` 目录下的新实现。用户能在 `#/settings/about` 看到品牌化后的窄栏信息页，真实显示版本信息、更新偏好和帮助链接，并且“检查更新”按钮不再是空按钮。

需要编辑的主文件应至少包括：新增 `src/features/settings/api/about.ts`，新增 `src/features/settings/pages/about/page.tsx`，新增 `src/features/settings/pages/about/types.ts`，新增 `src/features/settings/pages/about/components/UpdateCard.tsx`。如果仓库当前没有更新检查能力，应在 Rust 端新增最小可行的 typed 命令，例如 `get_app_metadata`、`get_update_preferences`、`save_update_preferences`、`check_for_updates`。这里的“最小可行”不代表可以用空数据蒙混过关，而是要能返回确定结果，例如当前版本、远端最新版本、是否有更新、错误原因等。

验收必须体现为：`#/settings/about` 页面在桌面和移动端都可打开；“包含预发布版本”开关会真实持久保存；“检查更新”返回真实结果；页面文案不再引用 AionUi；旧的 [src/features/settings/pages/About.tsx](src/features/settings/pages/About.tsx) 已删除；迁移清单状态推进到 `P-009` 完成。

### Milestone 3: 建立九页旧实现参考物

这一里程碑结束时，工作树中会有一个只用于核查的参考目录，例如 `tmp/settings-legacy/`。这里保存每个设置页对应的旧实现快照，用来对照视觉与布局。对于当前仍在工作树中的旧页面，直接复制即可；对于已经删除的页面，必须通过 git 历史导出最后一个有效版本。这样后续任何执行者都不需要猜“原项目是什么样”，而是可以直接打开参考文件逐项比对。

这一步不是为了恢复旧实现，而是为了冻结对照标准。需要同时把关键样式来源也记录清楚。如果某页的视觉结果高度依赖 `src/styles/app-shell.css` 或某个共享卡片类名，也要把相关片段路径记进本计划的 `Artifacts and Notes`，供后续核查时查阅。

验收必须体现为：九个页面都能对应到一份旧实现参考物；已经删除的页面可以在 `tmp/settings-legacy/` 找到导出的历史文件；本计划文件明确记录每一页参考物的来源路径或 git 获取方式。

### Milestone 4: 九页高保真复刻核查与修正

这一里程碑结束时，九个页面都要经过一轮严格比对和修正，结果是新实现虽然保留当前架构，但在视觉表现上尽可能接近旧实现。这里的“尽可能接近”不是泛泛而谈，而是要求每页都有具体核查记录：页面宽度是否一致，标题与描述的位置是否一致，卡片排序是否一致，按钮是在行内、卡片底部还是页头工具栏，列表和详情的占比是否一致，移动端是否保持同样的信息优先级。

执行顺序应按页面逐个完成，推荐顺序是：`gemini`、`model`、`agent`、`display`、`webui`、`system`、`tools`、`about`、`extension`。每完成一页，就记录修正内容、仍存在的差异和验证结果，再进入下一页，而不是一次性大范围改样式。这样即使中途停止，也能从 `Progress` 和 `Decision Log` 恢复。

验收必须体现为：每一页都至少做过一次桌面核查和一次移动端核查；每一页都记录了主要视觉差异是否已经归零；所有修正都保持在当前架构内，没有恢复旧的单文件承载方式，没有让页面重新直连 `commands`。

### Milestone 5: 最终回归与文档收口

这一里程碑结束时，迁移和高保真复刻都已经完成，所有相关文档都更新到真实状态。最终回归不只是再跑一遍构建，而是要证明九页在真实 Tauri debug 环境中仍然能打开、保存、持久化，并且移动端 settings shell 没有因为视觉修正而回退。

验收必须体现为：`npm run build` 通过，`cargo check` 通过，`npm run e2e:debug:desktop` 通过，`npm run e2e:debug:responsive` 通过；[docs/设置页迁移实施清单.md](docs/设置页迁移实施清单.md) 顶部状态和 `P-008`、`P-009` 小节已经同步；本计划文件的 `Progress` 全部更新，`Outcomes & Retrospective` 写成最终总结。

## Concrete Steps

以下命令默认在仓库根目录 `C:\Users\Victory\.codex\worktrees\f01b\AionX` 执行，除非命令前明确写了其他目录。

`Display` 与 `About` 迁移已经完成，当前建议执行顺序如下：

1. 读取当前 settings 路由、新页面和原项目参考文件，确认九页都已切到新结构，并明确每页的对照源。

    Get-Content -Raw src/features/settings/routes.tsx
    Get-Content -Raw F:\Work\AionUi\src\renderer\components\SettingsModal\contents\DisplayModalContent.tsx
    Get-Content -Raw F:\Work\AionUi\src\renderer\components\SettingsModal\contents\AboutModalContent.tsx

2. 更新迁移清单与本计划，记录 `P-009` 完成、验证结果以及当前进入视觉核查阶段这一事实。

3. 跑基础验证。

    npm run build

    Set-Location src-tauri
    cargo check
    Set-Location ..

    npm run e2e:debug:desktop
    npm run e2e:debug:responsive

4. 建立旧实现参考目录。

    New-Item -ItemType Directory -Force tmp\settings-legacy

先从 `F:\Work\AionUi` 收集原项目参考文件；若原项目缺少某页，再回退到当前仓库或 git 历史。

    New-Item -ItemType Directory -Force tmp\settings-aionui-reference
    Copy-Item F:\Work\AionUi\src\features\settings\pages\* tmp\settings-aionui-reference\ -Recurse -Force

对于已删除页面，先找最后一个有效提交，再导出文件内容。以下以 `GeminiSettings.tsx` 为例，其他页面按相同方法执行；`About.tsx` 与 `DisplaySettings.tsx` 也应按同样方式导出到 `tmp/settings-legacy/`，因为它们已经不在工作树里。

    git log --follow --oneline -- src/features/settings/pages/GeminiSettings.tsx
    git show <commit>:src/features/settings/pages/GeminiSettings.tsx > tmp/settings-legacy/GeminiSettings.tsx

5. 对每一页做高保真核查和修正后，重复运行同一组验证命令。桌面和响应式 smoke 必须串行执行，不能并行。

如果需要留存当前新页面的截图用于视觉比对，应把截图保存在 `tmp/settings-parity/`，并在本计划的 `Artifacts and Notes` 章节补记路径。

## Validation and Acceptance

本计划的接受标准分为阶段接受标准和最终接受标准。

阶段接受标准要求每完成一个页面迁移，就必须同时满足以下条件：页面路由已经切换到新目录实现；旧单文件页面已删除；页面组件不直接调用 `commands`；页面主行为通过 typed API 保存和读取；对应的 smoke 已覆盖该页入口；`npm run build` 和 `cargo check` 在当时的工作树上通过。

最终接受标准要求九个页面全部满足迁移规范，并且全部完成高保真复刻核查。对人可见的结果是：从 `#/settings/gemini` 到 `#/settings/about` 逐页打开时，布局和控件位置都与旧实现高度一致；桌面端没有双侧栏，移动端保持独立 settings shell；所有页在真实 Tauri debug 二进制下可打开、可保存、可持久化；更新、目录、认证、扩展宿主、模型、工具等真实能力都仍然可用。

功能验证命令必须以如下结果为准：

    npm run build

期望结果：TypeScript 编译和 Vite 构建成功，没有因为页面迁移或视觉修正引入新的构建错误。

    Set-Location src-tauri
    cargo check
    Set-Location ..

期望结果：Rust 端新增命令、模型和注册项都能编译通过。已有 warning 可以暂时存在，但不能引入新的编译失败。

    npm run e2e:debug:desktop

期望结果：桌面 smoke 成功登录并依次进入所有已覆盖页面。随着 `Display` 和 `About` 被迁移，smoke 应扩展到这两页的真实入口和最关键的持久化行为。

    npm run e2e:debug:responsive

期望结果：响应式 smoke 成功进入独立移动端 settings shell，并验证所有已覆盖页面在移动端可以渲染和切换。

视觉接受标准必须由人工或自动截图核查补充确认。最低要求是每页都核对：页头标题位置、主容器最大宽度、卡片顺序、卡片间距、按钮位置、输入控件宽度和移动端堆叠顺序。任何“为了适配新架构所以改了布局”的差异，都要在修正后消失，或者在 `Decision Log` 中明确记录为什么这是唯一合理差异。

## Idempotence and Recovery

本计划的各步骤都必须可以重复执行。构建、`cargo check` 和两条 smoke 都可以多次运行；如果任一步失败，应先修复失败原因，再重新执行同一组命令，而不是跳过。

创建 `tmp/settings-legacy/` 和 `tmp/settings-parity/` 是安全的，可反复覆盖生成。它们只用于核查，不应被作为正式代码依赖。若导出 git 历史文件失败，应重新执行 `git log --follow` 找到正确提交，再执行 `git show`。如果迁移过程中某个页面已经切到新路由但还没有完成，必须保证该页至少能渲染基础内容，避免在主路由上留下不可打开的半成品页面。

禁止用回退整个工作树的方式“恢复到上一步”，因为当前工作树可能包含其他已完成阶段的未提交改动。若某个页面迁移出现问题，应只修正当前页面相关文件，并重新运行验证。不得使用 `git reset --hard` 或类似破坏性命令。

## Artifacts and Notes

迁移与核查过程中需要保留的关键工件如下。

第一类工件是旧实现参考物，建议统一存放在 `tmp/settings-legacy/`。这里至少应保存：

- `DisplaySettings.tsx`
- `About.tsx`
- `GeminiSettings.tsx`
- `WebuiSettings.tsx`
- `AgentSettings.tsx`
- `SystemSettings.tsx`
- `ExtensionSettings.tsx`
- 任何对尺寸和布局有关键影响的旧样式片段来源路径

若 `F:\Work\AionUi` 中存在原始实现，则应额外在 `tmp/settings-aionui-reference/` 中保存对应页面、共享组件和样式片段，并在记录中标明它是“主参考源”。

当前已经落地的参考物包括：

- `tmp/settings-legacy/` 下的 `GeminiSettings.tsx`、`ModelSettings.tsx`、`AgentSettings.tsx`、`DisplaySettings.tsx`、`WebuiSettings.tsx`、`SystemSettings.tsx`、`ToolsSettings.tsx`、`About.tsx`、`ExtensionSettings.tsx`
- `tmp/settings-aionui-reference/pages/settings/` 下的 AionUi settings wrappers 与 `settings.css`
- `tmp/settings-aionui-reference/components/SettingsModal/contents/` 下的 `AboutModalContent.tsx`、`AgentModalContent.tsx`、`DisplayModalContent.tsx`、`GeminiModalContent.tsx`、`ModelModalContent.tsx`、`SystemModalContent.tsx`、`ToolsModalContent.tsx`、`WebuiModalContent.tsx`、`ExtensionSettingsTabContent.tsx` 以及 Channel 相关表单

第二类工件是新实现截图或核查记录，建议统一存放在 `tmp/settings-parity/`。每页至少应有桌面端一份和移动端一份，文件名使用页面 id，例如 `gemini-desktop.png`、`gemini-mobile.png`。

第三类工件是验证结果摘要。每次完成一个里程碑，都应在本计划的 `Surprises & Discoveries` 或 `Outcomes & Retrospective` 中写明当时运行了哪些命令、结果如何，以及是否存在已知但可接受的 warning。

## Interfaces and Dependencies

`Display` 页迁移结束时，前端至少应存在以下稳定接口和文件：

在 `src/features/settings/api/display.ts` 中定义读取和保存显示设置的函数，供页面和 hook 调用。最小接口应覆盖主题模式、缩放因子和自定义 CSS。自定义 CSS 的实时预览可以在前端通过样式标签即时应用，但最终持久化必须统一走 `save_display_settings`，不允许页面直接调命令或继续保留原项目并不存在的“沉浸标题栏”伪设置。

在 `src/features/settings/pages/display/page.tsx` 中定义页面入口组件，并把页面拆成清晰的卡片结构。可接受的组件名包括：

    ThemeCard
    CustomCssCard

如果需要 hook，应在 `src/features/settings/pages/display/hooks/` 下定义，并由 `page.tsx` 消费。

`About` 页迁移结束时，前端至少应存在以下稳定接口和文件：

在 `src/features/settings/api/about.ts` 中定义：

    getAppMetadata(): Promise<AppMetadata>
    checkForUpdates(): Promise<UpdateCheckResult>
    getUpdatePreferences(): Promise<UpdatePreferences>
    saveUpdatePreferences(input: UpdatePreferences): Promise<UpdatePreferences>

在 `src/features/settings/pages/about/page.tsx` 中定义页面入口组件，并把更新区拆成独立组件，例如：

    UpdateCard

Rust 端若缺少以上 typed 能力，应在 `src-tauri/src/commands/` 和 `src-tauri/src/models/` 中补齐。最终注册点必须出现在 `src-tauri/src/lib.rs` 中。

视觉复刻阶段依赖以下既有接口和文件，它们不能被绕开：

- [src/features/settings/layout/SettingsLayout.tsx](src/features/settings/layout/SettingsLayout.tsx)
- [src/features/settings/registry/settingsRegistry.ts](src/features/settings/registry/settingsRegistry.ts)
- [src/styles/app-shell.css](src/styles/app-shell.css)
- `src/features/settings/api/*.ts`
- `src/features/settings/pages/*/page.tsx`

高保真复刻允许新增局部组件、局部样式和共享布局辅助，但不允许新增一个“旧设置页兼容壳”来包裹所有页面，也不允许恢复 `pages/*.tsx` 单文件承载方式。

变更说明（2026-03-18 00:43 +08:00）：

本次修订将 `P-008` 标记为完成，并补记 `Display` 页的真实实现、验证结果与关键设计决定。之所以必须同步修订，是因为 `Display` 已经从旧单文件迁移到 `page + api + hooks + components` 结构，且原项目参考源已经确认是 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\DisplayModalContent.tsx`，若不把这些变化写回计划，下一位执行者会继续依据过时假设推进。

变更说明（2026-03-18 01:05 +08:00）：

本次修订将 `P-009` 标记为完成，并把执行重点从“剩余设置页迁移”切换为“九页旧实现参考物收集与高保真复刻核查”。之所以必须同步修订，是因为 `About` 已经迁入 `pages/about/` 目录并通过真实 typed API 和双 smoke 验证闭环，同时本轮还发现 `tauri-plugin-updater` 若缺少 `plugins.updater` 配置会在应用启动阶段直接崩溃；若不把这些信息写回计划，下一位执行者会继续按照“About 尚未迁移、updater 可直接启用”的过时假设推进。

变更说明（2026-03-18 01:20 +08:00）：

本次修订记录了高保真复刻阶段的第一项真实页面收敛工作：Gemini 页已从 `regular` 宽度的 hero + 多卡片结构改成 `narrow` 宽度的单卡片表单，并明确写入“以 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\GeminiModalContent.tsx` 为主参考源”的决定。之所以必须同步修订，是因为当前仓库旧 `GeminiSettings.tsx` 与 AionUi 主参考源存在显著结构冲突，若不把这一轮判断和取舍写回计划，下一位执行者很容易把 Gemini 又改回偏离原项目的信息架构。

变更说明（2026-03-18 01:26 +08:00）：

本次修订把 Gemini 页的高保真复刻从“已完成代码收敛”推进到“已完成真实验证”，并把下一阶段起点切换到 `model` 页对照。之所以必须同步修订，是因为 Gemini 这一轮不只是视觉调整，还重新跑通了 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`；如果不把这一事实写回计划，后续执行者会误以为 Gemini 仍处于未验证状态。

变更说明（2026-03-18 01:35 +08:00）：

本次修订把 Model 页纳入高保真复刻闭环：当前页面已从双栏主从结构收敛为单列平台栈，并通过 `npm run build`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 验证没有破坏新增平台、模型编辑和健康检查链路。之所以必须同步修订，是因为 `settingsRegistry` 中 `model` 的页面模板判断也已经随之调整为单列语义；如果不把这个变化写回计划，下一位执行者会继续按过时的 split-view 假设推进。

变更说明（2026-03-18 01:54 +08:00）：

本次修订把 Agent 页纳入高保真复刻闭环：当前页面已从双栏列表/详情结构收敛为单卡片助手列表 + 抽屉编辑器，并补齐列表内启停、复制与配置入口，同时通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 验证没有破坏自定义助手创建、持久化和移动端 settings shell。之所以必须同步修订，是因为 `settingsRegistry` 中 `agent` 的页面模板判断也已经随之调整为单列语义；如果不把这个变化写回计划，下一位执行者会继续按过时的 split-view 假设推进。

变更说明（2026-03-18 02:04 +08:00）：

本次修订把 Display 页纳入高保真复刻的首轮结构收敛：当前页面已把主题切换器改成 AionUi 同款双段胶囊，把缩放控件改成“步进按钮 + 滑杆 + 百分比/重置”节奏，并把 CSS 区块收敛成默认展开的折叠卡片。之所以必须同步修订，是因为 Display 这一轮已经从“功能跑通但布局偏离原项目”推进到“主体结构和控件节奏基本对齐 AionUi”，同时本轮还明确暴露出“完整 CSS 皮肤主题管理器尚未迁入当前 typed API 架构”的后续缺口；如果不把这两点写回计划，下一位执行者会误以为 Display 仍停留在旧样式，或者误把现状当成最终完成形态。

变更说明（2026-03-18 07:59 +08:00）：

本次修订把 WebUI 页纳入高保真复刻闭环：当前页面已将内部 tab 收敛为 `WebUI / Channels`、服务区收敛为服务卡片 + 登录信息卡片、频道区收敛为固定频道折叠卡片与行内表单，同时修复了频道字段 `id` 从 camelCase 漂移到 kebab-case 导致的桌面 smoke 失败，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。之所以必须同步修订，是因为当前执行重点已经从 `webui` 切换到 `system`；如果不把这轮真实根因、修复方式和验证结果写回计划，下一位执行者会继续按“WebUI 仍阻塞中”的过时状态推进。

变更说明（2026-03-18 08:11 +08:00）：

本次修订把 System 页纳入高保真复刻闭环：当前页面已从双卡片结构收敛为单张主卡片 + 内部分区，并在现有 typed `system` settings 链路中补齐 `notificationEnabled` 与 `cronNotificationEnabled` 两个布尔字段，随后重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。之所以必须同步修订，是因为当前执行重点已经从 `system` 切换到 `tools`；如果不把这轮结构收敛、typed 能力补齐和验证结果写回计划，下一位执行者会继续按“System 仍停留在双卡片且缺通知设置”的过时状态推进。

变更说明（2026-03-18 08:43 +08:00）：

本次修订记录了高保真复刻阶段从“单页结构收敛”切到“共享组件视觉基线”后的第一轮完成态：当前已按 AionUi 的 `settings.css` 与多个 settings modal content，把 `settings-group-card`、`settings-preference-row`、settings 作用域输入/选择器、split-view gap 以及多页复用卡片的圆角和 padding 统一收敛，并重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。之所以必须同步修订，是因为用户已明确要求优先解决组件尺寸、颜色和样式不一致的问题；如果不把这一轮共享基线对齐和中途遇到的残留进程锁库问题写回计划，下一位执行者会继续按“仍在直接进入 Tools 页面核查”的过时起点推进。

变更说明（2026-03-18 09:07 +08:00）：

本次修订把 Tools 页纳入首轮高保真复刻闭环：当前页面已从 persistent split-view 收敛为 AionUi 风格更接近的单列管理卡，并进一步把 server item 改成内联管理行 + 展开预览，把图像生成卡改成“标题行开关 + 单表单项”节奏，同时重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。之所以必须同步修订，是因为当前执行起点已经从 `tools` 切换到 `about`，并且本轮新增了一个会直接影响后续设计判断的重要约束：typed `McpServer` 当前不含 `status/tools` 富信息，如果不把这个边界写回计划，下一位执行者会误以为 Tools 仍可无损照搬 AionUi 的 collapse item 内容。

变更说明（2026-03-18 09:24 +08:00）：

本次修订把 About 页纳入首轮高保真复刻闭环：当前页面已进一步收敛为 AionUi 风格的窄栏中心结构，补齐 `contactUrl` typed metadata 以恢复五行资源入口节奏，并收紧了版本徽标、GitHub 入口和更新卡的尺寸密度，随后重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。之所以必须同步修订，是因为当前执行起点已经从 `about` 切换到 `extension`，同时本轮还明确了一个后续不会再回头争论的品牌边界：当前 AionX 源码没有权威“官方网站”常量，因此 About 资源区必须优先使用可追溯的品牌内真实链接，而不是为了机械对齐原稿行数去杜撰站点地址。

变更说明（2026-03-18 09:40 +08:00）：

本次修订把 Extension 页纳入首轮高保真复刻闭环，并把执行重点切换到最终全页/全组件审计。当前 Extension 页面已对照 `F:\Work\AionUi\src\renderer\components\SettingsModal\contents\ExtensionSettingsTabContent.tsx` 与 `ExtensionSettingsPage.tsx` 收敛为 host-first 结构，宿主区成为首要视觉焦点，元信息卡只承担补充排障信息；同时保留了现有 `ExtensionSettingsHost + metadata fallback + typed extension API` 架构与既有 smoke 选择器不变。之所以必须同步修订，是因为当前阶段已经不再是“继续处理 extension”，而是“九页都完成首轮收敛后，开始最终尺寸/样式/布局审计”；如果不把这一步写回计划，下一位执行者会继续从过时的阶段起点推进。

变更说明（2026-03-18 10:04 +08:00）：

本次修订记录了最终全页/全组件审计的第一轮共享样式修正：通过新增 `e2e-tests/webdriverio/tests/visual.audit.e2e.mjs` 生成 `tmp/settings-parity/{desktop,responsive}` 真实 Tauri 截图，定位并修复了移动端 settings 顶栏标题被 `SettingsBackLink` 挤压的问题，同时移除了 `Tools` 管理卡列表区 `420px` 最小高度造成的异常留白。随后重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`，并复拍截图确认这两处视觉偏差已经收敛。之所以必须同步修订，是因为这一步把“最终审计”从抽象阶段推进成了基于真实工件的持续流程；如果不把截图脚本、发现的问题和回归结果写回计划，下一位执行者会缺少可复现的审计起点。

变更说明（2026-03-18 10:45 +08:00）：

本次修订记录了 extension 最终审计阻塞的真实根因与修复结果：direct WDIO visual audit 命令在绕过 `npm run e2e:debug:*` 包装脚本时，没有默认注入 `AIONX_E2E_SEED_EXTENSION=1`，导致 `host-smoke` 未被写入测试数据库，`#/settings/ext/host-smoke` 被误判成缺失态页面。当前已在 `e2e-tests/webdriverio/wdio.conf.mjs` 统一集中 `e2eEnv` 并为该变量提供默认值，随后 direct visual audit desktop / responsive、`npm run e2e:debug:desktop` 与 `npm run e2e:debug:responsive` 均重新通过，`tmp/settings-parity/` 下的四张 extension 截图工件也已刷新。之所以必须同步修订，是因为这一步把最终审计从“脚本跑得通但 direct 命令不稳定”推进到了“任何遵循 WDIO 配置的执行路径都能稳定复现 extension 宿主态”，后续组件级样式审计必须建立在这个稳定起点上。

变更说明（2026-03-18 10:58 +08:00）：

本次修订记录了最终审计第二轮共享壳层/组件密度对齐：对照 `F:\Work\AionUi\src\renderer\pages\settings\SettingsSider.tsx` 和多个 settings modal content 中的尺寸节奏，已在 `src/styles/app-shell.css` 中进一步收紧 settings 侧栏导航、桌面页头、共享卡片圆角和 `settings-group-card__body--padded` 的横向内边距，并补上 padded card 子项在移动端不重复吃横向 padding 的约束。随后重新通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 以及 direct visual audit desktop / responsive，`tmp/settings-parity/` 整套截图时间戳也已更新到 2026-03-18 10:56-10:58 +08:00。之所以必须同步修订，是因为这一轮已经把“共享组件样式、尺寸、颜色优先对齐”的要求推进成实际落地结果，后续逐页审计应以这批新的壳层基线继续前进，而不是再从旧截图出发。
