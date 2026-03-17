import { invoke } from '@tauri-apps/api/core';
import type { McpServer } from '@/bindings';
import { listModelProviders } from './model';
import type { ModelProvider } from '../types';
import type { ImageGenerationDraft, ImageGenerationOption, McpServerFormValues } from '../pages/tools/types';

export const EMPTY_MCP_SERVER: McpServerFormValues = {
  name: '',
  type: 'stdio',
  command: '',
  args: '[]',
  env: '{}',
  url: '',
  oauthConfig: '{}',
};

export async function listMcpServers(): Promise<McpServer[]> {
  return invoke<McpServer[]>('list_mcp_servers');
}

export async function createMcpServer(values: McpServerFormValues): Promise<McpServer> {
  return invoke<McpServer>('create_mcp_server', {
    input: toCreatePayload(values),
  });
}

export async function updateMcpServer(
  serverId: string,
  values: McpServerFormValues,
  enabled: boolean,
): Promise<McpServer> {
  return invoke<McpServer>('update_mcp_server', {
    id: serverId,
    updates: {
      name: values.name.trim(),
      command: normalizeOptionalText(values.command),
      args: normalizeJsonText(values.args, '[]'),
      env: normalizeJsonText(values.env, '{}'),
      url: normalizeOptionalText(values.url),
      enabled,
      oauth_config: normalizeJsonText(values.oauthConfig, '{}'),
    },
  });
}

export async function deleteMcpServer(serverId: string): Promise<void> {
  await invoke('delete_mcp_server', {
    id: serverId,
  });
}

export async function testMcpConnection(serverId: string): Promise<string> {
  return invoke<string>('test_mcp_connection', {
    id: serverId,
  });
}

export async function getImageGenerationSettings(): Promise<ImageGenerationDraft> {
  const result = await invoke<{
    enabled: boolean;
    provider_id?: string | null;
    model_name?: string | null;
  }>('get_image_generation_settings');

  return {
    enabled: result.enabled,
    providerId: result.provider_id ?? null,
    modelName: result.model_name ?? null,
  };
}

export async function saveImageGenerationSettings(settings: ImageGenerationDraft): Promise<ImageGenerationDraft> {
  const result = await invoke<{
    enabled: boolean;
    provider_id?: string | null;
    model_name?: string | null;
  }>('save_image_generation_settings', {
    settings: {
      enabled: settings.enabled,
      provider_id: settings.providerId,
      model_name: settings.modelName,
    },
  });

  return {
    enabled: result.enabled,
    providerId: result.provider_id ?? null,
    modelName: result.model_name ?? null,
  };
}

export async function listImageGenerationOptions(): Promise<ImageGenerationOption[]> {
  const providers = await listModelProviders();
  return buildImageGenerationOptions(providers);
}

export function buildImageGenerationOptions(providers: ModelProvider[]): ImageGenerationOption[] {
  return providers.flatMap((provider) =>
    provider.model.map((modelName) => ({
      label: `${provider.name} / ${modelName}`,
      value: `${provider.id}|${modelName}`,
      providerId: provider.id,
      modelName,
      description: provider.baseUrl || provider.platform,
    })),
  );
}

export function getServerEndpointLabel(server: McpServer): string {
  if (server.type === 'stdio') {
    return server.command?.trim() || '未配置命令';
  }

  return server.url?.trim() || '未配置地址';
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}

function toCreatePayload(values: McpServerFormValues) {
  return {
    name: values.name.trim(),
    type: values.type,
    command: normalizeOptionalText(values.command),
    args: normalizeJsonText(values.args, '[]'),
    env: normalizeJsonText(values.env, '{}'),
    url: normalizeOptionalText(values.url),
    oauth_config: normalizeJsonText(values.oauthConfig, '{}'),
  };
}

function normalizeJsonText(value: string | null | undefined, fallback: string): string {
  const nextValue = value?.trim();
  return nextValue ? nextValue : fallback;
}
