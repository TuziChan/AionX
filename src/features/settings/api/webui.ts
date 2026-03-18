import { invoke } from '@tauri-apps/api/core';
import type { ChannelPlugin, WebUiInfo, WebUiStatus } from '@/bindings';
import type { ChannelPluginFormValues, ChannelPluginType, WebuiSettingsDraft } from '../pages/webui/types';

export const DEFAULT_WEBUI_SETTINGS: WebuiSettingsDraft = {
  enabled: false,
  port: 9527,
  remote: false,
};

export const CHANNEL_PRESETS: Array<{
  type: ChannelPluginType;
  label: string;
  description: string;
}> = [
  { type: 'telegram', label: 'Telegram', description: 'Bot Token、默认模型和 webhook 地址。' },
  { type: 'lark', label: 'Lark', description: 'App ID、App Secret 与默认模型。' },
  { type: 'dingtalk', label: 'DingTalk', description: '企业机器人 Key/Secret 与默认模型。' },
  { type: 'slack', label: 'Slack', description: 'Bot Token、Signing Secret 与默认模型。' },
  { type: 'discord', label: 'Discord', description: 'Bot Token、Application ID 与默认模型。' },
];

export const EMPTY_CHANNEL_PLUGIN_FORM: ChannelPluginFormValues = {
  type: 'telegram',
  name: '',
  enabled: true,
  botToken: '',
  defaultModel: '',
  webhookUrl: '',
  appId: '',
  appSecret: '',
  appKey: '',
  signingSecret: '',
  applicationId: '',
  extraConfig: '{}',
};

type ChannelConfigObject = Record<string, string>;

export async function getWebuiSettings(): Promise<WebuiSettingsDraft> {
  const result = await invoke<{ enabled: boolean; port: number; remote: boolean }>('get_webui_settings');
  return normalizeWebuiSettings(result);
}

export async function saveWebuiSettings(settings: WebuiSettingsDraft): Promise<WebuiSettingsDraft> {
  const result = await invoke<{ enabled: boolean; port: number; remote: boolean }>('save_webui_settings', {
    settings: normalizeWebuiSettings(settings),
  });

  return normalizeWebuiSettings(result);
}

export async function getWebuiStatus(): Promise<WebUiStatus> {
  return invoke<WebUiStatus>('get_webui_status');
}

export async function startWebuiServer(settings: WebuiSettingsDraft): Promise<WebUiInfo> {
  return invoke<WebUiInfo>('start_webui', {
    port: settings.port,
    remote: settings.remote,
  });
}

export async function stopWebuiServer(): Promise<void> {
  await invoke('stop_webui');
}

export async function changeWebuiPassword(newPassword: string): Promise<void> {
  await invoke('change_webui_password', {
    newPassword,
  });
}

export async function resetWebuiPassword(): Promise<string> {
  const result = await invoke<{ password: string }>('reset_webui_password');
  return result.password;
}

export async function listChannelPlugins(): Promise<ChannelPlugin[]> {
  return invoke<ChannelPlugin[]>('list_channel_plugins');
}

export async function createChannelPlugin(values: ChannelPluginFormValues): Promise<ChannelPlugin> {
  const config = buildChannelPluginConfig(values);
  await validateChannelPluginConfig(values.type, config);
  return invoke<ChannelPlugin>('create_channel_plugin', {
    input: {
      type: values.type,
      name: values.name.trim(),
      config,
    },
  });
}

export async function updateChannelPlugin(pluginId: string, values: ChannelPluginFormValues): Promise<void> {
  const config = buildChannelPluginConfig(values);
  await validateChannelPluginConfig(values.type, config);
  await invoke('update_channel_plugin', {
    id: pluginId,
    updates: {
      name: values.name.trim(),
      enabled: values.enabled,
      config,
      status: values.enabled ? 'active' : 'disabled',
    },
  });
}

export async function deleteChannelPlugin(pluginId: string): Promise<void> {
  await invoke('delete_channel_plugin', {
    id: pluginId,
  });
}

export async function toggleChannelPlugin(plugin: ChannelPlugin, enabled: boolean): Promise<void> {
  await invoke('update_channel_plugin', {
    id: plugin.id,
    updates: {
      name: plugin.name,
      enabled,
      config: plugin.config ?? '{}',
      status: enabled ? 'active' : 'disabled',
    },
  });
}

