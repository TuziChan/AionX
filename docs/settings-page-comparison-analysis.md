# AionX 与 AionUi 设置页多维度对比分析

## 1. 文档目标
本文档用于对 `AionX` 与 `AionUi` 的设置页实现进行完整、多维度对比，明确两者在架构、路由、布局、导航、扩展能力、页面内容、样式体系、状态管理、交互模式、复用策略、迁移完成度与后续演进方向上的差异。

文档的目标不是简单判断“谁更好”，而是回答三个核心问题：

1. `AionX` 当前设置页与 `AionUi` 到底差在哪里；
2. 这些差异属于“迁移未完成”还是“有意分叉”；
3. 如果后续要继续对齐或继续独立演进，分别应该从哪里下手。

---

## 2. 总体结论
从代码实现层面看，`AionX` 的设置页已经不再是 `AionUi` 设置页的直接页面化移植版本，而是一个**参考 `AionUi` 信息架构后，重新嵌入 `AionX` 主应用布局体系的新模块**。

可以用一句话概括：

> `AionUi` 的设置页本质上是“原有设置弹窗内容的 page 化封装”，而 `AionX` 的设置页本质上是“基于全局侧栏、嵌套路由和新页面组件重建的独立设置模块”。

因此，当前差异并不是单一文件差异，也不是单一组件漏迁移，而是**整套设置页职责划分已经变化**。

---

## 3. 对比维度总览
本次对比覆盖以下维度：

1. 产品定位与设计意图
2. 路由结构
3. 页面壳层与容器职责
4. 设置导航实现
5. 扩展设置支持能力
6. 页面内容复用策略
7. 数据流与状态管理
8. 交互行为与用户路径
9. 样式体系与响应式适配
10. 页面级功能差异
11. 代码组织与模块边界
12. 与 `AionUi` 一致性评估
13. 当前迁移状态判断
14. 风险与技术债
15. 后续演进建议

---

## 4. 产品定位与设计意图差异

### 4.1 AionUi 的设置页定位
`AionUi` 的设置页更像是“设置弹窗的页面模式延展”：

- 原有设置内容组件仍然存在；
- 页面只是换了一个承载壳；
- 页面模式和弹窗模式共享同一份核心内容逻辑；
- 重点在于复用成熟配置能力，而不是重新定义设置系统。

### 4.2 AionX 的设置页定位
`AionX` 的设置页更像是“应用中的一级功能模块”：

- 路由上被独立成 `features/settings`；
- 导航并入全局主侧栏；
- 页面内容不再只是复用旧 modal 内容，而是开始重写；
- 设置页已经成为主应用框架中的一部分，而不是弹窗系统的附属表现形态。

### 4.3 结论
两者的根本区别不在于 UI 长得像不像，而在于设置页在整个应用中的“角色”不同：

- `AionUi`：设置页是原系统能力的换皮外壳；
- `AionX`：设置页是新应用架构中的独立模块。

---

## 5. 路由结构对比

### 5.1 AionX 的路由组织
`AionX` 的设置路由定义在 `src/features/settings/routes.tsx`，采用标准嵌套路由结构：

- 父路径：`settings`
- 父 layout：`SettingsLayout`
- 子页面：
  - `gemini`
  - `model`
  - `agent`
  - `display`
  - `webui`
  - `system`
  - `tools`
  - `about`
  - `ext/:tabId`

特点：

- 设置页作为一个完整 feature module 存在；
- 页面壳层统一；
- 子页面通过 `<Outlet />` 进行承载；
- 路由级职责清晰，适合后续拓展模块内共享逻辑。

### 5.2 AionUi 的路由组织
`AionUi` 在 `src/renderer/router.tsx` 中逐条声明每个 `/settings/...` 路由，没有单独的 settings 父级 layout route：

- `/settings/gemini`
- `/settings/model`
- `/settings/agent`
- `/settings/display`
- `/settings/webui`
- `/settings/system`
- `/settings/tools`
- `/settings/about`
- `/settings/ext/:tabId`

每个页面组件内部自行包裹 `SettingsPageWrapper`。

### 5.3 路由层面的关键差异

#### AionUi
- 以“页面组件各自包壳”的方式实现；
- settings 的页面壳由页面内部负责；
- 复用逻辑依赖包装组件，而不是父路由。

