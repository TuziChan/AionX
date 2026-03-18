export type DisplayThemeMode = 'light' | 'dark';

export interface DisplaySettingsSnapshot {
  theme: DisplayThemeMode;
  zoomFactor: number;
  customCss: string;
}

export interface DisplaySettingsPayload {
  theme: string;
  zoomFactor: number;
  customCss: string;
}

export const DISPLAY_ZOOM_MIN = 0.8;
export const DISPLAY_ZOOM_MAX = 1.5;
export const DISPLAY_ZOOM_STEP = 0.05;
export const DISPLAY_ZOOM_DEFAULT = 1;

export function clampDisplayZoom(value: number) {
  return Number(Math.min(DISPLAY_ZOOM_MAX, Math.max(DISPLAY_ZOOM_MIN, value)).toFixed(2));
}

export function formatDisplayZoom(value: number) {
  return `${Math.round(value * 100)}%`;
}