export async function validateChannelPluginConfig(type: ChannelPluginType, config: string): Promise<void> {
  await invoke('validate_channel_plugin_config', {
    pluginType: type,
    config,
  });
}

export function normalizeWebuiSettings(settings: Partial<WebuiSettingsDraft>): WebuiSettingsDraft {
  const nextPort = Number(settings.port);
  return {
    enabled: Boolean(settings.enabled),
    port: Number.isFinite(nextPort) && nextPort > 0 ? Math.round(nextPort) : 9527,
    remote: Boolean(settings.remote),
  };
}

export function getWebuiAccessUrl(status: WebUiStatus | null, settings: WebuiSettingsDraft): string {
  const port = status?.port ?? settings.port;
  const host = status?.running && status.remote ? '0.0.0.0' : '127.0.0.1';
  return `http://${host}:${port}`;
}

export function parseChannelPluginForm(plugin?: ChannelPlugin | null): ChannelPluginFormValues {
  if (!plugin) {
    return {
      ...EMPTY_CHANNEL_PLUGIN_FORM,
      name: 'Telegram 通道',
    };
  }

  const pluginType = normalizeChannelType(plugin.type);
  const config = safeParseConfig(plugin.config);
  const knownKeys = getKnownKeys(pluginType);
  const extraConfigObject = Object.fromEntries(Object.entries(config).filter(([key]) => !knownKeys.includes(key)));

  return {
    type: pluginType,
    name: plugin.name,
    enabled: plugin.enabled,
    botToken: config.botToken ?? '',
    defaultModel: config.defaultModel ?? '',
    webhookUrl: config.webhookUrl ?? '',
    appId: config.appId ?? '',
    appSecret: config.appSecret ?? '',
    appKey: config.appKey ?? '',
    signingSecret: config.signingSecret ?? '',
    applicationId: config.applicationId ?? '',
    extraConfig: JSON.stringify(extraConfigObject, null, 2),
  };
}

export function getPresetLabel(type: string): string {
  return CHANNEL_PRESETS.find((preset) => preset.type === type)?.label ?? type;
}

export function getChannelSummary(plugin: ChannelPlugin): string[] {
  const config = safeParseConfig(plugin.config);
  return getKnownKeys(normalizeChannelType(plugin.type))
    .map((key) => config[key])
    .filter((value): value is string => Boolean(value?.trim()));
}

export function buildChannelPluginConfig(values: ChannelPluginFormValues): string {
  const nextConfig: ChannelConfigObject = {};

  const assign = (key: string, value: string) => {
    const nextValue = value.trim();
    if (nextValue) {
      nextConfig[key] = nextValue;
    }
  };

  assign('defaultModel', values.defaultModel);

  switch (values.type) {
    case 'telegram':
      assign('botToken', values.botToken);
      assign('webhookUrl', values.webhookUrl);
      break;
    case 'lark':
      assign('appId', values.appId);
      assign('appSecret', values.appSecret);
      break;
    case 'dingtalk':
      assign('appKey', values.appKey);
      assign('appSecret', values.appSecret);
      break;
    case 'slack':
      assign('botToken', values.botToken);
      assign('signingSecret', values.signingSecret);
      break;
    case 'discord':
      assign('botToken', values.botToken);
      assign('applicationId', values.applicationId);
      break;
  }

  const extraConfig = safeParseExtraConfig(values.extraConfig);
  return JSON.stringify(
    {
      ...extraConfig,
      ...nextConfig,
    },
    null,
    2,
  );
}

function safeParseConfig(config: string | null | undefined): ChannelConfigObject {
  if (!config?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(config) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  } catch {
    return {};
  }
}

function safeParseExtraConfig(extraConfig: string): ChannelConfigObject {
  const trimmed = extraConfig.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  } catch {
    return {};
  }
}

function normalizeChannelType(type: string): ChannelPluginType {
  if (type === 'lark' || type === 'dingtalk' || type === 'slack' || type === 'discord') {
    return type;
  }

  return 'telegram';
}

function getKnownKeys(type: ChannelPluginType): string[] {
  switch (type) {
    case 'telegram':
      return ['botToken', 'defaultModel', 'webhookUrl'];
    case 'lark':
      return ['appId', 'appSecret', 'defaultModel'];
    case 'dingtalk':
      return ['appKey', 'appSecret', 'defaultModel'];
    case 'slack':
      return ['botToken', 'signingSecret', 'defaultModel'];
    case 'discord':
      return ['botToken', 'applicationId', 'defaultModel'];
  }
}
