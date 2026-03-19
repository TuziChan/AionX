import type { LucideIcon } from 'lucide-react';
import { Clock3, Compass, FlaskConical, Settings2 } from 'lucide-react';
import { getSettingsRegistryItemByPath } from '@/features/settings/registry/settingsRegistry';

export interface AppSidebarLink {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

export interface AppShellMeta {
  section: string;
  title: string;
  description: string;
}

export const APP_SIDEBAR_LINKS: AppSidebarLink[] = [
  {
    id: 'guid',
    label: '工作台',
    description: '创建新会话并选择当前任务入口。',
    path: '/guid',
    icon: Compass,
  },
  {
    id: 'cron',
    label: '自动化',
    description: '查看和管理定时任务。',
    path: '/cron',
    icon: Clock3,
  },
  {
    id: 'components',
    label: '组件',
    description: '核查设计系统组件基线。',
    path: '/test/components',
    icon: FlaskConical,
  },
  {
    id: 'settings',
    label: '设置',
    description: '统一管理模型、工具和系统配置。',
    path: '/settings/gemini',
    icon: Settings2,
  },
];

export function getAppShellMeta(pathname: string): AppShellMeta {
  const settingsItem = getSettingsRegistryItemByPath(pathname);
  if (settingsItem) {
    return {
      section: 'Settings',
      title: settingsItem.label,
      description: settingsItem.description,
    };
  }

  if (pathname.startsWith('/conversation/')) {
    return {
      section: 'Conversation',
      title: '对话工作区',
      description: '在统一工作台内查看消息、预览和工作区侧栏。',
    };
  }

  if (pathname.startsWith('/cron')) {
    return {
      section: 'Automation',
      title: '定时任务',
      description: '统一管理计划任务、执行状态和调度动作。',
    };
  }

  if (pathname.startsWith('/test/components')) {
    return {
      section: 'Showcase',
      title: '组件基线',
      description: '检查共享组件在真实主题中的表现。',
    };
  }

  return {
    section: 'Workspace',
    title: '引导工作台',
    description: '从统一入口发起新的对话与任务流。',
  };
}
