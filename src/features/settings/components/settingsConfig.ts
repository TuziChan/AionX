export interface SettingsTabDefinition {
  id: string;
  path: string;
  label: string;
  title: string;
  description: string;
}

export const settingsTabs: SettingsTabDefinition[] = [
  {
    id: 'gemini',
    path: '/settings/gemini',
    label: 'Gemini',
    title: 'Gemini 连接设置',
    description: '配置模型接入方式、认证状态和默认行为。',
  },
  {
    id: 'model',
    path: '/settings/model',
    label: 'Model',
    title: '模型与平台',
    description: '统一管理模型平台、默认模型和视觉中的展示名称。',
  },
  {
    id: 'agent',
    path: '/settings/agent',
    label: 'Agent',
    title: 'Agent 管理',
    description: '控制默认 Agent、回退策略和对话入口中的可选项。',
  },
  {
    id: 'tools',
    path: '/settings/tools',
    label: 'Tools',
    title: '工具与权限',
    description: '定义工具可见性、确认策略与工具栏排序。',
  },
  {
    id: 'display',
    path: '/settings/display',
    label: 'Display',
    title: '显示与主题',
    description: '统一明暗主题、缩放、间距与预览面板的视觉呈现。',
  },
  {
    id: 'webui',
    path: '/settings/webui',
    label: 'WebUI',
    title: 'WebUI / 通道',
    description: '管理对外接入页、远程通道以及嵌入式展示能力。',
  },
  {
    id: 'system',
    path: '/settings/system',
    label: 'System',
    title: '系统与工作区',
    description: '控制启动行为、工作区默认策略和日志级别。',
  },
  {
    id: 'about',
    path: '/settings/about',
    label: 'About',
    title: '关于与版本',
    description: '展示版本、计划范围与当前视觉对齐状态。',
  },
];

export function getSettingsTabById(tabId: string) {
  return settingsTabs.find((tab) => tab.id === tabId);
}
