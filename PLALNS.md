# 启动全前端 shadcn/Tailwind 一次性重构并完成统一设计系统切换

本计划是一份持续维护的执行文档。执行过程中必须始终更新 `Progress`、`Surprises & Discoveries`、`Decision Log` 和 `Outcomes & Retrospective` 四个章节，保证任何新的执行者只依赖这一个文件和当前工作树，就能继续把任务做完。

当前仓库根目录没有已检入的 `PLANS.md` 文件，因此本文件不依赖外部计划规范文件，所有执行说明都直接写在这里。

本计划中提到的“原项目”特指本地参考仓库 `F:\Work\AionUi`。从 2026-03-18 17:47 +08:00 起，这个参考源只用于核实功能范围、信息架构和交互语义，不再作为逐像素视觉目标。

## Purpose / Big Picture

这项工作的目标已经从“设置页高保真复刻”升级为“全前端一次性重构”。重构完成后，用户看到的将是一套新的 AionX 前端：统一的 `App Shell`、统一的主题系统、统一的按钮/表单/卡片/弹层风格，以及统一的设置页、聊天页、导航页和工具页布局语言。用户仍然使用同样的功能和同样的路由，但视觉层、交互层和组件层全部切换到新的设计系统。

这次重构不是局部修补，也不是长期双轨并存。最终交付物必须满足三个条件。第一，前端设计系统从当前 `Arco Design + UnoCSS + 大量手写全局 CSS` 切换到 `Tailwind CSS v4 + shadcn/ui + Radix primitives + 语义化设计 tokens`。第二，应用的所有主路径，包括 `/login`、`/guid`、`/cron`、`/conversation/:id`、`/settings/*`，都迁移到新的壳层和组件体系。第三，旧的 Arco 依赖、UnoCSS 依赖、旧的基础组件封装和主要旧样式文件只在新实现完全覆盖后才允许删除，最终主分支不保留“新旧 UI 同时面向用户”的混合态。

