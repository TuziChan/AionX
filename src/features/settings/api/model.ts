import { invoke } from '@tauri-apps/api/core';
import type { ModelHealth, ModelProvider } from '../types';
import type { ModelProtocolValue, ProviderFormValues } from '../pages/model/types';

export const MODEL_PROTOCOL_OPTIONS: Array<{ label: string; value: ModelProtocolValue; color: string }> = [
  { label: 'OpenAI', value: 'openai', color: 'green' },
  { label: 'Gemini', value: 'gemini', color: 'blue' },
  { label: 'Anthropic', value: 'anthropic', color: 'orange' },
];

export const EMPTY_MODEL_PROVIDER: ProviderFormValues = {
  platform: 'openai-compatible',
  name: '',
  baseUrl: '',
  apiKey: '',
  contextLimit: undefined,
};

export async function listModelProviders(): Promise<ModelProvider[]> {
  return invoke<ModelProvider[]>('list_model_providers');
}

export async function createModelProvider(values: ProviderFormValues): Promise<ModelProvider> {
  return invoke<ModelProvider>('create_model_provider', {
    input: toProviderPayload(values),
  });
}

export async function updateModelProvider(providerId: string, values: ProviderFormValues): Promise<ModelProvider> {
  return invoke<ModelProvider>('update_model_provider', {
    id: providerId,
    input: toProviderPayload(values),
  });
}

export async function deleteModelProvider(providerId: string): Promise<void> {
  await invoke('delete_model_provider', {
    id: providerId,
  });
}

export async function upsertProviderModel(
  providerId: string,
  name: string,
  originalName?: string | null,
): Promise<ModelProvider> {
  return invoke<ModelProvider>('upsert_provider_model', {
    providerId,
    name,
    originalName: originalName ?? null,
  });
}

export async function deleteProviderModel(providerId: string, modelName: string): Promise<ModelProvider> {
  return invoke<ModelProvider>('delete_provider_model', {
    providerId,
    modelName,
  });
}

export async function setModelProviderEnabled(providerId: string, enabled: boolean): Promise<ModelProvider> {
  return invoke<ModelProvider>('set_model_provider_enabled', {
    providerId,
    enabled,
  });
}

export async function setProviderModelEnabled(
  providerId: string,
  modelName: string,
  enabled: boolean,
): Promise<ModelProvider> {
  return invoke<ModelProvider>('set_provider_model_enabled', {
    providerId,
    modelName,
    enabled,
  });
}

export async function setProviderModelProtocol(
  providerId: string,
  modelName: string,
  protocol: ModelProtocolValue,
): Promise<ModelProvider> {
  return invoke<ModelProvider>('set_provider_model_protocol', {
    providerId,
    modelName,
    protocol,
  });
}

export async function runModelHealthCheck(providerId: string, modelName: string): Promise<ModelHealth> {
  return invoke<ModelHealth>('run_model_health_check', {
    providerId,
    modelName,
  });
}

export function getApiKeyCount(apiKey: string): number {
  if (!apiKey) {
    return 0;
  }

  return apiKey.split(/[,\n]/).filter((value) => value.trim().length > 0).length;
}

export function isModelEnabled(provider: ModelProvider, model: string): boolean {
  if (provider.enabled === false) {
    return false;
  }

  if (!provider.modelEnabled) {
    return true;
  }

  return provider.modelEnabled[model] !== false;
}

export function getProviderToggleState(provider: ModelProvider): { checked: boolean; indeterminate: boolean } {
  if (provider.enabled === false) {
    return { checked: false, indeterminate: false };
  }

  if (provider.model.length === 0) {
    return { checked: true, indeterminate: false };
  }

  const enabledCount = provider.model.filter((model) => isModelEnabled(provider, model)).length;

  if (enabledCount === 0) {
    return { checked: false, indeterminate: false };
  }

  if (enabledCount === provider.model.length) {
    return { checked: true, indeterminate: false };
  }

  return { checked: true, indeterminate: true };
}

export function getModelProtocol(provider: ModelProvider, model: string): ModelProtocolValue {
  const current = provider.modelProtocols?.[model];
  if (current === 'gemini' || current === 'anthropic') {
    return current;
  }
  return 'openai';
}

export function getNextModelProtocol(provider: ModelProvider, model: string): ModelProtocolValue {
  const current = getModelProtocol(provider, model);
  const currentIndex = MODEL_PROTOCOL_OPTIONS.findIndex((option) => option.value === current);
  return MODEL_PROTOCOL_OPTIONS[(currentIndex + 1) % MODEL_PROTOCOL_OPTIONS.length].value;
}

function toProviderPayload(values: ProviderFormValues) {
  const nextContextLimit =
    values.contextLimit === '' || values.contextLimit == null ? undefined : Number(values.contextLimit);

  return {
    platform: values.platform,
    name: values.name.trim(),
    baseUrl: values.baseUrl.trim(),
    apiKey: values.apiKey.trim(),
    contextLimit: Number.isFinite(nextContextLimit) ? nextContextLimit : undefined,
  };
}
