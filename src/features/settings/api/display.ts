import { invoke } from '@tauri-apps/api/core';
import type { DisplaySettingsPayload, DisplaySettingsSnapshot } from '../pages/display/types';

const DISPLAY_STYLE_ID = 'aionx-custom-css-theme';

export async function getDisplaySettings(): Promise<DisplaySettingsSnapshot> {
  const result = await invoke<DisplaySettingsPayload>('get_display_settings');
  return normalizeDisplaySettings(result);
}

export async function saveDisplaySettings(settings: DisplaySettingsSnapshot): Promise<DisplaySettingsSnapshot> {
  const result = await invoke<DisplaySettingsPayload>('save_display_settings', {
    settings: normalizeDisplaySettings(settings),
  });

  return normalizeDisplaySettings(result);
}

export function applyDisplayCustomCss(customCss: string) {
  localStorage.setItem('aionx.customCss', customCss);

  let styleEl = document.getElementById(DISPLAY_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = DISPLAY_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = customCss;
}

function normalizeDisplaySettings(settings: DisplaySettingsPayload | DisplaySettingsSnapshot): DisplaySettingsSnapshot {
  const theme = settings.theme === 'dark' ? 'dark' : 'light';
  const zoomFactor = Number.isFinite(settings.zoomFactor) ? Number(settings.zoomFactor.toFixed(2)) : 1;

  return {
    theme,
    zoomFactor: Math.min(1.5, Math.max(0.8, zoomFactor)),
    customCss: settings.customCss?.trim() ? settings.customCss : settings.customCss ?? '',
  };
}