#### AionX
- 以“父路由统一 layout”的方式实现；
- 页面壳由 feature module 级别统一提供；
- 更接近典型后台/主应用的模块化路由组织。

### 5.4 结论
如果把两边对齐来理解：

- `AionUi` 偏向“页面包装复用”
- `AionX` 偏向“路由级模块治理”

这种差异会直接影响后续所有职责划分，包括导航、上下文、滚动容器和页面共享状态。

---

## 6. 页面壳层与容器职责对比

### 6.1 AionX 的 `SettingsLayout`
当前 `AionX` 的 `src/features/settings/components/SettingsLayout.tsx` 只做了几件事：

- 提供 `SettingsViewModeProvider value="page"`；
- 渲染一个 `.settings-layout`；
- 渲染单列内容容器；
- 输出 `<Outlet />`。

它是一个**最小父容器**，不是完整页面框架。

### 6.2 AionUi 的 `SettingsPageWrapper`
`src/renderer/pages/settings/components/SettingsPageWrapper.tsx` 承担的是完整页面框架职责：

- 提供 `SettingsViewModeProvider`；
- 根据 `isMobile` 切换布局；
- 生成设置菜单项；
- 拉取扩展设置 tabs；
- 支持内置项与扩展项混排；
- 支持移动端顶部横向导航；
- 控制页面 padding、宽度和内容容器；
- 作为 page 模式的统一滚动承载层。

### 6.3 差异分析
`AionX` 当前的 `SettingsLayout` 与 `AionUi` 的 `SettingsPageWrapper` 不是一一对应关系。

更准确地说：

- `AionX.SettingsLayout` 只相当于 `AionUi.SettingsPageWrapper` 的“外层最小骨架”
- `AionUi.SettingsPageWrapper` 还包含了页面导航、扩展菜单生成和移动端导航等增强能力

### 6.4 结论
如果目标是把 `AionUi` 的 page wrapper 能力完整迁入 `AionX`，当前 `SettingsLayout` 明显还不完整；如果目标只是提供父级路由壳，那么当前实现是成立的。

---

## 7. 设置导航体系对比

### 7.1 AionUi 的导航模型
`AionUi` 的设置导航由两个层次构成：

#### 桌面端：`SettingsSider.tsx`
负责：

- 内置设置项生成；
- 扩展设置项加载；
- 扩展菜单插入排序；
- 图标渲染；
- tooltip 与 collapsed 行为；
- 监听扩展状态变更；
- 当前路由高亮。

#### 移动端：`SettingsPageWrapper.tsx`
负责：

- 顶部横向滚动导航；
- 当前项高亮；
- 页内快速切换。

### 7.2 AionX 的导航模型
`AionX` 没有 settings 专用侧栏组件，相关逻辑直接合并到 `src/components/layout/Sidebar.tsx`：

- 当路由命中 `/settings` 时，侧栏切换为 settings 模式；
- 使用静态数组 `settingsLinks` 渲染设置项；
- 通过全局主侧栏承载设置子页面切换；
- 页内不再维护专门的 settings 导航组件。

### 7.3 导航来源差异

#### AionUi
- 设置导航属于 settings 页面自身；
- settings 页面拥有自己的导航生命周期；
- settings 页面与主应用导航关系较松。

#### AionX
- 设置导航属于应用全局侧栏的一种状态；
- settings 页面导航直接接入主应用框架；
- settings 页面与主应用导航是强耦合关系。

### 7.4 能力差异

#### AionUi 拥有
- 扩展 tab 注入；
- before/after 锚点排序；
- 扩展图标；
- 扩展状态变化监听；
- settings 专用折叠动画；
- 移动端顶部页内导航。

#### AionX 当前缺少
- 动态扩展 tab 导航；
- 锚点排序；
- 扩展图标注入；
- 未发现与 `AionUi.SettingsSider` 对等的 settings 专用导航动画与交互实现；
- 移动端顶部 settings nav 当前未在页面实现中接入（样式层仍保留相关 class）。

### 7.5 结论
`AionX` 用统一的全局侧栏替代了 `AionUi` 的 settings 专用导航体系，带来了更统一的主应用体验，但牺牲了设置页自身的扩展性和页内导航能力。

---

## 8. 扩展设置能力对比

### 8.1 AionUi 的扩展设置能力
`AionUi` 对扩展设置的支持是完整的“设置页宿主能力”。

