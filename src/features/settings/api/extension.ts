import { invoke } from '@tauri-apps/api/core';
import type { ExtensionSettingsTab } from '../pages/extension/types';

interface ExtensionSettingsHostResponse {
  mode: string;
  entry_url: string;
}

interface ExtensionSettingsTabResponse {
  tab_id: string;
  extension_id: string;
  name: string;
  version: string;
  description: string | null;
  path: string;
  enabled: boolean;
  config: string | null;
  host: ExtensionSettingsHostResponse | null;
}

export async function listExtensionSettingsTabs(): Promise<ExtensionSettingsTab[]> {
  const result = await invoke<ExtensionSettingsTabResponse[]>('list_extension_settings_tabs');
  return result.map(mapExtensionSettingsTab);
}

export async function getExtensionSettingsTab(tabId: string): Promise<ExtensionSettingsTab> {
  const result = await invoke<ExtensionSettingsTabResponse>('get_extension_settings_tab', {
    tabId,
  });

  return mapExtensionSettingsTab(result);
}

export async function setExtensionEnabled(extensionId: string, enabled: boolean): Promise<void> {
  await invoke('set_extension_enabled', {
    extensionId,
    enabled,
  });
}

function mapExtensionSettingsTab(result: ExtensionSettingsTabResponse): ExtensionSettingsTab {
  return {
    tabId: result.tab_id,
    extensionId: result.extension_id,
    name: result.name,
    version: result.version,
    description: result.description ?? null,
    path: result.path,
    enabled: Boolean(result.enabled),
    config: result.config ?? null,
    host: result.host
      ? {
          mode: 'iframe',
          entryUrl: result.host.entry_url,
        }
      : null,
  };
}
