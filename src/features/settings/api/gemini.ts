import { invoke } from '@tauri-apps/api/core';
import type { GeminiAuthStatus, GeminiSettingsDraft } from '../pages/gemini/types';

interface GeminiSettingsResponse {
  authType?: string;
  proxy?: string;
  GOOGLE_GEMINI_BASE_URL?: string | null;
  GOOGLE_CLOUD_PROJECT?: string | null;
  yoloMode?: boolean;
  preferredMode?: string;
}

interface GoogleAuthStatusResponse {
  connected: boolean;
  email?: string | null;
  projectId?: string | null;
}

export const DEFAULT_GEMINI_SETTINGS: GeminiSettingsDraft = {
  authType: 'google-account',
  proxy: '',
  baseUrl: '',
  cloudProject: '',
  yoloMode: false,
  preferredMode: '',
};

export async function getGeminiSettings(): Promise<GeminiSettingsDraft> {
  const result = await invoke<GeminiSettingsResponse>('get_gemini_settings');
  return mapSettingsResponse(result);
}

export async function saveGeminiSettings(settings: GeminiSettingsDraft): Promise<GeminiSettingsDraft> {
  const result = await invoke<GeminiSettingsResponse>('save_gemini_settings', {
    settings: {
      authType: settings.authType,
      proxy: settings.proxy,
      GOOGLE_GEMINI_BASE_URL: normalizeOptionalText(settings.baseUrl),
      GOOGLE_CLOUD_PROJECT: normalizeOptionalText(settings.cloudProject),
      yoloMode: settings.yoloMode,
      preferredMode: normalizeOptionalText(settings.preferredMode) ?? '',
    },
  });

  return mapSettingsResponse(result);
}

export async function getGoogleAuthStatus(): Promise<GeminiAuthStatus> {
  const result = await invoke<GoogleAuthStatusResponse>('get_google_auth_status');
  return mapAuthStatusResponse(result);
}

export async function startGoogleAuth(email: string): Promise<GeminiAuthStatus> {
  const result = await invoke<GoogleAuthStatusResponse>('start_google_auth', {
    email,
  });

  return mapAuthStatusResponse(result);
}

export async function logoutGoogleAuth(): Promise<GeminiAuthStatus> {
  const result = await invoke<GoogleAuthStatusResponse>('logout_google_auth');
  return mapAuthStatusResponse(result);
}

function mapSettingsResponse(result: GeminiSettingsResponse): GeminiSettingsDraft {
  return {
    authType: normalizeAuthType(result.authType),
    proxy: result.proxy ?? '',
    baseUrl: result.GOOGLE_GEMINI_BASE_URL ?? '',
    cloudProject: result.GOOGLE_CLOUD_PROJECT ?? '',
    yoloMode: Boolean(result.yoloMode),
    preferredMode: result.preferredMode ?? '',
  };
}

function mapAuthStatusResponse(result: GoogleAuthStatusResponse): GeminiAuthStatus {
  return {
    connected: Boolean(result.connected),
    email: result.email ?? null,
    projectId: result.projectId ?? null,
  };
}

function normalizeAuthType(value: string | undefined): GeminiSettingsDraft['authType'] {
  if (value === 'api-key') {
    return 'api-key';
  }

  return 'google-account';
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const nextValue = value?.trim();
  return nextValue ? nextValue : null;
}
