import { Button } from '@arco-design/web-react';
import { useMemo } from 'react';
import type { ExtensionHostContext } from './types';

interface ExtensionSettingsHostProps {
  extensionName: string;
  host: ExtensionHostContext;
}

export function ExtensionSettingsHost({ extensionName, host }: ExtensionSettingsHostProps) {
  const hostUrl = useMemo(() => appendHostContext(host.entryUrl), [host.entryUrl]);

  return (
    <section className="settings-group-card settings-extension-page__host-card" data-testid="extension-host-card">
      <div className="settings-extension-page__host-header">
        <div>
          <div className="settings-group-card__title">扩展宿主页</div>
          <div className="settings-extension-page__section-subtitle">
            {extensionName} 已声明独立设置入口，当前以 {host.mode} 宿主方式嵌入设置工作区。
          </div>
        </div>

        <Button type="outline" onClick={() => window.open(hostUrl, '_blank', 'noopener,noreferrer')}>
          新窗口打开
        </Button>
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