#### 导航层
- 调用 `extensionsIpc.getSettingsTabs.invoke()` 获取扩展设置页；
- 支持 `position.anchor` + `placement` 控制插入位置；
- 未锚定扩展项默认插入 `system` 前；
- 支持图标资源解析；
- 监听扩展状态变化并刷新菜单。

#### 页面层
`ExtensionSettingsPage.tsx` 不只是展示扩展信息，而是：

- 根据 `tabId` 查找扩展设置声明；
- 支持 `entryUrl` 渲染扩展 UI；
- 外部 URL 使用 `WebviewHost`；
- 内部 URL 使用 `iframe`；
- 注入 locale 和翻译数据；
- 处理消息桥接，如 snapshot 请求。

这意味着扩展开发者可以贡献一整块真正可运行的设置页面。

### 8.2 AionX 的扩展设置能力
`src/features/settings/pages/ExtensionSettings.tsx` 当前更像“扩展详情页”：

- 展示名称、版本、路径、描述、配置 JSON；
- 允许启用/禁用；
- 不承载扩展自定义 UI；
- 不支持 iframe/webview 宿主；
- 不参与主 settings 导航动态插入。

### 8.3 结论
这不是简单的“功能少一些”，而是能力模型根本不同：

- `AionUi`：扩展可以贡献 settings 页面；
- `AionX`：扩展只能展示元信息和开关。

如果未来 `AionX` 也要支持插件化设置页，这一块必须补足。

---

## 9. 页面内容复用策略对比

### 9.1 AionUi 的复用模式
`AionUi` 的多数 settings route 组件都非常薄：

- 页面组件只负责包 `SettingsPageWrapper`
- 真正的内容逻辑来自 `SettingsModal/contents/*`

示例模式：

- `GeminiSettings` -> `GeminiModalContent`
- `ModeSettings` -> `ModelModalContent`
- `AgentSettings` -> `AgentModalContent`
- `ToolsSettings` -> `ToolsModalContent`
- `About` -> `AboutModalContent`

这说明 `AionUi` 的 page 模式不是重新实现，而是**直接复用 modal 内容体系**。

### 9.2 AionX 的复用模式
`AionX` 当前 settings 页面更多是独立页面实现：

- `GeminiSettings.tsx`
- `ModelSettings.tsx`
- `AgentSettings.tsx`
- `ToolsSettings.tsx`
- `About.tsx`
- `ExtensionSettings.tsx`

它们并不是“包一层旧内容组件”，而是各自实现页面逻辑与界面结构。

### 9.3 差异的实际含义

#### AionUi 的优势
- 复用率高；
- 功能一致性强；
- modal/page 两种模式天然同步；
- 维护单一业务逻辑源。

#### AionX 的优势
- 可以脱离旧 modal 设计限制；
- 更容易做新的页面化视觉层级；
- 可针对 AionX 当前产品特性重新组织交互。

#### AionX 的代价
- 与 `AionUi` 内容一致性下降；
- 同步升级难度上升；
- 容易出现“结构想对齐、行为却不一致”的中间状态。

---

## 10. 数据流与状态管理对比

### 10.1 AionUi
页面内容与原系统能力深度耦合，常见模式包括：

- `ipcBridge`
- `ConfigStorage`
- `useSWR`
- Electron 相关桥接
- 统一外部能力调用
- modal/page 共享的状态视角

例如：

- Gemini 页面通过 `ipcBridge.googleAuth` 获取真实 Google 登录状态；
- Model 页面使用 `ipcBridge.mode`、SWR 和真实健康检查链路；
- Tools 页面通过一整套 MCP hooks 与 agent 同步机制操作真实状态。

### 10.2 AionX
当前更多使用：

- `getSetting/updateSetting`
- 本地 store / service
- 直接页面 state
- 更轻量但也更独立的业务实现

例如：

- Gemini 页面用本地 settings 保存；
- Google 登录当前只是 `window.prompt` 记录邮箱；
- Model 页面结构接近但健康检查行为是本地 mock。

### 10.3 差异结论
`AionUi` 更像在使用已有平台能力，`AionX` 更像在搭建自身设置业务层。

从工程角度看：

- `AionUi` 强在真实系统耦合与成熟性；
- `AionX` 强在可重构空间与独立性；
- 但在“功能真实度”与“与原实现一致性”上，`AionX` 当前还没完全追上。

