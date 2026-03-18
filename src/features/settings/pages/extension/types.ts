export interface ExtensionHostContext {
  mode: 'iframe';
  entryUrl: string;
}

export interface ExtensionSettingsTab {
  tabId: string;
  extensionId: string;
  name: string;
  version: string;
  description: string | null;
  path: string;
  enabled: boolean;
  config: string | null;
  host: ExtensionHostContext | null;
}
