import { invoke } from '@tauri-apps/api/core';
import type { AssistantPlugin, DetectedAgent } from '@/bindings';
import type {
  AssistantEditorValues,
  AssistantEntry,
  AssistantPluginConfig,
  BuiltinAssistant,
  BuiltinAssistantPreferences,
} from '../pages/agent/types';

const CUSTOM_ASSISTANT_TYPE = 'custom-assistant';

export async function listBuiltinAssistants(): Promise<BuiltinAssistant[]> {
  return invoke<BuiltinAssistant[]>('list_builtin_assistants');
}

export async function saveBuiltinAssistantPreferences(
  id: string,
  preferences: BuiltinAssistantPreferences,
): Promise<BuiltinAssistant> {
  return invoke<BuiltinAssistant>('save_builtin_assistant_preferences', {
    id,
    preferences: {
      mainAgent: preferences.mainAgent.trim() || 'gemini',
      enabled: preferences.enabled,
    },
  });
}

export async function listCustomAssistants(): Promise<AssistantPlugin[]> {
  return invoke<AssistantPlugin[]>('list_assistant_plugins');
}

export async function createCustomAssistant(values: AssistantEditorValues): Promise<AssistantPlugin> {
  return invoke<AssistantPlugin>('create_assistant_plugin', {
    input: {
      type: CUSTOM_ASSISTANT_TYPE,
      name: values.name.trim(),
      config: stringifyAssistantConfig({
        description: values.description,
        avatar: values.avatar,
        mainAgent: values.mainAgent,
        prompt: values.prompt,
      }),
    },
  });
}

export async function updateCustomAssistant(pluginId: string, values: AssistantEditorValues): Promise<boolean> {
  return invoke<boolean>('update_assistant_plugin', {
    id: pluginId,
    updates: {
      name: values.name.trim(),
      enabled: values.enabled,
      config: stringifyAssistantConfig({
        description: values.description,
        avatar: values.avatar,
        mainAgent: values.mainAgent,
        prompt: values.prompt,
      }),
      status: null,
    },
  });
}

export async function removeCustomAssistant(pluginId: string): Promise<boolean> {
  return invoke<boolean>('remove_assistant_plugin', {
    id: pluginId,
  });
}

export async function detectAvailableAgents(): Promise<DetectedAgent[]> {
  return invoke<DetectedAgent[]>('detect_agents');
}

export function parseAssistantConfig(config: string | null): AssistantPluginConfig {
  if (!config) {
    return {};
  }

  try {
    return JSON.parse(config) as AssistantPluginConfig;
  } catch {
    return {};
  }
}

export function stringifyAssistantConfig(config: AssistantPluginConfig): string {
  return JSON.stringify(
    {
      description: config.description?.trim() || '',
      avatar: config.avatar?.trim() || '🤖',
      mainAgent: config.mainAgent?.trim() || 'gemini',
      prompt: config.prompt ?? '',
    },
    null,
    2,
  );
}

export function toBuiltinAssistantEntry(assistant: BuiltinAssistant): AssistantEntry {
  return {
    id: assistant.id,
    source: 'builtin',
    name: assistant.name,
    description: assistant.description,
    avatar: assistant.avatar || '🤖',
    mainAgent: assistant.mainAgent,
    enabled: assistant.enabled,
    prompt: assistant.prompt,
    status: assistant.enabled ? 'enabled' : 'disabled',
  };
}

export function toCustomAssistantEntry(plugin: AssistantPlugin): AssistantEntry {
  const parsed = parseAssistantConfig(plugin.config);

  return {
    id: `custom-${plugin.id}`,
    source: 'custom',
    name: plugin.name,
    description: parsed.description?.trim() || '未填写描述',
    avatar: parsed.avatar?.trim() || '🤖',
    mainAgent: parsed.mainAgent?.trim() || 'gemini',
    enabled: plugin.enabled,
    prompt: parsed.prompt ?? '',
    pluginId: plugin.id,
    status: plugin.status || (plugin.enabled ? 'active' : 'disabled'),
  };
}

export function getAssistantStatusLabel(assistant: AssistantEntry): string {
  if (assistant.source === 'builtin') {
    return assistant.enabled ? '已启用' : '已停用';
  }

  if (!assistant.enabled) {
    return '已停用';
  }

  if (assistant.status === 'connected') {
    return '已连接';
  }

  if (assistant.status === 'active') {
    return '运行中';
  }

  return assistant.status || '已启用';
}

export function getAssistantSourceLabel(source: AssistantEntry['source']): string {
  return source === 'builtin' ? '内置' : '自定义';
}