---

## 11. 交互行为与用户路径对比

### 11.1 AionUi 的用户路径
用户进入 settings 页面后：

- 桌面端通过 settings 专用侧栏切换；
- 移动端通过页内顶部导航切换；
- 页面内容风格与 settings modal 一致；
- 页面像是“设置系统的另一种打开方式”。

### 11.2 AionX 的用户路径
用户进入 settings 页面后：

- 主应用侧栏直接切换成 settings 模式；
- 设置与聊天、其他功能共享同一套全局 navigation shell；
- 设置页更像应用主导航中的一级功能页；
- 返回聊天通过侧栏底部按钮完成。

### 11.3 差异分析
这意味着两个产品的用户心理模型不同：

- `AionUi`：进入设置像是在使用“独立设置空间”
- `AionX`：进入设置像是在主应用中切换到另一个一级功能模块

这也是为什么即使 tab 名称一致，整体体验仍明显不同。

---

## 12. 样式体系与响应式适配对比

### 12.1 AionUi 的样式特征
设置页相关样式主要位于 `src/renderer/styles/themes/base.css`，包括：

- `settings-mobile-top-nav`
- `settings-sider`
- `settings-sider__item`
- `settings-sider--collapsed`

样式重点是：

- 专用 settings 导航；
- collapsed 动画；
- 移动端顶部横向导航；
- 与原设置 modal 风格兼容的 page 容器。

### 12.2 AionX 的样式特征
设置页样式主要位于 `src/styles/app-shell.css`，重点包括：

- `settings-layout`
- `settings-layout__content`
- `settings-panel`
- 页面卡片、分栏、表单与内容区样式

而 settings 导航视觉则转移到全局 `Sidebar` 对应的样式系统中。

### 12.3 响应式差异

#### AionUi
- 移动端保留顶部 settings nav；
- 设置页有自己独立的移动交互策略。

#### AionX
- 更多依赖全局侧栏和容器 padding；
- settings 页面专属的移动端快速切换层当前未接入运行中的页面实现。

### 12.4 结论
`AionUi` 的样式系统服务于“设置专属页面壳”，`AionX` 的样式系统服务于“主应用统一页面容器”。两者背后的布局哲学不同。

---

## 13. 页面级功能差异

### 13.1 Gemini 页面

#### AionUi
- 真实 Google 登录状态检测；
- 账号级 `GOOGLE_CLOUD_PROJECT` 绑定；
- 自动保存；
- page/modal 双模式兼容；
- 使用统一滚动容器。

#### AionX
- 配置项较少；
- 使用本地 settings service；
- Google 登录流程当前偏占位；
- 页面更轻、更独立。

#### 评价
`AionX` 当前是“视觉上完成页面化，业务深度未完全对齐”。

### 13.2 Model 页面

#### AionUi
- 真实配置读写；
- 真正的健康检查链路；
- SWR 数据刷新；
- 更复杂的新增/编辑 modal 配套。

#### AionX
- UI 结构借鉴明显；
- 数据逻辑更本地化；
- 健康检查当前是 mock；
- 页面依赖更少，但功能真实性较弱。

### 13.3 Agent 页面

#### AionUi
- 复用 modal content；
- 更偏原有系统管理能力。

#### AionX
- 已明显偏向新的 “builtin/custom assistant” 管理模式；
- 更符合 AionX 当前产品语义；
- 与 AionUi 内容一致性已下降。

### 13.4 Tools 页面

#### AionUi
- MCP 管理完整；
- OAuth、连接测试、agent 同步、批量导入均存在；
- 是一个功能深度很高的系统页。

#### AionX
- 已经是重新组织后的 settings 页面；
- 如果目标是完全对齐 `AionUi`，此页需要逐项核对；
- 如果目标是独立演进，则应继续强化真实业务逻辑与生态能力。

### 13.5 About 页面

#### AionUi
- i18n 完整；
- Electron 场景判断；
- 更新流程事件桥接；
- 统一外链打开方式。

#### AionX
- 已切换为 AionX 品牌表达；
- “检查更新”按钮当前未绑定与 `AionUi` 对等的更新流程；
- 文案里有“保持与 AionUi 一致”的表述，但实现层面并未完全一致。

### 13.6 Extension 页面

