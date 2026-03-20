import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChannelPlugin } from '@/bindings';
import {
  CHANNEL_PRESETS,
  EMPTY_CHANNEL_PLUGIN_FORM,
  getChannelSummary,
  getPresetLabel,
  parseChannelPluginForm,
} from '@/features/settings/api/webui';
import { notify } from '@/shared/lib';
import { Badge, Button, Input, Switch, Textarea } from '@/shared/ui';
import type { ChannelPluginFormValues, ChannelPluginType } from '../types';

interface ChannelsTabProps {
  plugins: ChannelPlugin[];
  savingPlugin: boolean;
  togglingPluginId: string | null;
  onSavePlugin: (values: ChannelPluginFormValues, editingPlugin?: ChannelPlugin | null) => Promise<void>;
  onTogglePlugin: (plugin: ChannelPlugin, enabled: boolean) => Promise<void>;
}

type ChannelDraftMap = Record<ChannelPluginType, ChannelPluginFormValues>;

type ChannelFieldDefinition =
  | { key: 'name' | 'defaultModel' | 'extraConfig'; label: string; placeholder: string; kind: 'text' | 'textarea' }
  | {
      key: 'botToken' | 'webhookUrl' | 'appId' | 'appSecret' | 'appKey' | 'signingSecret' | 'applicationId';
      label: string;
      placeholder: string;
      kind: 'text' | 'password';
    };

