import { Card, Input, Select, Slider, Switch, Tag } from '@arco-design/web-react';
import { getSettingsTabById } from './settingsConfig';

function buildSections(tabId: string) {
  switch (tabId) {
    case 'gemini':
      return [
        {
          title: '认证与接入',
          fields: [
            { label: 'API Key', value: 'AIzaSy***demo', type: 'input' as const },
            { label: '区域', value: 'global', type: 'select' as const, options: ['global', 'us', 'asia'] },
            { label: '启用 Google Auth', value: true, type: 'switch' as const },
          ],
        },
        {
          title: '默认模型',
          fields: [
            { label: 'Primary', value: 'gemini-2.5-pro', type: 'select' as const, options: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
            { label: '视觉温度', value: 42, type: 'slider' as const },
          ],
        },
      ];
    case 'model':
      return [
        {
          title: '平台清单',
          fields: [
            { label: '默认平台', value: 'OpenAI Compatible', type: 'select' as const, options: ['OpenAI Compatible', 'Gemini', 'Anthropic'] },
            { label: '模型展示名', value: 'GPT-5 Codex', type: 'input' as const },
            { label: '启用平台分组', value: true, type: 'switch' as const },
          ],
        },
        {
          title: '列表行为',
          fields: [
            { label: '排序权重', value: 70, type: 'slider' as const },
            { label: '显示上下文长度', value: true, type: 'switch' as const },
          ],
        },
      ];
    case 'agent':
      return [
        {
          title: '默认入口',
          fields: [
            { label: 'Guide 默认 Agent', value: 'Claude Code', type: 'select' as const, options: ['Claude Code', 'Codex', 'Gemini'] },
            { label: '显示预设助手', value: true, type: 'switch' as const },
            { label: '回退策略', value: '优先可用 Agent', type: 'input' as const },
          ],
        },
        {
          title: '行为偏好',
          fields: [
            { label: '自动补全工作区', value: true, type: 'switch' as const },
            { label: 'Agent Pill 动效', value: 78, type: 'slider' as const },
          ],
        },
      ];
    case 'tools':
      return [
        {
          title: '权限策略',
          fields: [
            { label: '危险工具二次确认', value: true, type: 'switch' as const },
            { label: '默认权限级别', value: 'workspace-write', type: 'select' as const, options: ['read-only', 'workspace-write', 'full-access'] },
            { label: '显示工具摘要', value: true, type: 'switch' as const },
          ],
        },
        {
          title: '工具栏',
          fields: [
            { label: '默认工具提示', value: '展示最近 3 个高频工具', type: 'input' as const },
            { label: '工具栏紧凑度', value: 58, type: 'slider' as const },
          ],
        },
      ];
    case 'display':
      return [
        {
          title: '主题与密度',
          fields: [
            { label: '主题模式', value: 'Follow app theme', type: 'select' as const, options: ['Light', 'Dark', 'Follow app theme'] },
            { label: '字体缩放', value: 64, type: 'slider' as const },
            { label: '启用沉浸标题栏', value: true, type: 'switch' as const },
          ],
        },
        {
          title: '预览与边栏',
          fields: [
            { label: '默认打开 workspace', value: false, type: 'switch' as const },
            { label: '滚动条显隐', value: 'Hover reveal', type: 'select' as const, options: ['Always', 'Hover reveal', 'Hidden'] },
          ],
        },
      ];
    case 'webui':
      return [
        {
          title: '可见入口',
          fields: [
            { label: 'WebUI Path', value: '/preview', type: 'input' as const },
            { label: '默认展示通道', value: 'Desktop Panel', type: 'select' as const, options: ['Desktop Panel', 'Embedded Browser', 'Remote'] },
            { label: '启用嵌入预览', value: true, type: 'switch' as const },
          ],
        },
        {
          title: '联动规则',
          fields: [
            { label: '同步 conversation preview', value: true, type: 'switch' as const },
            { label: '会话外链白名单', value: 'localhost, 127.0.0.1', type: 'input' as const },
          ],
        },
      ];
    case 'system':
      return [
        {
          title: '工作区默认值',
          fields: [
            { label: '默认工作区', value: 'F:/Work/AionX', type: 'input' as const },
            { label: '启动打开 Guide', value: true, type: 'switch' as const },
            { label: '日志级别', value: 'info', type: 'select' as const, options: ['error', 'warn', 'info', 'debug'] },
          ],
        },
        {
          title: '运行时',
          fields: [
            { label: '启用窗口保留状态', value: true, type: 'switch' as const },
            { label: '最大后台任务数', value: 35, type: 'slider' as const },
          ],
        },
      ];
    case 'about':
      return [
        {
          title: '版本信息',
          fields: [
            { label: 'App Version', value: '0.1.0-alpha', type: 'input' as const },
            { label: '视觉目标源', value: 'F:/Work/AionUi/src/renderer', type: 'input' as const },
            { label: '截图基线状态', value: '待运行环境恢复后执行', type: 'input' as const },
          ],
        },
        {
          title: '当前范围',
          fields: [
            { label: '计划覆盖', value: 'Login / Guid / Conversation / Cron / Settings / Components', type: 'input' as const },
            { label: '扩展设置入口', value: true, type: 'switch' as const },
          ],
        },
      ];
    default:
      return [
        {
          title: '扩展配置',
          fields: [
            { label: 'Tab ID', value: tabId, type: 'input' as const },
            { label: '挂载状态', value: true, type: 'switch' as const },
            { label: '渲染模式', value: 'embedded', type: 'select' as const, options: ['embedded', 'iframe', 'native'] },
          ],
        },
      ];
  }
}

export function SettingsContent({ tabId }: { tabId: string }) {
  const tab = getSettingsTabById(tabId);
  const sections = buildSections(tabId);

  return (
    <div className="settings-page">
      <div className="settings-page__hero">
        <div>
          <p className="settings-page__eyebrow">{tab ? tab.label : 'Extension'}</p>
          <h1 className="settings-page__title">{tab ? tab.title : `扩展设置 · ${tabId}`}</h1>
          <p className="settings-page__subtitle">
            {tab ? tab.description : '扩展设置页已预留和内置页同级的视觉包裹层。'}
          </p>
        </div>
        <Tag color="blue">{tab ? 'Built-in Tab' : 'Extension Tab'}</Tag>
      </div>

      <div className="settings-page__grid">
        {sections.map((section) => (
          <Card key={section.title} className="settings-card" bordered={false}>
            <div className="settings-card__header">
              <h2>{section.title}</h2>
            </div>
            <div className="settings-card__body">
              {section.fields.map((field) => (
                <div key={field.label} className="settings-field">
                  <div className="settings-field__meta">
                    <div className="settings-field__label">{field.label}</div>
                  </div>
                  <div className="settings-field__control">
                    {field.type === 'input' && <Input value={String(field.value)} readOnly />}
                    {field.type === 'select' && (
                      <Select
                        disabled
                        value={String(field.value)}
                        options={(field.options || []).map((option) => ({ label: option, value: option }))}
                      />
                    )}
                    {field.type === 'switch' && <Switch checked={Boolean(field.value)} disabled />}
                    {field.type === 'slider' && <Slider value={Number(field.value)} disabled />}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