可见证据必须包括：新的设计系统蓝图在本文档中被冻结；新的目录分层、布局规则和组件规则按里程碑落地；`npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 通过；并完成一次对旧 Arco 依赖与 UnoCSS 依赖的清理。

## Progress

- [x] (2026-03-18 00:07 +08:00) 确认仓库中没有已检入的 `PLANS.md`；计划必须完全自包含。
- [x] (2026-03-18 14:29 +08:00) 完成设置页九个路由的迁移、typed API 接入、桌面与响应式 smoke 基线和 direct visual audit 基线，为后续整站重构提供稳定功能基线。
- [x] (2026-03-18 17:47 +08:00) 与用户确认目标升级为“整个前端设计系统逐步迁移到 shadcn/Tailwind”，且最终交付采用一次性切换，不再以设置页局部升级为终点。
- [x] (2026-03-18 17:47 +08:00) 冻结新的行业常见实现架构：`Tauri 2 + React 19 + Vite 7 + React Router 7 + Tailwind CSS v4 + shadcn/ui + Radix UI + React Hook Form + Zod + TanStack Query + Zustand`。
- [x] (2026-03-18 17:47 +08:00) 冻结新的目录分层和 UI 责任边界：`app / pages / widgets / features / entities / shared`，其中 shadcn 生成的基础组件落在 `shared/ui`，语义化业务组件落在 `widgets` 与 `features`。
- [x] (2026-03-18 17:47 +08:00) 冻结新的布局蓝图与视觉语言：新的 `App Frame`、`Settings Frame`、`Conversation Frame`、`Form Page Frame`，以及“graphite + cobalt + soft glass”工作台风格。
- [x] (2026-03-18 17:59 +08:00) 新增 [docs/前端统一重构蓝图.md](C:/Users/Victory/.codex/worktrees/15f7/AionX/docs/前端统一重构蓝图.md)，把统一 UI 框架、页面整体布局、组件风格、设计 token 和基础落地顺序冻结成独立蓝图文档，作为后续所有页面重构的上位规范。
- [x] (2026-03-19 08:50 +08:00) 完成 `R-010` 首轮基础设施切换：引入 `tailwindcss/@tailwindcss/vite`、首批 Radix/表单依赖与 React Query，新增 `components.json`、`src/shared/styles/{globals,tokens,theme}.css`、`src/shared/lib/cn.ts`、`src/app/providers/*` 与首批 `shared/ui` primitives，并把 `ThemeProvider` 扩展为同时驱动 `data-theme` 与 `.dark` class；随后串行通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-19 09:08 +08:00) 完成 `R-011` 首轮壳层切片：新增 `src/app/layouts/AppFrame.tsx` 与 `src/widgets/app-frame/*`，用新的 `AppSidebar`、`AppTitlebar` 和受保护路由统一壳层替换旧 `MainLayout` 路由挂接方式；Guide / Cron / Components / Conversation 进入新的 app shell，侧栏宽度 token 收回到 `280 / 72`，`ChatHistory` 支持移动端抽屉关闭回调，并串行通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-19 09:26 +08:00) 完成 `R-011` 第二轮内层 frame 抽取：新增 `src/app/layouts/ContentPageFrame.tsx`、`src/app/layouts/SettingsFrame.tsx`、`src/app/layouts/ConversationFrame.tsx` 与 `src/app/layouts/index.ts`，把 `SettingsLayout`、`ChatLayout`、`GuidePage`、`CronPage`、`ComponentsShowcasePage` 接入新的共享内容骨架，同时串行通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-19 09:38 +08:00) 完成 `R-011` 第三轮页面 primitive 落地：新增 `src/app/layouts/FormPageFrame.tsx` 与 `src/shared/ui/page.tsx`，为 `src/shared/ui/button.tsx` 补齐 loading 态，并把 `src/features/auth/LoginPage.tsx`、`src/features/settings/pages/about/page.tsx`、`src/features/settings/pages/about/components/UpdateCard.tsx` 迁到新骨架，同时让 Guide / Cron / Components 开始复用共享 `PageHeader`；随后串行通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-19 11:06 +08:00) 修正 `R-011` 壳层拓扑并完成导航组件统一：`/settings/*` 从 `AppFrame` 子路由提升回与 `AppFrame` 平级的独立 shell，`src/shared/ui/sidebar.tsx` 开始同时承载 `AppSidebar`、`SettingsNav`、`SettingsBackLink` 与 `SettingsMobileTabs`，并补回稳定 `data-testid` 锚点；随后重新串行通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。
- [x] (2026-03-19 11:52 +08:00) 完成一轮基于真实 Tauri 截图工件的 settings 壳层与页面收敛：把 settings 外层内容宽度正式改为随 `narrow / regular / wide / full` preset 驱动，收紧共享侧栏导航密度，并针对 `webui / tools / about` 收口卡片、tab 与更新卡的视觉节奏；随后串行通过 `npm run build`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`，并刷新 `tmp/settings-parity/desktop/*` 与 `tmp/settings-parity/responsive/*`。
- [x] (2026-03-20 23:18 +08:00) 把本地旧工作树保存到 `codex/local-backup-20260320`，将 `master` 对齐到 `origin/master@dcc1eeb`，确认当前执行基线必须以远程最新代码为准，而不是本地旧状态。
- [x] (2026-03-20 23:11 +08:00) 在远程最新 `master` 上重新盘点 UI 栈现状，确认 `shadcn/Tailwind` 地基已引入，但 `Arco Design` 与 `UnoCSS` 仍然深度参与运行时、页面组件和样式覆盖。
- [ ] (2026-03-18 17:47 +08:00) 完成 `R-011` 壳层重建。
  已完成：新壳层规则冻结；`AppFrame`、`AppSidebar`、`AppTitlebar` 与受保护路由统一挂接已落地，`/guid`、`/cron`、`/conversation/:id` 已进入新的 app shell，而 `/settings/*` 现已回到与 `AppFrame` 平级的独立 `SettingsLayout` shell；`SettingsFrame`、`ConversationFrame` 与 `ContentPageFrame` 也已从页面内联结构中抽出，Guide / Cron / Components 等简单页面已改为通过共享内容 frame 吃统一宽度 token；`FormPageFrame`、`PageHeader`、`PageSection` 这类共享页面 primitive 也已落地，并已真实接管 `/login` 与 `settings/about`；同时 app/settings/mobile 三类导航已经开始共享 `Sidebar*` primitives，而不是各自维护一套导航实现。
  剩余：把其余 simple pages 的区块内容继续迁到 `PageSection`/`PageGrid` 等共享语义上，减少 `app-shell.css` 中的 page-only 规则；替换旧 `src/components/layout/*` 的剩余运行时引用；继续把聊天页和设置页内部高频块级容器从旧 CSS class 迁到 shared semantic components。
- [ ] (2026-03-18 17:47 +08:00) 完成 `R-012` 共享组件重建。
  已完成：按钮、输入、卡片、Tabs、Sheet、Dialog、Dropdown、Toast、Table、Empty State、Command Palette 的规格冻结；远程最新 `master` 已引入 `src/shared/ui/*`、`src/shared/styles/*`、`src/app/providers/*` 与 `components.json`，说明新的基础层已经有落点。
  剩余：用 `src/shared/ui/*` 和新的 semantic wrappers 实际替换旧 `src/components/base/*` 与主要 Arco 组件调用点；优先替换公共层 `ThemeProvider`、`Tooltip`、`Modal`、`Select`、`Input`、`Button`、`Card`，让页面迁移不再继续扩大 Arco 使用面。
- [ ] (2026-03-18 17:47 +08:00) 完成 `R-013` 主页面一次性重写。
  已完成：路由范围冻结。
  剩余：按“登录与引导 -> 聊天与工作区 -> 设置页 -> 其余展示页”的顺序，将所有主路径页面迁到新布局与新组件体系；远程最新代码显示设置页已大量拆成 `pages/*/components/*` 与 `pages/*/hooks/*`，因此这一阶段应以页面内控件替换和布局语义收口为主，而不是继续扩展旧 Arco 页面。
- [ ] (2026-03-18 17:47 +08:00) 完成 `R-014` 旧体系删除与回归。
  已完成：清理目标冻结。
  剩余：删除 Arco 依赖、UnoCSS 依赖、旧基础组件、旧样式覆盖；其中 `src/main.tsx` 的 `virtual:uno.css`、`uno.config.ts`、`package.json` 中 `@unocss/*`、`src/styles/global.css` 中 Arco 样式入口、`src/styles/arco-override.css` 与 `src/styles/app-shell.css` 中 `.arco-*` 规则都必须在新实现完全覆盖后再删；随后更新 smoke 选择器并完成构建、桌面 smoke、响应式 smoke、截图审计。

## Surprises & Discoveries

- Observation: 当前仓库的“功能层”已经相对稳定，真正需要推倒重来的主要是“展示层”和“交互层”，因此这次重构不应该顺手重写 typed API、Tauri 命令和设置页 registry 逻辑。
  Evidence: `src/features/settings/api/*.ts`、`src/features/settings/routes.tsx`、`src/router.tsx` 已能稳定驱动九个设置页、聊天页和主路由，最近多轮 `build + cargo check + e2e` 均通过。

- Observation: 当前前端样式体系已经过于分散，单靠继续打补丁无法演进成稳定设计系统。
  Evidence: `src/styles/app-shell.css` 已超过单文件可维护阈值，里面同时承载 settings、chat、login、guid、cron 等多个页面的布局和组件规则；`src/styles/global.css` 还同时引入 Arco、主题系统、Arco overrides 和 app shell 样式。

- Observation: 远程最新 `master` 并没有完成 UI 体系切换，而是停留在“新地基已落、旧 UI 仍深度在用”的中间态。
  Evidence: `src/app/providers/ThemeProvider.tsx`、`src/components/base/*`、`src/features/settings/pages/**/*`、`src/features/guide/GuidePage.tsx`、`src/features/cron/CronPage.tsx` 等文件仍直接导入 `@arco-design/web-react`；`src/main.tsx` 仍导入 `virtual:uno.css`；`src/styles/global.css` 仍同时引入 `@arco-design/web-react/dist/css/arco.css` 与 `arco-override.css`。

- Observation: 这次迁移的真实主战场不是“新增 shadcn 基础设施”，而是“把已经存在的新基础设施真正接到运行时页面上，再删除旧栈”。
  Evidence: 远程最新代码已经拥有 `src/shared/ui/*`、`src/shared/styles/*`、`src/app/providers/*`、`components.json` 和 Tailwind v4 依赖，但运行中的设置页、聊天页和布局层仍大量依赖 Arco 组件与 `.arco-*` 样式覆盖。

- Observation: shadcn/ui 官方并不是传统 npm 组件库，而是“把组件代码生成到你仓库里，由你自己维护”的分发方式，这要求我们先冻结目录结构和 token 规则，再开始页面重写。
  Evidence: 官方文档要求先初始化 `components.json`，再确定 `css` 入口、alias、base color、CSS variables 方案，然后按需把组件代码生成到本地。

- Observation: Tailwind CSS v4 已经把设计 token 体系集中到 theme variables，这与当前仓库已经广泛使用 CSS variables 的现状是兼容的，适合把现有 `--bg-*`、`--text-*`、`--border-*` 语义升级为新的 design tokens。
  Evidence: Tailwind 官方文档明确以 `@theme` 变量作为颜色、字体、半径、阴影等设计 token 的统一入口。

- Observation: 即使用户要求“一次性推倒重来”，工程执行上依然需要分里程碑落地；区别在于“最终交付一次切换”，而不是“每完成一个模块就发布一半新 UI”。
  Evidence: 当前路由横跨登录、导航、聊天、设置与测试页面，若不先冻结共享壳层和共享组件规格，页面重写会反复返工。

- Observation: 仅在 `plans.md` 中写迁移步骤还不够，因为“统一 UI 框架、页面布局、组件风格”属于长期约束，更适合独立成蓝图文档供后续实现反复对照。
  Evidence: 当前计划文件已经同时承担阶段推进、设计决策和实现指令三种职责；若不把上位设计规则拆出去，后续每次调整里程碑时都容易稀释基础约束。

- Observation: 在旧 Arco/UnoCSS 页面仍然大量存在的阶段，直接启用 Tailwind preflight 风险很高；当前使用官方推荐的 `theme.css + utilities.css` 导入方式，只接入 theme variables 和 utilities，先不引入 preflight，能显著降低中间态回归风险。
  Evidence: 本轮 `src/shared/styles/globals.css` 使用 `@import "tailwindcss/theme.css"` 与 `@import "tailwindcss/utilities.css"`，并在不启用 preflight 的前提下串行通过了 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。

- Observation: “共享导航组件”和“共享导航壳层”是两回事。settings 可以与首页共享同一套 `Sidebar*` primitives，但不能因此退化成 `AppFrame` 的子工作区。
  Evidence: 当 `src/router.tsx` 一度把 `...settingsRoutes` 挂在 `AppFrame` 之下时，用户明确指出“首页是一个导航栏，设置页也是一个导航栏，平级的”；本轮把 `/settings/*` 提升回 `ProtectedOutlet` 下与 `AppFrame` 平级后，`npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 继续全部通过。

- Observation: 把 `SettingsMobileTabs` 也改为横向 `SidebarMenu + SidebarMenuButton` 后，desktop 与 mobile 的 settings 导航终于真正使用同一套组件语言，而不是“桌面共享、移动端另起一套 pill 规则”。
  Evidence: `src/features/settings/layout/SettingsMobileTabs.tsx` 现在直接基于 `src/shared/ui/sidebar.tsx` 组装，并在补回 `data-testid="settings-mobile-tabs"` / `data-testid="settings-back-link"` 后恢复了响应式 smoke 通过。

- Observation: 仅在新的 token/theme 文件里定义标题栏变量还不够，因为旧 `src/styles/themes/base.css` 仍会在后续导入中覆盖 `--titlebar-height` 和 `body` 字体。
  Evidence: 本轮必须同时把 `src/styles/themes/base.css` 中的 `--titlebar-height` 收回到 `40px`，并把 `body` 的字体切到 `var(--app-font-sans)`，新的 `AppTitlebar` 才真正吃到统一 token。

- Observation: settings 壳层虽然已经在 registry 中定义了 `widthPreset`，但在这轮修正前，`src/styles/app-shell.css` 里的 `.settings-layout__content` 仍被硬编码为 `920px`，导致 `wide/full` preset 实际没有改变外层内容测量宽度，只能靠页面内部再套一层 `max-width` 硬顶。
  Evidence: 本轮把 `.settings-layout__content` 改成读取 `--settings-content-max`，并由 `settings-page--narrow/regular/wide/full` 注入具体值；随后刷新后的 `tmp/settings-parity/desktop/tools-desktop.png` 与 `tmp/settings-parity/desktop/webui-desktop.png` 中，外层内容宽度终于与 `Gemini / System / About` 的窄中宽语义分离开来。

- Observation: 在 settings 仍大量依赖旧 `app-shell.css` 的阶段，抽取新的 React `SettingsFrame` 时必须保留 `.settings-layout` 根节点和既有 class 语义，否则共享 spacing 与宽度变量会瞬间失效。
  Evidence: `src/app/layouts/SettingsFrame.tsx` 继续以 `settings-layout / settings-layout__surface / settings-layout__body / settings-layout__content` 为根结构，随后 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 全部保持通过。

- Observation: Guide、Cron、Components 这类页面虽然内容还没完全脱离 Arco，但先统一到 `ContentPageFrame` 依然是低风险高收益，因为它能先冻结页面宽度和外层滚动语义。
  Evidence: `src/features/guide/GuidePage.tsx`、`src/features/cron/CronPage.tsx`、`src/features/test/ComponentsShowcasePage.tsx` 已切到 `ContentPageFrame`，且双 smoke 继续通过，说明“先收内容骨架、后换内部组件”是可行路径。

- Observation: 登录页不能继续沿用旧 `.login-page` 全局样式名，否则旧 `app-shell.css` 会把新的 `FormPageFrame` 又拉回历史布局语义。
  Evidence: 本轮 `src/features/auth/LoginPage.tsx` 改为直接吃 `FormPageFrame` 的 Tailwind 结构，而没有复用旧 `.login-page__card` / `.login-page__background` 体系；随后 `npm run build` 与双 smoke 全部通过，说明“新 frame + 摘掉旧 page class”是稳定做法。

- Observation: 一旦 About 和 Login 开始改用 shared primitives，基础按钮就需要自带 loading 能力；否则每个页面都会重新为“加载中按钮”造一层包装。
  Evidence: 本轮为 `src/shared/ui/button.tsx` 补上 `loading` prop 后，`src/features/settings/pages/about/components/UpdateCard.tsx` 可以直接复用 shared button 处理更新检查中的禁用与加载反馈，同时保持构建和 smoke 通过。

## Decision Log

- Decision: 本次重构采用“一次性切换”的交付策略，而不是长期新旧并存。
  Rationale: 用户已明确要求“一次性推倒重来”。我们允许开发分阶段提交代码，但不允许在最终交付中长期保留面向用户的新旧 UI 双轨。
  Date/Author: 2026-03-18 / Codex

- Decision: 保留 `Tauri 2 + React 19 + Vite 7 + React Router 7` 作为运行时与路由框架，不重写成 Next.js 或其他 SSR 架构。
  Rationale: 当前项目是桌面端 Tauri 应用，已有稳定的 typed invoke、桌面 smoke 和 hash router；这些不是设计系统问题，不应在这次视觉与交互重构中一起替换。
  Date/Author: 2026-03-18 / Codex

- Decision: 新 UI 栈采用 `Tailwind CSS v4 + shadcn/ui + Radix UI + class-variance-authority + tailwind-merge + lucide-react`。
  Rationale: 这是当前 React + Vite 桌面/后台类应用中最常见、生态最成熟、可塑性最高的一条路线，也与 shadcn 官方的 Vite 初始化和 CSS variables 主题方式一致。
  Date/Author: 2026-03-18 / Codex

- Decision: 表单层采用 `React Hook Form + Zod`，远程或异步数据快照层采用 `TanStack Query`，本地 UI 状态继续保留 `Zustand`。
  Rationale: 这是目前 React 项目中较常见、边界清晰的组合。表单验证、命令式保存、异步加载和本地窗口状态分别有清晰职责，避免继续把所有状态都塞进手写 hooks。
  Date/Author: 2026-03-18 / Codex

- Decision: 目录分层采用“轻量 Feature-Sliced / 领域分层”而不是“纯 components/hooks/utils 按类型分桶”。
  Rationale: 当前仓库的 settings 模块已经证明 feature-first 边界是有效的。新的全前端结构继续沿用这一思想，但把共享 UI 与页面壳层分出来，降低未来维护成本。
  Date/Author: 2026-03-18 / Codex

- Decision: `F:\Work\AionUi` 继续保留为功能与信息架构参考源，但不再作为视觉目标。
  Rationale: 一次性全前端重构的目标是建立新的 AionX 设计语言，而不是继续追求旧项目外观。
  Date/Author: 2026-03-18 / Codex

- Decision: 新增独立蓝图文档 [docs/前端统一重构蓝图.md](C:/Users/Victory/.codex/worktrees/15f7/AionX/docs/前端统一重构蓝图.md) 作为 UI 框架、布局和组件风格的上位规范。
  Rationale: 用户明确要求“先把基础做好”，而基础约束需要比执行清单更稳定、可长期引用的文档承载。
  Date/Author: 2026-03-18 / Codex

- Decision: `R-010` 阶段先接入 Tailwind theme variables 与 utilities，不启用 preflight，同时保留 UnoCSS 与 Arco 以保护中间态页面。
  Rationale: 当前项目仍有大量旧页面依赖 Arco 和既有全局样式，先关闭 preflight 可以让新设计系统地基先落地，再在后续壳层和页面切换时逐步移除旧体系。
  Date/Author: 2026-03-19 / Codex

- Decision: 从 2026-03-20 起，所有后续迁移工作必须以 `origin/master@dcc1eeb` 为执行基线，本地旧工作树只保存在备份分支 `codex/local-backup-20260320` 供追溯，不再作为实现依据。
  Rationale: 用户明确怀疑此前查看的是旧项目；实际同步后也已证实远程最新代码结构与本地旧状态差异巨大。若继续基于旧工作树规划，会错误判断 Arco/UnoCSS 的残留范围和新 UI 地基的完成度。
  Date/Author: 2026-03-20 / Codex

- Decision: `R-012` 与 `R-014` 必须显式把“移除 UnoCSS”与“移除 Arco”并列作为硬目标，而不是只写“逐步迁移到 shadcn/Tailwind”。
  Rationale: 用户已明确要求 `UnoCSS` 和 `Arco` 都要全部移除。当前远程最新代码仍同时保留 `virtual:uno.css`、`uno.config.ts`、`@unocss/*`、`@arco-design/web-react`、Arco 全量样式入口和大量 `.arco-*` 覆盖；如果计划不把删除动作写成明确验收项，执行者很容易只做“新增新组件”而不做旧栈清理。
  Date/Author: 2026-03-20 / Codex

- Decision: `R-011` 的第一刀先做“共享 app shell 替换”，而不是立刻重写 Guide、Conversation 或 Settings 的页面内容。
  Rationale: 新壳层是所有页面都会复用的地基。先把 `AppFrame` 接到所有受保护路由上，可以在不动功能层和大部分页面内容的前提下，尽早冻结标题栏、侧栏、移动端抽屉和内容画布语义，减少后续页面改造返工。
  Date/Author: 2026-03-19 / Codex

- Decision: `AppFrame` 与 `SettingsLayout` 必须保持平级工作区；共享的是 `Sidebar` primitives，不是同一个外层 shell。
  Rationale: 用户已明确指出首页导航栏和设置页导航栏应该是平级关系。`AppSidebar`、`SettingsNav`、`SettingsBackLink`、`SettingsMobileTabs` 可以复用 `src/shared/ui/sidebar.tsx`，但 `/settings/*` 不能继续作为 `AppFrame` 的子路由存在，否则信息架构会错位。
  Date/Author: 2026-03-19 / Codex

- Decision: `R-011` 的第二刀先抽“内层 frame”，并在 settings 内继续保留旧 class 语义，而不是立刻删除 `app-shell.css` 或直接重写单页视觉。
  Rationale: 当前真正缺的是共享结构语义，而不是某一页单独的样式微调。先把 `SettingsFrame`、`ConversationFrame`、`ContentPageFrame` 抽出来，可以在不破坏 settings/chat 现有功能和 smoke 选择器的前提下，给后续 `FormPageFrame` 与页面 primitives 铺路。
  Date/Author: 2026-03-19 / Codex

- Decision: `R-011` 的第三刀优先让 `FormPageFrame + PageHeader/PageSection` 在 Login 和 About 上真实跑起来，而不是继续扩大到整页组件大迁移。
  Rationale: `/login` 和 `settings/about` 都属于窄栏页，结构最适合作为新页面 primitive 的首批落点；同时它们能覆盖“路由独立页”和“settings 内嵌页”两类场景，一旦跑通，后续迁移其余 simple pages 就不需要再猜这些 primitive 是否够用。
  Date/Author: 2026-03-19 / Codex

- Decision: 从这一轮开始，settings 收敛优先以“真实 Tauri 截图工件 + 共享 layout/component tokens”驱动，而不是继续在 `app-shell.css` 上做无工件支撑的盲调。
  Rationale: 用户已明确要求“可以的话请自动化处理每个页面”。本轮串行刷新 desktop / responsive visual audit 后，已经能直接从 `tmp/settings-parity/` 判断侧栏密度、内容宽度和 `tools / webui / about` 的页面内节奏，因此后续继续收敛时应先刷新工件，再改共享值或页面局部。
  Date/Author: 2026-03-19 / Codex

## Outcomes & Retrospective

2026-03-18 的阶段性结果是：我们已经把此前“设置页高保真复刻”的任务正式收束为历史基线，并把新的全前端一次性重构目标写成了可执行计划。当前最大的价值不是已经改了多少页面，而是已经冻结了三个关键前提：采用哪条行业常见技术栈、采用什么目录结构、采用什么布局和组件语言。

2026-03-19 的阶段性结果是：`R-010` 的首轮地基已经真实落地。现在项目已经具备 Tailwind v4、`components.json`、新 `ThemeProvider`/`QueryProvider`、`cn()`、首批 `shared/ui` primitives 和新的 token/theme 入口，而且这些变更没有破坏构建、Tauri 检查和双 smoke。下一阶段的重点不再是“把基础接起来”，而是开始 `R-011` 壳层重建，并逐步让新页面真正使用这些基础能力。

2026-03-19 09:08 +08:00 的阶段性结果是：`R-011` 已经从“蓝图描述”进入“真实运行中的新壳层”。现在登录后的主工作区路径已经统一挂到新的 `AppFrame`，共享标题栏和侧栏由 `src/widgets/app-frame/*` 承载，验证链路仍然保持通过。随后经过 2026-03-19 11:06 +08:00 的纠偏，`/settings/*` 已从 `AppFrame` 子路由提升回平级独立 shell；因此下一阶段的重点不再是把 settings 并入首页壳层，而是让两个平级工作区共享同一套导航组件语言和页面 primitives。

2026-03-19 09:26 +08:00 的阶段性结果是：`R-011` 的“内层 frame 抽取”也已经进入真实运行态。现在 settings、chat 和 simple content pages 不再各自持有一套匿名外壳，而是分别通过 `SettingsFrame`、`ConversationFrame`、`ContentPageFrame` 吃统一结构语义，同时所有现有验证仍保持通过。下一阶段的重点因此进一步收窄为两件事：补上 `FormPageFrame`，以及把 `PageHeader`、`PageSection` 这类共享页面 primitive 提炼出来，让 `/login`、`settings/about` 等窄栏页也脱离页面私有壳层。

2026-03-19 09:38 +08:00 的阶段性结果是：`R-011` 已经从“共享壳层”进一步推进到了“共享页面语义”。现在 `FormPageFrame`、`PageHeader`、`PageSection` 已经不是蓝图里的概念，而是实际运行在 `/login` 与 `settings/about` 上的组件；Guide / Cron / Components 也已经开始复用同一套页头语义。下一阶段的重点因此从“发明页面 primitive”切换为“扩大覆盖面并削减旧 page-only CSS”。

2026-03-19 11:52 +08:00 的阶段性结果是：settings 的“共享壳层”和“逐页页面感受”终于被一轮真实工件串起来了。现在 `src/shared/ui/sidebar.tsx` 的 settings 变体、`src/styles/app-shell.css` 中的 settings content width tokens，以及 `webui / tools / about` 三页的局部容器节奏都已经按真实截图重新收口，并重新通过 `build + desktop smoke + responsive smoke + direct visual audit`。下一阶段的重点将不再是继续微调这三页，而是把同一套 shared page/component primitives 扩展到更多设置页内部，逐步削减剩余的旧 Arco page-only 结构。

## Context and Orientation

当前应用的运行时基础已经比较清晰。入口在 `src/main.tsx`，应用本体在 `src/App.tsx`，主路由在 `src/router.tsx`。当前主路径包括：

- `/login`
- `/guid`
- `/cron`
- `/conversation/:id`
- `/settings/gemini`
- `/settings/model`
- `/settings/agent`
- `/settings/display`
- `/settings/webui`
- `/settings/system`
- `/settings/tools`
- `/settings/about`
- `/settings/ext/:tabId`

当前仓库正处于“新旧 UI 并存但由新计划接管”的过渡阶段。新的地基已经落在 `src/shared/` 与 `src/app/providers/`：`package.json` 已引入 `tailwindcss`、`@tailwindcss/vite`、`class-variance-authority`、`clsx`、`tailwind-merge`、`lucide-react`、`react-hook-form`、`zod`、`@tanstack/react-query`，并且仓库根目录已经存在 `components.json`。同时，运行中的登录后壳层入口已经从旧 `src/components/layout/MainLayout.tsx` 切换到新的 [src/app/layouts/AppFrame.tsx](C:/Users/Victory/.codex/worktrees/15f7/AionX/src/app/layouts/AppFrame.tsx)，对应的侧栏与标题栏位于 [src/widgets/app-frame/AppSidebar.tsx](C:/Users/Victory/.codex/worktrees/15f7/AionX/src/widgets/app-frame/AppSidebar.tsx) 与 [src/widgets/app-frame/AppTitlebar.tsx](C:/Users/Victory/.codex/worktrees/15f7/AionX/src/widgets/app-frame/AppTitlebar.tsx)。

但大部分页面内容层仍然是旧体系，因此当前真实状态仍是“Tailwind/shadcn 地基 + Arco 页面内容”的中间态。主要证据如下：

- `src/styles/global.css` 仍同时引入了 `src/shared/styles/globals.css`、Arco 样式、旧主题系统、Arco 覆盖和 `app-shell.css`。
- `src/styles/app-shell.css` 仍集中承载聊天页、设置页、登录页、引导页等多个页面的布局和组件规则。
- `src/components/base/Button.tsx`、`src/components/base/Card.tsx`、`src/components/base/Input.tsx` 以及大量页面仍继续依赖 Arco 组件。
- `src/components/layout/*` 旧壳层文件仍保留在仓库里，供过渡阶段对照和后续清理，但主路由已经不再从它们挂接。

“shadcn/ui”在本计划里指的是一套基于 Radix primitives 和 Tailwind CSS 的本地组件代码分发方式，而不是运行时组件库。它的典型落地方式是：初始化 `components.json`，建立一个全局 CSS 入口和 alias，然后把基础按钮、输入框、下拉菜单、Dialog、Tabs 等组件代码生成到仓库里，由项目自己维护。

“一次性重构”在本计划里的准确含义是：可以在当前工作树中分里程碑逐步写代码，但最终交付前不能保留“用户一半页面是旧 Arco 样式，一半页面是新 shadcn 样式”的长期混合态。换句话说，开发过程允许中间态，产品交付不允许中间态。

本计划之外，还必须同时遵守 [docs/前端统一重构蓝图.md](C:/Users/Victory/.codex/worktrees/15f7/AionX/docs/前端统一重构蓝图.md) 中冻结的上位设计约束。那份蓝图文档定义的是“应该长成什么样”，本计划定义的是“按什么顺序落地”。

## Plan of Work

第一阶段是 `R-010`，也就是基础设施切换。当前这一阶段的首轮目标已经完成：`package.json` 已引入 Tailwind CSS v4、Radix/shadcn 常用基础依赖、表单与数据状态依赖；仓库根目录已经新增 `components.json`；`src/styles/global.css` 也已经接到新的 `src/shared/styles/globals.css`。为保护旧页面，这里采用了 Tailwind 官方支持的 `theme.css + utilities.css` 导入方式，只启用 theme variables 和 utilities，暂不启用 preflight。这样新设计系统已经能生成组件、渲染主题并和现有主题状态联动，同时又不会在壳层重写前直接冲击所有旧页面。

第二阶段是 `R-011`，也就是壳层重建。当前前三刀都已落地，并已在本轮补上一个关键纠偏：第一刀用 `src/app/layouts/AppFrame.tsx`、`src/widgets/app-frame/AppSidebar.tsx`、`src/widgets/app-frame/AppTitlebar.tsx` 和 `src/widgets/app-frame/app-shell-meta.ts` 替换了主工作区路由的旧 `MainLayout` 挂接方式；第二刀新增了 `src/app/layouts/ContentPageFrame.tsx`、`src/app/layouts/SettingsFrame.tsx` 与 `src/app/layouts/ConversationFrame.tsx`，把 settings/chat/simple pages 的内层结构收进共享 frame；第三刀新增了 `src/app/layouts/FormPageFrame.tsx` 与 `src/shared/ui/page.tsx`，让 `/login` 与 `settings/about` 开始吃统一页面语义；而本轮进一步确认 `src/router.tsx` 中 `AppFrame` 与 `settingsRoutes` 必须保持平级，只共享 `src/shared/ui/sidebar.tsx` 这套导航 primitives。接下来的重点不再是“先把 frame 生出来”，而是扩大这些 primitives 的覆盖面，并继续剥离旧的 page-only CSS。

第三阶段是 `R-012`，也就是共享组件重建。先补齐和稳定基础 primitives：`Button`、`Input`、`Textarea`、`Select`、`Switch`、`Tabs`、`Dialog`、`Sheet`、`DropdownMenu`、`Popover`、`Tooltip`、`Command`、`Table`、`ScrollArea`、`Separator`、`Badge`、`Alert`、`Skeleton`。然后在 `shared/ui` 上层新增语义化组件：`PrimaryAction`、`SectionCard`、`FieldRow`、`PageToolbar`、`EmptyState`、`StatusBadge`、`IconButton`。执行顺序必须先从公共层下刀：`src/app/providers/ThemeProvider.tsx`、`src/components/layout/{Sidebar,Titlebar,MainLayout}.tsx`、`src/components/base/*`、`src/components/ui/LanguageSwitcher.tsx`。此阶段完成后，新页面不应再直接依赖 Arco 基础组件，也不应继续新增 UnoCSS 原子类依赖。

第四阶段是 `R-013`，也就是页面一次性重写。顺序固定如下：先改登录页和引导页，因为这两类页面最能快速建立新视觉语言；再改聊天页与主工作区，因为它们定义整个产品的主壳层；接着整体重写设置页，因为设置页已经具备稳定功能基线，且远程最新代码已经拆出了 `pages/*/components/*` 和 `pages/*/hooks/*`；最后改 cron 和组件展示页等非核心路径。执行中允许先保留旧 API 和旧 hooks，只替换展示层、表单层和布局层。

第五阶段是 `R-014`，也就是旧体系删除与回归。只有当所有主路径都已切到新 UI，才允许从 `package.json` 移除 `@arco-design/web-react`、`@arco-design/color` 与 `@unocss/*` 相关依赖，删除 `src/components/base/*`、`uno.config.ts`、`src/main.tsx` 中 `virtual:uno.css` 入口、`src/styles/arco-override.css`、`src/styles/app-shell.css` 中被新体系覆盖的 `.arco-*` 和旧页面规则，以及不再使用的旧类名。然后统一修正 smoke 选择器与视觉审计脚本，确认桌面与响应式路径都通过。

## Concrete Steps

本轮之后的执行顺序必须严格按下面的工作流推进。

1. 在仓库根目录执行依赖安装与基础初始化。

   工作目录：`C:\Users\Victory\.codex\worktrees\15f7\AionX`

   建议命令：

       npm install tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge lucide-react react-hook-form @hookform/resolvers zod @tanstack/react-query
       npx shadcn@latest init -t vite

   预期结果：仓库出现 `components.json`，并具备新的全局 CSS 入口与基础 alias。

2. 建立新的共享目录和核心文件。

   必须新增或重构以下路径：

   - `src/app/providers/`
   - `src/app/layouts/`
   - `src/shared/ui/`
   - `src/shared/lib/cn.ts`
   - `src/shared/styles/globals.css`
   - `src/shared/styles/tokens.css`
   - `src/shared/styles/theme.css`
   - `src/widgets/`

   预期结果：新的 UI 与样式体系有明确落点，后续页面不再把规则继续堆进 `src/styles/app-shell.css`。

3. 在新 token 体系中定义视觉语言。

   必须定义并落地：

   - 字体：`Geist Sans` 或同级现代无衬线字体，中文回退 `PingFang SC`、`Microsoft YaHei`、`Noto Sans SC` 之一；等宽字体使用 `Geist Mono` 或同级方案。
   - 颜色：以 graphite 中性色为底，cobalt 作为主强调色，success/warning/destructive 使用语义色，不延续旧的紫色主调。
   - 半径：`10 / 14 / 18 / 24`
   - 间距：`4 / 6 / 8 / 12 / 16 / 24 / 32`
   - 阴影：只保留 `sm / md / lg` 三档，不再让页面各自定义大面积阴影。

4. 实现新的布局框架。

   必须至少提供：

   - `AppFrame`：桌面端 titlebar + 主导航 + 内容画布；移动端 drawer + 顶栏 + 内容画布。
   - `SettingsFrame`：桌面端二级导航栏 + 内容区；移动端顶栏 + section switcher + 内容区。
   - `ConversationFrame`：主会话区 + 可折叠侧栏/右侧辅助面板。
   - `FormPageFrame`：单页表单、窄栏说明页、关于页、登录页的统一宽度语义。

   宽度语义必须统一成固定 tokens，例如：

   - `form = 720px`
   - `content = 960px`
   - `wide = 1200px`
   - `full = 100%`

5. 在页面重写前先补齐共享页面 primitives。

   必须新增一层共享页面语义组件，例如：

   - `PageHeader`：标题、说明、操作区的统一页头
   - `PageSection`：普通内容区块/卡片容器
   - `PageGrid` 或等价物：受控的两栏/三栏内容网格

   这些 primitives 的职责是统一内容页和窄栏页的骨架语义，避免后续在 `/guid`、`/cron`、`/test/components`、`/login`、`/settings/about` 中继续复制一套页头和卡片壳层。

6. 一次性重写页面。

   页面重写顺序固定为：

   - `/login`
   - `/guid`
   - `/conversation/:id`
   - `/settings/*`
   - `/cron`
   - `/test/components`

   原则是：先重写壳层和共享组件，再重写页面；不要反过来先做页面局部美化。

7. 删除旧体系并完成验收。

   必须清理：

   - `@arco-design/web-react`
   - `@arco-design/color`
   - `@unocss/*`
   - `uno.config.ts`
   - `src/main.tsx` 中的 `virtual:uno.css`
   - `src/components/base/*`
   - `src/styles/arco-override.css`
   - `src/styles/app-shell.css` 中已被新体系覆盖的规则

   完成后重新跑构建、Tauri 检查和双 smoke。

## Validation and Acceptance

验收必须同时覆盖“功能不回退”和“设计系统切换完成”。

基础验收命令如下。

工作目录：`C:\Users\Victory\.codex\worktrees\15f7\AionX`

    npm run build
    cargo check
    npm run e2e:debug:desktop
    npm run e2e:debug:responsive

成功标准如下。

- `npm run build` 通过，说明 TypeScript、Vite 和新的 Tailwind/shadcn 依赖链路正常。
- `cargo check` 通过，说明前端重构没有误伤 Tauri 侧接口与配置。
- 桌面 smoke 通过，说明主导航、聊天页、设置页在桌面模式仍然可用。
- 响应式 smoke 通过，说明移动端或窄屏模式下的新壳层没有破坏导航、返回和表单交互。
- `package.json` 中不再存在 Arco 和 UnoCSS 依赖，`src/main.tsx` 不再导入 `virtual:uno.css`，仓库根目录不再保留 `uno.config.ts`，说明设计系统切换真正完成。
- 至少抽查 `/login`、`/conversation/:id`、`/settings/webui`、`/settings/tools`、`/settings/about` 五类页面，确认主工作区页面已经落到新的 `AppFrame`，settings 页面已经落到平级 `SettingsLayout`，并且它们都复用了新的 `shared/ui` 体系，而不是局部残留旧样式。

## Idempotence and Recovery

这次重构的安全策略是“分里程碑提交，但最终一次切换”。如果某一阶段失败，不要回滚整个仓库；应回到最近一个通过 `build + cargo check + e2e` 的提交点继续推进。不要使用 `git reset --hard` 之类的破坏性命令。

依赖层改造时，允许在中间态短暂同时存在旧依赖和新依赖，但不允许删除旧依赖后还没有可运行的新页面。也就是说，删除动作永远发生在替换动作之后，而不是之前。

由于 WebDriver 与 Tauri 调试链路存在端口竞争，`npm run e2e:debug:desktop` 与 `npm run e2e:debug:responsive` 以及任何 direct visual audit 仍然必须串行执行，不能并行。

## Artifacts and Notes

新的目录架构必须收敛到以下形态。允许个别目录名有微调，但职责不能改变。

    src/
      app/
        layouts/
        providers/
        router/
      pages/
      widgets/
      features/
        auth/
        chat/
        settings/
        cron/
        guide/
      entities/
      shared/
        ui/
        lib/
        hooks/
        styles/
        config/

新的组件层级必须分成两层。

    shared/ui
      负责 shadcn primitives、通用 variants、基础视觉 token。

    widgets 和 features
      负责业务语义组件，例如 app sidebar、settings nav、conversation header、tool server card。

新的视觉语言冻结如下。

- 整体气质：桌面工作台，不做消费级彩色卡片拼盘。
- 主色：cobalt，而不是旧仓库默认的紫色倾向。
- 背景：大面积 graphite/neutral 分层，卡片通过边框和弱阴影区分层级。
- 字体：现代无衬线 + 明确中文回退，不继续使用默认系统栈直接裸奔。
- 动效：保留 page enter、drawer enter、hover elevation 三类有意义动画，不加大量花哨微交互。

## Interfaces and Dependencies

必须存在并最终稳定的基础依赖与接口如下。

在 `package.json` 中，新增并保留：

- `tailwindcss`
- `@tailwindcss/vite`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `@tanstack/react-query`

在仓库根目录，定义：

    components.json

它必须指向新的全局样式入口和 UI alias，例如：

    {
      "tailwind": {
        "css": "src/shared/styles/globals.css",
        "cssVariables": true
      },
      "aliases": {
        "ui": "@/shared/ui",
        "lib": "@/shared/lib",
        "hooks": "@/shared/hooks"
      }
    }

在 `src/shared/lib/cn.ts` 中，定义：

    export function cn(...inputs: ClassValue[]): string

它必须基于 `clsx` 与 `tailwind-merge`，作为全项目 className 合并入口。

在 `src/app/providers` 中，必须最终存在：

    ThemeProvider
    QueryProvider

其中 `ThemeProvider` 负责 light/dark/system 和语义 token 切换，`QueryProvider` 负责 React Query 全局缓存。

在 `src/shared/ui` 中，必须最终存在下列基础组件或等价物：

    button
    input
    textarea
    select
    switch
    tabs
    dialog
    sheet
    dropdown-menu
    popover
    tooltip
    separator
    scroll-area
    badge
    alert
    skeleton
    command
    table

变更说明（2026-03-18 17:47 +08:00）：

本次修订将计划从“设置页迁移与高保真复刻”重置为“全前端 shadcn/Tailwind 一次性重构”。之所以必须整体重写而不是继续在旧计划上微调，是因为用户已经明确给出新的工程目标：不再把设置页当成孤立任务，而是把整个前端设计系统一次性推倒重来。若不把计划整体改写为新的架构蓝图，下一位执行者仍会沿着“保留 Arco、局部改 settings”的旧方向投入时间。

变更说明（2026-03-18 17:59 +08:00）：

本次修订补充了独立的上位蓝图文档 [docs/前端统一重构蓝图.md](C:/Users/Victory/.codex/worktrees/15f7/AionX/docs/前端统一重构蓝图.md)，并把计划重点进一步收束为“先做基础，再做页面”。之所以必须补这一层，是因为用户明确要求重新规划完整统一的 UI 框架、页面整体布局和组件风格；如果这些约束只散落在计划的里程碑里，后续实现会反复回到“先挑一页开改”的低效路径。

变更说明（2026-03-19 08:50 +08:00）：

本次修订记录了 `R-010` 首轮基础设施切换的真实完成态：Tailwind v4、`components.json`、`shared/styles`、`app/providers`、`cn()` 和首批 `shared/ui` primitives 已落地，`ThemeProvider` 现在会同时写入旧体系所需的 `data-theme` 和新体系所需的 `.dark` class，同时为了保护过渡期页面，`src/shared/styles/globals.css` 采用了不含 preflight 的官方导入方式。之所以必须写回计划，是因为后续执行者已经不需要再从“安装 Tailwind”开始，而应直接进入 `R-011` 壳层重建。

变更说明（2026-03-19 09:08 +08:00）：

本次修订记录了 `R-011` 的首轮真实落地：`src/router.tsx` 已改为通过 [src/app/layouts/AppFrame.tsx](C:/Users/Victory/.codex/worktrees/15f7/AionX/src/app/layouts/AppFrame.tsx) 承载所有受保护路由，新的侧栏和标题栏位于 `src/widgets/app-frame/`，同时 `src/contexts/LayoutContext.tsx` 与 `src/styles/themes/base.css` 已把侧栏宽度和标题栏高度收回到新 token，`ChatHistory` 也补上了移动端抽屉关闭回调。之所以必须写回计划，是因为下一位执行者已经不该再从“先写 AppFrame”开始，而应直接继续拆内层 frame、迁 simple pages，并最终清理旧 `src/components/layout/*` 的残留。

变更说明（2026-03-19 09:26 +08:00）：

本次修订补记了 `R-011` 第二轮内层 frame 抽取的真实完成态：`src/app/layouts/ContentPageFrame.tsx`、`SettingsFrame.tsx`、`ConversationFrame.tsx` 与 `src/app/layouts/index.ts` 已新增，`src/features/settings/layout/SettingsLayout.tsx`、`src/features/chat/components/ChatLayout.tsx`、`src/features/guide/GuidePage.tsx`、`src/features/cron/CronPage.tsx`、`src/features/test/ComponentsShowcasePage.tsx` 已改为使用新的共享 frame，且 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive` 均重新通过。之所以必须写回计划，是因为下一位执行者已经不该再把“抽 SettingsFrame/ConversationFrame”当作未完成任务，而应直接进入 `FormPageFrame + shared page primitives` 这一更细的下一阶段。

变更说明（2026-03-19 09:38 +08:00）：

本次修订补记了 `R-011` 第三轮页面 primitive 落地的真实完成态：`src/app/layouts/FormPageFrame.tsx` 与 `src/shared/ui/page.tsx` 已新增，`src/shared/ui/button.tsx` 已补上 loading 态，`src/features/auth/LoginPage.tsx`、`src/features/settings/pages/about/page.tsx`、`src/features/settings/pages/about/components/UpdateCard.tsx` 已迁到新骨架，同时 `src/features/guide/GuidePage.tsx`、`src/features/cron/CronPage.tsx`、`src/features/test/ComponentsShowcasePage.tsx` 已开始复用共享 `PageHeader`。之所以必须写回计划，是因为下一位执行者已经不该再从“是否需要 FormPageFrame/PageHeader”开始讨论，而应直接继续扩大这些 shared page primitives 的覆盖范围，并逐步删除旧页面壳层样式。

变更说明（2026-03-19 11:06 +08:00）：

本次修订纠正了一个重要的架构偏差：`/settings/*` 不应继续作为 `AppFrame` 的子路由存在，而应与 `AppFrame` 保持平级工作区；共享的是 `src/shared/ui/sidebar.tsx` 这套导航组件，而不是首页与设置页共用同一个外层壳子。为此，本轮把 `src/router.tsx` 中的 `settingsRoutes` 提升回 `ProtectedOutlet` 下的平级位置，并继续让 `src/features/settings/layout/{SettingsNav,SettingsBackLink,SettingsMobileTabs}.tsx` 共享同一套 `Sidebar*` primitives，同时补回稳定 `data-testid` 锚点，随后再次通过 `npm run build`、`cargo check`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`。之所以必须写回计划，是因为如果不明确记录“共享组件 != 共享壳层”，下一位执行者很容易再次把 settings 错挂回首页 shell。

变更说明（2026-03-19 11:52 +08:00）：

本次修订补记了一轮基于真实 Tauri visual audit 的 settings 收敛结果：`src/styles/app-shell.css` 现在真正让 `settings-page--narrow/regular/wide/full` 驱动外层内容宽度，`src/shared/ui/sidebar.tsx` 与 `src/features/settings/layout/{SettingsNav,SettingsBackLink}.tsx` 也进一步收紧了 settings 左侧导航的宽度、字号和按钮高度；同时 `src/features/settings/pages/about/{page,components/UpdateCard}.tsx` 与 `src/styles/app-shell.css` 中的 `webui / tools` 局部样式被重新压回更接近 Codex Desktop 的密度。随后重新串行通过 `npm run build`、`npm run e2e:debug:desktop`、`npm run e2e:debug:responsive`，并刷新 `tmp/settings-parity/desktop/*` 与 `tmp/settings-parity/responsive/*`。之所以必须写回计划，是因为这轮已经把“先看真实页面再统一处理每页”的用户要求落成稳定流程；如果不记录新的 width 语义和工件刷新结果，下一位执行者仍会误以为 settings 外层宽度和截图基线停留在旧状态。

变更说明（2026-03-20 23:22 +08:00）：

本次修订记录了一个关键纠偏：当前执行必须以远程最新 `origin/master@dcc1eeb` 为基线，而不是此前本地旧工作树。为避免丢失已有实验性改动，旧状态已保存到 `codex/local-backup-20260320`。在远程最新代码上重新盘点后，可以明确确认两件事：第一，`shadcn/Tailwind` 地基确实已经引入，但远未完成页面替换；第二，用户对“`UnoCSS` 和 `Arco` 都要全部移除”的要求必须被提升为显式验收项，而不是笼统写成“逐步迁移”。因此本轮把 `R-012`、`R-013`、`R-014` 的后续动作改写为“先替换公共层，再替换页面层，最后删除 `Arco + UnoCSS` 运行时与样式入口”的顺序，避免下一位执行者继续围绕旧工作树或局部页面做误判。
