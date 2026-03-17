import { CompassOne } from '@icon-park/react';
import type { ComponentType } from 'react';
import type { ExtensionSettingsTab } from '../pages/extension/types';
import type { SettingsRegistryItem } from './settingsRegistry';

const extensionIcon = CompassOne as ComponentType<Record<string, unknown>>;

export function buildExtensionSettingsRegistryItems(tabs: ExtensionSettingsTab[]): SettingsRegistryItem[] {
  return tabs.map((tab, index) => ({
    id: `ext:${tab.tabId}`,
    path: `/settings/ext/${tab.tabId}`,
    label: tab.name,
    title: `${tab.name} 设置`,
    description: tab.host
      ? '该扩展提供独立设置页面，当前以宿主页方式嵌入设置工作区。'
      : '该扩展暂未提供可嵌入设置页，当前展示元信息与启用状态作为回退页。',
    icon: extensionIcon,
    widthPreset: 'full',
    layoutMode: 'host',
    order: 59 + index / 100,
    mobileVisible: false,
  }));
}
