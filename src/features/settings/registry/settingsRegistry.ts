import { SettingTwo } from '@icon-park/react';
import type { ComponentType } from 'react';

export type SettingsWidthPreset = 'narrow' | 'regular' | 'wide' | 'full';
export type SettingsLayoutMode = 'form-stack' | 'split-view' | 'tabbed' | 'host';

export interface SettingsRegistryItem {
  id: string;
  path: string;
  label: string;
  title: string;
  description: string;
  icon: ComponentType<Record<string, unknown>>;
  widthPreset: SettingsWidthPreset;
  layoutMode: SettingsLayoutMode;
  order: number;
  mobileVisible: boolean;
}

const settingsIcon = SettingTwo as ComponentType<Record<string, unknown>>;

const builtinSettingsTabs: SettingsRegistryItem[] = [
  {
    id: 'gemini',
    path: '/settings/gemini',
    label: 'Gemini',
    title: 'Gemini 连接设置',
    description: '配置模型接入方式、认证状态和默认行为。',
    icon: settingsIcon,
    widthPreset: 'regular',
    layoutMode: 'form-stack',
    order: 10,
    mobileVisible: true,
  },
  {
    id: 'model',
    path: '/settings/model',
    label: 'Model',
    title: '模型与平台',
    description: '统一管理模型平台、默认模型和展示规则。',
    icon: settingsIcon,
    widthPreset: 'wide',
    layoutMode: 'split-view',
    order: 20,
    mobileVisible: true,
  },
  {
    id: 'agent',
    path: '/settings/agent',
    label: 'Agent',
    title: 'Agent 管理',
    description: '控制默认 Agent、回退策略和自定义助手能力。',
    icon: settingsIcon,
    widthPreset: 'wide',
    layoutMode: 'split-view',
    order: 30,
    mobileVisible: true,
  },
  {
    id: 'display',
    path: '/settings/display',
    label: 'Display',
    title: '显示与主题',
    description: '统一明暗主题、缩放和界面展示偏好。',
    icon: settingsIcon,
    widthPreset: 'regular',
    layoutMode: 'form-stack',
    order: 40,
    mobileVisible: true,
  },
  {
    id: 'webui',
    path: '/settings/webui',
    label: 'WebUI',
    title: 'WebUI / 通道',
    description: '管理对外接入页、远程通道和嵌入式展示能力。',
    icon: settingsIcon,
    widthPreset: 'wide',
    layoutMode: 'tabbed',
    order: 50,
    mobileVisible: true,
  },
  {
    id: 'system',
    path: '/settings/system',
    label: 'System',
    title: '系统与工作区',
    description: '控制启动行为、工作区默认策略和日志级别。',
    icon: settingsIcon,
    widthPreset: 'regular',
    layoutMode: 'form-stack',
    order: 60,
    mobileVisible: true,
  },
  {
    id: 'tools',
    path: '/settings/tools',
    label: 'Tools',
    title: '工具与权限',
    description: '定义工具可见性、确认策略与工具栏排序。',
    icon: settingsIcon,
    widthPreset: 'wide',
    layoutMode: 'split-view',
    order: 70,
    mobileVisible: true,
  },
  {
    id: 'about',
    path: '/settings/about',
    label: 'About',
    title: '关于与版本',
    description: '展示版本信息、更新偏好与产品说明。',
    icon: settingsIcon,
    widthPreset: 'narrow',
    layoutMode: 'form-stack',
    order: 80,
    mobileVisible: true,
  },
];

export const settingsRegistry = [...builtinSettingsTabs].sort((left, right) => left.order - right.order);

export function getSettingsRegistry() {
  return settingsRegistry;
}

export function getMobileSettingsRegistry() {
  return settingsRegistry.filter((item) => item.mobileVisible);
}

export function getSettingsRegistryItemByPath(pathname: string): SettingsRegistryItem | null {
  const exactMatch = settingsRegistry.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (exactMatch) {
    return exactMatch;
  }

  if (pathname.startsWith('/settings/ext/')) {
    const tabId = pathname.replace('/settings/ext/', '').split('/')[0] || 'extension';
    return {
      id: `ext:${tabId}`,
      path: pathname,
      label: 'Extension',
      title: '扩展设置',
      description: `正在查看扩展设置页：${tabId}。`,
      icon: settingsIcon,
      widthPreset: 'full',
      layoutMode: 'host',
      order: 999,
      mobileVisible: false,
    };
  }

  return null;
}
