import { useMemo } from 'react';
import { Badge, Button } from '@/shared/ui';
import type { ExtensionHostContext } from './types';

interface ExtensionSettingsHostProps {
  extensionName: string;
  tabId: string;
  description: string | null;
  enabled: boolean;
  version: string;
  host: ExtensionHostContext;
}

export function ExtensionSettingsHost({
  extensionName,
  tabId,
  description,
  enabled,
  version,
  host,
}: ExtensionSettingsHostProps) {
  const hostUrl = useMemo(() => appendHostContext(host.entryUrl), [host.entryUrl]);

  return (
    <section className="settings-group-card settings-extension-page__host-card" data-testid="extension-host-card">
      <div className="settings-extension-page__host-header">
        <div className="settings-extension-page__host-copy">
          <div className="settings-layout__eyebrow">扩展设置 / {tabId}</div>
          <div className="settings-extension-page__section-title">{extensionName}</div>
          <div className="settings-extension-page__section-subtitle">
            {description?.trim() || `${extensionName} 已声明独立设置入口，当前以 ${host.mode} 宿主方式嵌入设置工作区。`}
          </div>
        </div>

        <div className="settings-extension-page__host-actions">
          <div className="settings-extension-page__host-badges">
            <Badge className="settings-extension-page__pill" variant="outline">
              v{version}
            </Badge>
            <Badge className="settings-extension-page__pill" variant="outline">
              {host.mode}
            </Badge>
            <Badge className="settings-extension-page__pill" variant="outline">
              {enabled ? '已启用' : '已停用'}
            </Badge>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(hostUrl, '_blank', 'noopener,noreferrer')}
          >
            新窗口打开
          </Button>
        </div>
      </div>

      <div className="settings-extension-page__host-frame-shell">
        <iframe
          title={`${extensionName} settings host`}
          src={hostUrl}
          className="settings-extension-page__host-frame"
          data-testid="extension-host-frame"
          sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        />
      </div>
    </section>
  );
}

function appendHostContext(entryUrl: string): string {
  try {
    const url = new URL(entryUrl, window.location.origin);
    url.searchParams.set('aionxLocale', navigator.language || 'zh-CN');
    url.searchParams.set(
      'aionxTheme',
      document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
    );
    return url.toString();
  } catch {
    return entryUrl;
  }
}