#### AionUi
- 真正承载扩展设置 UI；
- 支持 webview/iframe；
- 支持 locale 注入与消息桥。

#### AionX
- 只是扩展信息管理页；
- 不承载扩展页面本身。

---

## 14. 代码组织与模块边界对比

### 14.1 AionUi
settings 页面主要散布于：

- `src/renderer/pages/settings/*`
- `src/renderer/components/SettingsModal/contents/*`
- settings 页面更像“页面入口 + 内容复用层”

边界特点：

- 页面壳与内容壳是分离的；
- route 文件本身较薄；
- 真正复杂逻辑仍在 modal 内容组件里。

### 14.2 AionX
settings 页面主要集中在：

- `src/features/settings/components/*`
- `src/features/settings/pages/*`
- `src/features/settings/routes.tsx`

边界特点：

- 更符合 feature-based 目录；
- 页面、组件、路由聚合清晰；
- 未来更适合独立维护设置模块；
- 但与 `AionUi` 的复用关系已经变弱。

### 14.3 结论
如果按工程治理角度看，`AionX` 的模块边界其实更现代、更清晰；但如果目标是最大程度继承 `AionUi`，这种边界重构会增加同步成本。

---

## 15. 与 AionUi 一致性评估

### 15.1 一致的部分
- tab 维度仍高度相似；
- 基本信息架构延续；
- 页面化设置方向一致；
- 部分 UI 卡片结构有参考痕迹；
- `SettingsViewModeProvider` 的概念被保留。

### 15.2 不一致的部分
- 路由壳层实现不同；
- settings 专用导航不同；
- 移动端 settings 导航能力不同；
- 扩展设置页能力严重不同；
- 页面内容大量重写；
- 数据流与后端桥接方式不同；
- 样式体系不同；
- 用户路径与主导航关系不同。

### 15.3 评估结论
如果按“栏目对齐”评估，`AionX` 与 `AionUi` 仍然相关；
如果按“实现与行为一致性”评估，当前已经不能算完整对齐。

---

## 16. 当前迁移状态判断

### 16.1 如果目标是“完整迁移 AionUi 设置页”
则当前明显未完成，主要证据包括：

1. `SettingsLayout` 没有承接 `SettingsPageWrapper` 的全部职责；
2. 当前未发现与 `SettingsSider` 对等的独立组件与动态导航能力；
3. 移动端顶部 settings nav 当前未在页面实现中接入；
4. 没有扩展 tab 动态注入；
5. 没有与 `AionUi` 等价的扩展设置宿主页面；
6. 多个页面内容已经偏离原 modal content。

### 16.2 如果目标是“重写一套 AionX 设置模块”
则当前已经处于重写中期：

- 路由架构已定型；
- 主导航融合已成型；
- 页面内容已开始独立演进；
- 只是部分功能深度和生态能力尚未补齐。

### 16.3 更准确的判断
当前最合理的判断是：

> `AionX` 不是“纯迁移未完成”，也不是“完全另起炉灶”，而是“以 AionUi 信息架构为参考，在新的应用骨架中重建设置系统”的中间态。

---

## 17. 当前最明显的缺口

### 17.1 导航能力缺口
- 没有扩展 tab 动态注入；
- 没有锚点排序；
- 没有 settings 专属导航组件；
- 没有移动端页内导航。

### 17.2 扩展生态缺口
- 没有 extension settings host；
- 不支持 iframe/webview 承载扩展设置页；
- 不支持 locale 注入与消息桥。

### 17.3 内容一致性缺口
- 多数页面已经不是 `AionUi` 原内容复用；
- 一些页面仍保留“对齐 AionUi”的文案目标，但实现已偏离；
- 若后续继续说“与 AionUi 保持一致”，将越来越难自证。

### 17.4 业务真实性缺口
- 部分交互仍偏占位；
- 部分系统能力尚未接入真实后端或桥接层；
- 页面功能完整度不均衡。

---

## 18. 风险与技术债分析

### 18.1 一致性风险
如果团队内部或外部仍默认 `AionX` 设置页与 `AionUi` 一致，那么实际行为差异会造成预期错位。

### 18.2 扩展能力风险
如果未来要支持插件/扩展自定义设置页，当前 `AionX` 的静态 settings 导航将需要较大改造。

