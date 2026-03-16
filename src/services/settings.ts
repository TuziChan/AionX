import { commands } from '@/bindings';

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const result = await commands.getSettings(key);
  if (result.status !== 'ok' || result.data == null) {
    return fallback;
  }
  return result.data as T;
}

export async function updateSetting<T>(key: string, value: T): Promise<void> {
  const result = await commands.updateSettings(key, value as never);
  if (result.status !== 'ok') {
    throw new Error(String(result.error));
  }
}

export async function changeLanguage(language: string): Promise<void> {
  const result = await commands.changeLanguage(language);
  if (result.status !== 'ok') {
    throw new Error(String(result.error));
  }
}

export async function getDefaultConfig() {
  const result = await commands.getDefaultConfig();
  if (result.status !== 'ok') {
    throw new Error(String(result.error));
  }
  return result.data;
}

export async function getSystemInfo() {
  const result = await commands.getSystemInfo();
  if (result.status !== 'ok') {
    throw new Error(String(result.error));
  }
  return result.data;
}