const CHANNEL_FIELD_MAP: Record<ChannelPluginType, ChannelFieldDefinition[]> = {
  telegram: [
    { key: 'name', label: '通道名称', placeholder: 'Telegram 通道', kind: 'text' },
    { key: 'botToken', label: 'Bot Token', placeholder: '123456:ABC-DEF...', kind: 'password' },
    { key: 'defaultModel', label: '默认模型', placeholder: '例如 gemini-2.5-pro', kind: 'text' },
    { key: 'webhookUrl', label: 'Webhook URL', placeholder: '可选，用于反向回调', kind: 'text' },
    { key: 'extraConfig', label: '额外配置 (JSON)', placeholder: '{\n  "chatId": "123456"\n}', kind: 'textarea' },
  ],
  lark: [
    { key: 'name', label: '通道名称', placeholder: 'Lark 通道', kind: 'text' },
    { key: 'appId', label: 'App ID', placeholder: 'cli_xxxxxxxx', kind: 'text' },
    { key: 'appSecret', label: 'App Secret', placeholder: '输入应用密钥', kind: 'password' },
    { key: 'defaultModel', label: '默认模型', placeholder: '例如 gemini-2.5-pro', kind: 'text' },
    { key: 'extraConfig', label: '额外配置 (JSON)', placeholder: '{\n  "verificationToken": ""\n}', kind: 'textarea' },
  ],
  dingtalk: [
    { key: 'name', label: '通道名称', placeholder: 'DingTalk 通道', kind: 'text' },
    { key: 'appKey', label: 'App Key', placeholder: 'dingxxxxxxxx', kind: 'text' },
    { key: 'appSecret', label: 'App Secret', placeholder: '输入应用密钥', kind: 'password' },
    { key: 'defaultModel', label: '默认模型', placeholder: '例如 gemini-2.5-pro', kind: 'text' },
    { key: 'extraConfig', label: '额外配置 (JSON)', placeholder: '{\n  "agentId": ""\n}', kind: 'textarea' },
  ],
  slack: [
    { key: 'name', label: '通道名称', placeholder: 'Slack 通道', kind: 'text' },
    { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...', kind: 'password' },
    { key: 'signingSecret', label: 'Signing Secret', placeholder: '输入签名密钥', kind: 'password' },
    { key: 'defaultModel', label: '默认模型', placeholder: '例如 gemini-2.5-pro', kind: 'text' },
    { key: 'extraConfig', label: '额外配置 (JSON)', placeholder: '{\n  "channel": ""\n}', kind: 'textarea' },
  ],
  discord: [
    { key: 'name', label: '通道名称', placeholder: 'Discord 通道', kind: 'text' },
    { key: 'botToken', label: 'Bot Token', placeholder: '输入 Bot Token', kind: 'password' },
    { key: 'applicationId', label: 'Application ID', placeholder: '输入应用 ID', kind: 'text' },
    { key: 'defaultModel', label: '默认模型', placeholder: '例如 gemini-2.5-pro', kind: 'text' },
    { key: 'extraConfig', label: '额外配置 (JSON)', placeholder: '{\n  "guildId": ""\n}', kind: 'textarea' },
  ],
};

function buildEmptyDraft(type: ChannelPluginType): ChannelPluginFormValues {
  return {
    ...EMPTY_CHANNEL_PLUGIN_FORM,
    type,
    name: `${getPresetLabel(type)} 通道`,
  };
}

function buildDraftMap(plugins: ChannelPlugin[]): ChannelDraftMap {
  return CHANNEL_PRESETS.reduce<ChannelDraftMap>((result, preset) => {
    const plugin = plugins.find((item) => item.type === preset.type);
    result[preset.type] = plugin ? parseChannelPluginForm(plugin) : buildEmptyDraft(preset.type);
    return result;
  }, {} as ChannelDraftMap);
}

function toFieldIdSegment(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

export function ChannelsTab({
  plugins,
  savingPlugin,
  togglingPluginId,
  onSavePlugin,
  onTogglePlugin,
}: ChannelsTabProps) {
  const [drafts, setDrafts] = useState<ChannelDraftMap>(() => buildDraftMap(plugins));
  const [expanded, setExpanded] = useState<Record<ChannelPluginType, boolean>>({
    telegram: true,
    lark: false,
    dingtalk: false,
    slack: false,
    discord: false,
  });

  useEffect(() => {
    setDrafts(buildDraftMap(plugins));
  }, [plugins]);

  const pluginMap = useMemo(
    () =>
      plugins.reduce<Record<string, ChannelPlugin>>((result, plugin) => {
        result[plugin.type] = plugin;
        return result;
      }, {}),
    [plugins],
  );

  const updateDraft = <TKey extends keyof ChannelPluginFormValues>(
    type: ChannelPluginType,
    key: TKey,
    value: ChannelPluginFormValues[TKey],
  ) => {
    setDrafts((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [key]: value,
      },
    }));
  };

  const handleSave = async (type: ChannelPluginType) => {
    const draft = drafts[type];
    const plugin = pluginMap[type] ?? null;
    await onSavePlugin(draft, plugin);
  };

  const handleToggle = async (type: ChannelPluginType, enabled: boolean) => {
    const plugin = pluginMap[type];
    if (!plugin) {
      notify.warning('请先保存该通道的基础配置，再启用通道');
      return;
    }

    setDrafts((current) => ({
      ...current,
      [type]: {
        ...current[type],
        enabled,
      },
    }));
    await onTogglePlugin(plugin, enabled);
  };

  return (
    <div className="settings-webui-page__channels" data-testid="webui-channels-tab">
      <div className="settings-webui-page__intro">
        <div className="settings-webui-page__panel-title">Channels</div>
        <div className="settings-webui-page__panel-description">
          把常用 IM 通道收敛成与 AionUi 一致的折叠卡片节奏，先保存凭证与默认模型，再按需启用对应通道。
        </div>
        <div className="settings-webui-page__guide">
          <span className="settings-webui-page__guide-step">1. 选择要接入的通道并填写凭证。</span>
          <span className="settings-webui-page__guide-step">2. 保存配置后启用通道，并把入口分发给外部用户。</span>
        </div>
      </div>

      <div className="settings-webui-page__channel-list">
        {CHANNEL_PRESETS.map((preset) => {
          const plugin = pluginMap[preset.type] ?? null;
          const draft = drafts[preset.type] ?? buildEmptyDraft(preset.type);
          const summary = plugin ? getChannelSummary(plugin) : [];
          const fields = CHANNEL_FIELD_MAP[preset.type];

          return (
            <section key={preset.type} className="settings-group-card settings-webui-page__channel-panel">
              <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded[preset.type]}
                className="settings-webui-page__channel-header settings-webui-page__channel-header-button"
                data-testid={`webui-channel-card-${preset.type}`}
                onClick={() =>
                  setExpanded((current) => ({
                    ...current,
                    [preset.type]: !current[preset.type],
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setExpanded((current) => ({
                      ...current,
                      [preset.type]: !current[preset.type],
                    }));
                  }
                }}
              >
                <div className="settings-webui-page__channel-main">
                  <div className="settings-group-card__title">{preset.label}</div>
                  <div className="settings-webui-page__channel-name">
                    {plugin?.name ?? `${preset.label} 通道尚未保存`}
                  </div>
                  <div className="settings-webui-page__channel-meta">
                    <span>{plugin ? plugin.status : '未配置'}</span>
                    {summary.length > 0 ? <span>{summary.join(' / ')}</span> : <span>{preset.description}</span>}
                  </div>
                </div>

                <div className="settings-webui-page__channel-status">
                  <Badge variant={plugin?.enabled ? 'default' : plugin ? 'outline' : 'info'}>
                    {plugin?.enabled ? '已启用' : plugin ? '已保存' : '待配置'}
                  </Badge>
                  <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                    <Switch
                      checked={Boolean(plugin?.enabled)}
                      disabled={!plugin || togglingPluginId === plugin?.id}
                      onCheckedChange={(value) => void handleToggle(preset.type, value)}
                    />
                  </div>
                </div>
              </div>

              {expanded[preset.type] ? (
                <div
                  className="settings-webui-page__channel-body"
                  data-testid={`webui-channel-body-${preset.type}`}
                >
                  <div className="settings-webui-page__channel-form-grid">
                    {fields.map((field) => {
                      const value = draft[field.key];
                      const inputId = `webui-channel-${toFieldIdSegment(field.key)}-${preset.type}`;

                      return (
                        <label key={field.key} className="settings-webui-page__channel-field">
                          <span className="settings-webui-page__channel-field-label">{field.label}</span>
                          {field.kind === 'textarea' ? (
                            <Textarea
                              id={inputId}
                              className="min-h-24"
                              value={String(value ?? '')}
                              placeholder={field.placeholder}
                              onChange={(event) => updateDraft(preset.type, field.key, event.target.value)}
                            />
                          ) : field.kind === 'password' ? (
                            <Input
                              id={inputId}
                              type="password"
                              value={String(value ?? '')}
                              placeholder={field.placeholder}
                              onChange={(event) => updateDraft(preset.type, field.key, event.target.value)}
                            />
                          ) : (
                            <Input
                              id={inputId}
                              value={String(value ?? '')}
                              placeholder={field.placeholder}
                              onChange={(event) => updateDraft(preset.type, field.key, event.target.value)}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <div className="settings-webui-page__channel-footer">
                    <div className="settings-webui-page__channel-hint">
                      {plugin ? '保存后会更新当前通道配置，启停状态保持不变。' : '首次保存会创建该通道实例，随后才可以启用。'}
                    </div>
                    <Button
                      type="button"
                      disabled={savingPlugin}
                      data-testid={`webui-channel-save-${preset.type}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleSave(preset.type);
                      }}
                    >
                      {savingPlugin ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                      {plugin ? '保存通道配置' : '保存并创建通道'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
