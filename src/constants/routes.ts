export const ROUTES = {
  HOME: '/',
  GUIDE: '/guid',
  CHAT: '/conversation/:id',
  SETTINGS: '/settings',
  SETTINGS_GEMINI: '/settings/gemini',
  SETTINGS_MODEL: '/settings/model',
  SETTINGS_AGENT: '/settings/agent',
  SETTINGS_DISPLAY: '/settings/display',
  SETTINGS_WEBUI: '/settings/webui',
  SETTINGS_SYSTEM: '/settings/system',
  SETTINGS_TOOLS: '/settings/tools',
  SETTINGS_ABOUT: '/settings/about',
} as const;

export function chatRoute(id: string) {
  return `/conversation/${id}`;
}
