# AionX 前端与 AionUi 截图级一致化计划

## Summary
以 `F:\Work\AionUi\src\renderer` 作为唯一视觉规格源，覆盖全部可见页面与公共组件，在 `AionX` 中重建同等视觉结果，允许实现方式不同，但最终以固定分辨率截图对拍为验收标准。
本次计划不包含修复本地 `node/cmd/git-bash` 运行环境；实现和验收设计按可运行环境恢复后执行。

## Key Changes
- 统一视觉基础层：
  将 `AionUi` 的主题变量、`arco-override.css`、基础布局样式、标题栏/侧栏/滚动条/移动端适配规则完整映射到 `AionX` 的样式体系，禁止继续使用当前 `AionX` 的简化版 `base.css`、标题栏和侧栏样式作为最终视觉来源。
- 重建应用壳层：
  按 `AionUi` 的 `layout + sider + titlebar + router` 结构重做 `AionX` 外壳，包含桌面/移动端标题栏行为、侧栏折叠状态、设置态切换、移动端遮罩、工作区入口、统一 header 高度与间距。
- 页面级一对一对齐：
  将 `Guide`、`Conversation`、`Cron`、`Settings`、`Login`、`Components/Test` 全部纳入；其中 `Conversation` 需要补齐 `ChatLayout`、会话 Tabs、Header、Workspace 面板、Preview 面板、发送区与消息区容器关系；`Settings` 需要补齐 `SettingsSider`、页面包裹层、扩展设置页占位与内置页顺序；`Guide` 需要从当前占位页升级为与 `AionUi` 同结构的输入卡、Agent pill、快捷动作、模型选择区。
- 组件与视觉规则对齐：
  以 `AionUi` 中可见组件为准，对齐按钮、Tag、Tooltip、Modal、Message、输入框、列表项、工作区树、发送区工具栏、移动端顶部导航、设置项选中态、聊天历史项动效和折叠态；允许内部状态管理不同，但 DOM 结构和类语义要支持同等样式效果。
- 路由与可见页面补齐：
  `AionX` 需要补上 `login`、`settings/ext/:tabId`、`test/components` 等可见页面入口；现有 `/chat/:id` 默认改为兼容 `AionUi` 的 `/conversation/:id` 视觉页，必要时保留旧路由跳转别名，避免后续视觉实现反复分叉。

## Public APIs / Interfaces
- 路由层新增或调整为：
  `/login`、`/guid`、`/conversation/:id`、`/settings/gemini|model|agent|tools|display|webui|system|about|ext/:tabId`、`/test/components`。
- 布局上下文至少提供：
  `isMobile`、`siderCollapsed`、`setSiderCollapsed`，并支持会话页右侧 workspace/preview 的独立折叠与宽度状态。
- 主题与样式输入统一为：
  全局 CSS 变量、Arco override、主题切换状态、可注入自定义 CSS 的占位接口；禁止页面各自定义一套颜色和尺寸常量。

## Test Plan
- 固定 3 组视口做截图对拍：
  桌面宽屏、桌面窄屏、移动端。
- 对拍页面至少包含：
  登录页、Guide 页、Conversation 页的默认态/有消息态/预览打开态/工作区打开态、Cron 页、各 Settings 主 tab、扩展 Settings tab、组件展示页。
- 对拍内容同时检查：
  颜色、间距、边框、圆角、字体层级、阴影、滚动条、折叠态、hover/selected/disabled 状态、移动端遮罩与安全区。
- 在运行环境恢复后补充：
  自动截图基线与差异阈值；未通过截图对拍的页面不得视为完成。

## Assumptions
- `AionUi` 当前 `src/renderer` 代码与样式就是目标视觉基线，不再额外引入新的设计稿。
- 本次范围是“全部可见页面”，即便某些页在 `AionX` 里目前不存在，也要补到可展示并视觉一致。
- 本次不处理本地执行环境故障；若后续仍无法启动前端，验收只能先停留在代码级准备，不能宣称完成截图级一致。
- 业务实现、数据来源、状态管理可以不同，但任何影响视觉结果的结构差异都不允许保留。
