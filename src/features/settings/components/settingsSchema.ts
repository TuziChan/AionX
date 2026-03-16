export type SettingsFieldType = 'input' | 'select' | 'switch' | 'slider';

export interface SettingsFieldDefinition {
  label: string;
  value: string | number | boolean;
  type: SettingsFieldType;
  options?: string[];
}

export interface SettingsSectionDefinition {
  title: string;
  fields: SettingsFieldDefinition[];
}

export const settingsSchema: Record<string, SettingsSectionDefinition[]> = {
  gemini: [
    {
      title: '认证与接入',
      fields: [
        { label: 'API Key', value: 'AIzaSy***demo', type: 'input' },
        { label: '区域', value: 'global', type: 'select', options: ['global', 'us', 'asia'] },
        { label: '启用 Google Auth', value: true, type: 'switch' },
      ],
    },
    {
      title: '默认模型',
      fields: [
        { label: 'Primary', value: 'gemini-2.5-pro', type: 'select', options: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
        { label: '视觉温度', value: 42, type: 'slider' },
      ],
    },
  ],
  model: [
    {
      title: '平台清单',
      fields: [
        { label: '默认平台', value: 'OpenAI Compatible', type: 'select', options: ['OpenAI Compatible', 'Gemini', 'Anthropic'] },
        { label: '模型展示名', value: 'GPT-5 Codex', type: 'input' },
        { label: '启用平台分组', value: true, type: 'switch' },
      ],
    },
    {
      title: '列表行为',
      fields: [
        { label: '排序权重', value: 70, type: 'slider' },
        { label: '显示上下文长度', value: true, type: 'switch' },
      ],
    },
  ],
  agent: [
    {
      title: '默认入口',
      fields: [
        { label: 'Guide 默认 Agent', value: 'Claude Code', type: 'select', options: ['Claude Code', 'Codex', 'Gemini'] },
        { label: '显示预设助手', value: true, type: 'switch' },
        { label: '回退策略', value: '优先可用 Agent', type: 'input' },
      ],
    },
    {
      title: '行为偏好',
      fields: [
        { label: '自动补全工作区', value: true, type: 'switch' },
        { label: 'Agent Pill 动效', value: 78, type: 'slider' },
      ],
    },
  ],
  tools: [
    {
      title: '权限策略',
      fields: [
        { label: '危险工具二次确认', value: true, type: 'switch' },
        { label: '默认权限级别', value: 'workspace-write', type: 'select', options: ['read-only', 'workspace-write', 'full-access'] },
        { label: '显示工具摘要', value: true, type: 'switch' },
      ],
    },
    {
      title: '工具栏',
      fields: [
        { label: '默认工具提示', value: '展示最近 3 个高频工具', type: 'input' },
        { label: '工具栏紧凑度', value: 58, type: 'slider' },
      ],
    },
  ],
  display: [
    {
      title: '主题与密度',
      fields: [
        { label: '主题模式', value: 'Follow app theme', type: 'select', options: ['Light', 'Dark', 'Follow app theme'] },
        { label: '字体缩放', value: 64, type: 'slider' },
        { label: '启用沉浸标题栏', value: true, type: 'switch' },
      ],
    },
    {
      title: '预览与边栏',
      fields: [
        { label: '默认打开 workspace', value: false, type: 'switch' },
        { label: '滚动条显隐', value: 'Hover reveal', type: 'select', options: ['Always', 'Hover reveal', 'Hidden'] },
      ],
    },
  ],
  webui: [
    {
      title: '可见入口',
      fields: [
        { label: 'WebUI Path', value: '/preview', type: 'input' },
        { label: '默认展示通道', value: 'Desktop Panel', type: 'select', options: ['Desktop Panel', 'Embedded Browser', 'Remote'] },
        { label: '启用嵌入预览', value: true, type: 'switch' },
      ],
    },
    {
      title: '联动规则',
      fields: [
        { label: '同步 conversation preview', value: true, type: 'switch' },
        { label: '会话外链白名单', value: 'localhost, 127.0.0.1', type: 'input' },
      ],
    },
  ],
  system: [
    {
      title: '工作区默认值',
      fields: [
        { label: '默认工作区', value: 'F:/Work/AionX', type: 'input' },
        { label: '启动打开 Guide', value: true, type: 'switch' },
        { label: '日志级别', value: 'info', type: 'select', options: ['error', 'warn', 'info', 'debug'] },
      ],
    },
    {
      title: '运行时',
      fields: [
        { label: '启用窗口保留状态', value: true, type: 'switch' },
        { label: '最大后台任务数', value: 35, type: 'slider' },
      ],
    },
  ],
  about: [
    {
      title: '版本信息',
      fields: [
        { label: 'App Version', value: '0.1.0-alpha', type: 'input' },
        { label: '视觉目标源', value: 'F:/Work/AionUi/src/renderer', type: 'input' },
        { label: '截图基线状态', value: '待运行环境恢复后执行', type: 'input' },
      ],
    },
    {
      title: '当前范围',
      fields: [
        { label: '计划覆盖', value: 'Login / Guid / Conversation / Cron / Settings / Components', type: 'input' },
        { label: '扩展设置入口', value: true, type: 'switch' },
      ],
    },
  ],
};

export function getSettingsSections(tabId: string): SettingsSectionDefinition[] {
  return settingsSchema[tabId] ?? [
    {
      title: '扩展配置',
      fields: [
        { label: 'Tab ID', value: tabId, type: 'input' },
        { label: '挂载状态', value: true, type: 'switch' },
        { label: '渲染模式', value: 'embedded', type: 'select', options: ['embedded', 'iframe', 'native'] },
      ],
    },
  ];
}
