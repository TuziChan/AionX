import type { ModelProvider } from '../../types';

export type ModelProtocolValue = 'openai' | 'gemini' | 'anthropic';

export interface ProviderFormValues {
  id?: string;
  platform: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  contextLimit?: number | string;
}

export interface ModelEditorDraft {
  providerId: string;
  originalName: string | null;
  name: string;
}

export interface ModelProviderSummary extends ModelProvider {
  apiKeyCount: number;
  enabledModelCount: number;
}
