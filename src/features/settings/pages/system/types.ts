import type { SystemInfo } from '@/bindings';

export interface RuntimeDirectoryDraft {
  cacheDir: string;
  workDir: string;
  logDir: string;
}

export interface SystemSettingsSnapshot {
  closeToTray: boolean;
  runtimeInfo: RuntimeDirectoryDraft;
}

export const LANGUAGE_OPTIONS = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: 'Español', value: 'es' },
];

export function buildSystemInfoLabel(info: Pick<SystemInfo, 'os' | 'arch' | 'version'> | null): string {
  if (!info) {
    return '读取中';
  }

  return `${info.os} / ${info.arch} / v${info.version}`;
}
