import { invoke } from '@tauri-apps/api/core';
import type { SystemInfo } from '@/bindings';
import type { SystemSettingsSnapshot } from '../pages/system/types';

type SystemSettingsPayload = {
  closeToTray?: boolean;
  runtimeInfo?: {
    cacheDir?: string;
    workDir?: string;
    logDir?: string;
  };
};

const EMPTY_RUNTIME_INFO = {
  cacheDir: '',
  workDir: '',
  logDir: '',
};

export async function getSystemSettings(): Promise<SystemSettingsSnapshot> {
  const result = await invoke<SystemSettingsPayload>('get_system_settings');
  return normalizeSystemSettings(result);
}

export async function saveSystemSettings(settings: SystemSettingsSnapshot): Promise<SystemSettingsSnapshot> {
  const result = await invoke<SystemSettingsPayload>('save_system_settings', {
    settings: normalizeSystemSettings(settings),
  });

  return normalizeSystemSettings(result);
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return invoke<SystemInfo>('get_system_info');
}

export async function changeAppLanguage(language: string): Promise<void> {
  await invoke('change_language', {
    language,
  });
}

function normalizeSystemSettings(settings: SystemSettingsPayload | SystemSettingsSnapshot): SystemSettingsSnapshot {
  return {
    closeToTray: Boolean(settings.closeToTray),
    runtimeInfo: {
      cacheDir: settings.runtimeInfo?.cacheDir?.trim() || EMPTY_RUNTIME_INFO.cacheDir,
      workDir: settings.runtimeInfo?.workDir?.trim() || EMPTY_RUNTIME_INFO.workDir,
      logDir: settings.runtimeInfo?.logDir?.trim() || EMPTY_RUNTIME_INFO.logDir,
    },
  };
}