### 18.3 维护成本风险
随着 `AionX` 页面内容继续独立演进，与 `AionUi` 的同步成本会快速上升，最终几乎无法低成本共享功能迭代。

### 18.4 用户体验风险
在移动端和扩展场景下，`AionX` 当前体验明显弱于 `AionUi`，尤其是 settings 快速切换和扩展设置承载能力。

### 18.5 文案与实现不一致风险
例如 About 页面中强调“保持与 AionUi 一致”，如果实现持续分叉，这类文案会变成误导。

---

## 19. 后续演进方向建议

### 19.1 路线 A：继续向 AionUi 对齐
适用于以下目标：

- 希望快速继承成熟设置体系；
- 希望扩展也能贡献设置页；
- 希望 page/modal 行为尽量统一；
- 希望减少重复实现。

建议优先级：

1. 补齐 settings 专用导航能力；
2. 引入扩展 tab 动态注入；
3. 补齐 extension settings host；
4. 逐页评估是否复用 `AionUi` 原内容；
5. 对移动端 settings 页内导航补齐；
6. 清理与“对齐”目标相冲突的自定义实现。

### 19.2 路线 B：坚持 AionX 独立演进
适用于以下目标：

- 设置页完全融入 AionX 主应用框架；
- 页面交互不再受旧 modal 内容约束；
- 功能与品牌表达按 AionX 重新定义。

建议优先级：

1. 明确不再追求与 `AionUi` 行为完全一致；
2. 将全局侧栏 settings 模式继续产品化；
3. 抽象动态 settings link 机制，至少为扩展预留入口；
4. 把当前占位逻辑替换为真实系统能力；
5. 统一 page 样式体系与交互语言；
6. 删除“保持与 AionUi 一致”但实际不成立的文案。

### 19.3 路线 C：折中方案
这是当前最现实的路线：

- 保留 `AionX` 的全局侧栏架构；
- 借鉴 `AionUi` 的扩展设置与移动端导航能力；
- 页面内容继续按 AionX 产品语义重写；
- 只在“结构能力”上对齐，不在“内容实现”上强行复用。

这条路线通常成本最低，也最符合当前代码现状。

---

## 20. 文件映射视角的对比摘要

### 20.1 核心壳层
- `AionX/src/features/settings/components/SettingsLayout.tsx`
- 对应 `AionUi/src/renderer/pages/settings/components/SettingsPageWrapper.tsx` 的一部分职责

### 20.2 设置导航
- `AionX/src/components/layout/Sidebar.tsx`
- 对应 `AionUi/src/renderer/pages/settings/SettingsSider.tsx`
- 但能力明显简化且职责位置不同

### 20.3 扩展设置页
- `AionX/src/features/settings/pages/ExtensionSettings.tsx`
- 对应 `AionUi/src/renderer/pages/settings/ExtensionSettingsPage.tsx`
- 两者产品能力不等价

### 20.4 各设置子页面
`AionUi` 多数 route 页只是包装层：

- `GeminiSettings` -> `GeminiModalContent`
- `ModeSettings` -> `ModelModalContent`
- `AgentSettings` -> `AgentModalContent`
- `ToolsSettings` -> `ToolsModalContent`
- `About` -> `AboutModalContent`

而 `AionX` 多数已是独立页面实现：

- `GeminiSettings.tsx`
- `ModelSettings.tsx`
- `AgentSettings.tsx`
- `ToolsSettings.tsx`
- `About.tsx`

---

## 21. 最终结论
从技术实现、页面结构和产品意图三个层面综合判断：

1. `AionX` 的设置页已经不是 `AionUi` 设置页的简单迁移版本；
2. 两者在路由壳、导航归属、扩展承载能力、页面内容复用策略上已经明显分叉；
3. 当前代码状态更像“在 `AionUi` 的信息架构基础上，重建一套适配 `AionX` 主应用框架的设置系统”；
4. 若未来仍要追求与 `AionUi` 的高度一致，需要补齐导航与扩展宿主能力，并重新评估页面内容复用策略；
5. 若未来要坚持独立演进，则应正式承认分叉，停止以“保持一致”为目标描述当前实现，并把缺失的真实能力逐步补齐。

最后用一句话归纳：

> `AionX` 当前的设置页不是“少迁了几个文件”，而是已经从“复用 AionUi 设置系统”走向了“重新定义 AionX 设置模块”的分叉阶段。
