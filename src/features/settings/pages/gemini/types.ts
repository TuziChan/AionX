export interface GeminiSettingsDraft {
  authType: 'google-account' | 'api-key';
  proxy: string;
  baseUrl: string;
  cloudProject: string;
  yoloMode: boolean;
  preferredMode: string;
}

export interface GeminiAuthStatus {
  connected: boolean;
  email: string | null;
  projectId: string | null;
}
