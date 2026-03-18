import type { McpServer } from '@/bindings';

export interface McpServerFormValues {
  name: string;
  type: 'stdio' | 'sse' | 'http';
  command: string;
  args: string;
  env: string;
  url: string;
  oauthConfig: string;
}

export interface McpServerSummary extends McpServer {
  endpointLabel: string;
  oauthReady: boolean;
  lastTestMessage?: string;
}

export interface ImageGenerationDraft {
  enabled: boolean;
  providerId: string | null;
  modelName: string | null;
}

export interface ImageGenerationOption {
  label: string;
  value: string;
  providerId: string;
  modelName: string;
  description: string;
}
