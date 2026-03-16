export interface GeminiConfig {
  authType: string;
  proxy: string;
  GOOGLE_GEMINI_BASE_URL?: string;
  GOOGLE_CLOUD_PROJECT?: string;
  accountProjects?: Record<string, string>;
  yoloMode?: boolean;
  preferredMode?: string;
}

export interface ModelHealth {
  status: 'unknown' | 'healthy' | 'unhealthy';
  lastCheck?: number;
  latency?: number;
  error?: string;
}

export interface ModelProvider {
  id: string;
  platform: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string[];
  enabled?: boolean;
  modelEnabled?: Record<string, boolean>;
  modelProtocols?: Record<string, string>;
  modelHealth?: Record<string, ModelHealth>;
  contextLimit?: number;
}

export interface ImageGenerationModel extends Omit<ModelProvider, 'model'> {
  useModel: string;
  switch: boolean;
}

export interface SystemSettingsConfig {
  closeToTray?: boolean;
  cacheDir?: string;
  workDir?: string;
}
