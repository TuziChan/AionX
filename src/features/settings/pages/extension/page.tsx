import { Alert, Button, Input, Switch, Tag } from '@arco-design/web-react';
import { PreferenceRow } from '../../components/PreferenceRow';
import { ExtensionSettingsHost } from './ExtensionSettingsHost';
import { useExtensionTab } from './hooks/useExtensionTab';

export function Component() {
  const { loading, saving, tab, toggleEnabled } = useExtensionTab();

  if (!tab) {
    return (
      <div className="settings-panel settings-panel--full settings-extension-page">
        <Alert
          type="warning"
          content={loading ? '正在加载扩展设置...' : '未找到对应的扩展设置页，请确认扩展仍然存在。'}
          data-testid="extension-missing-state"
        />
      </div>
    );
  }

  return (
    <div className="settings-panel settings-panel--full settings-extension-page">
      <section className="settings-group-card settings-extension-page__hero-card">
        <div className="settings-extension-page__hero-header">
          <div className="settings-extension-page__hero-copy">
            <div className="settings-layout__eyebrow">扩展设置 / {tab.tabId}</div>
            <div className="settings-extension-page__hero-title">{tab.name}</div>
            <div className="settings-extension-page__section-subtitle">
              {tab.description?.trim() || '当前扩展尚未提供额外描述，已回退为标准元信息视图。'}
            </div>
          </div>

          <div className="settings-extension-page__hero-side">
            <div className="settings-extension-page__hero-badges">
              <Tag color="arcoblue">v{tab.version}</Tag>
              <Tag color={tab.host ? 'green' : 'orangered'}>{tab.host ? 'Host Ready' : 'Metadata Fallback'}</Tag>
              <Tag color={tab.enabled ? 'green' : 'gray'}>{tab.enabled ? 'Enabled' : 'Disabled'}</Tag>
            </div>

            <Button type="outline" loading={loading} onClick={() => window.navigator.clipboard.writeText(tab.path)}>
              复制扩展路径
            </Button>
          </div>
        </div>
      </section>

      {tab.host ? <ExtensionSettingsHost extensionName={tab.name} host={tab.host} /> : null}

      <section className="settings-group-card settings-extension-page__meta-card" data-testid="extension-fallback-card">
        <div className="settings-extension-page__section-header">
          <div>
            <div className="settings-group-card__title">{tab.host ? '宿主元信息' : '扩展元信息回退页'}</div>
            <div className="settings-extension-page__section-subtitle">
              {tab.host
                ? '即使宿主页可用，扩展来源、路径和原始配置仍在此处保留，便于排查问题。'
                : '当前扩展未声明可嵌入设置页，因此使用标准元信息卡片作为兜底展示。'}
            </div>
          </div>
        </div>

        <div className="settings-group-card__body">
          <PreferenceRow label="启用状态" description="禁用后，扩展设置页仍可查看，但不会参与运行时能力注入。">
            <Switch checked={tab.enabled} loading={saving} onChange={(value) => void toggleEnabled(value)} />
          </PreferenceRow>

          <PreferenceRow label="扩展名称">
            <Input value={tab.name} readOnly />
          </PreferenceRow>

          <PreferenceRow label="版本">
            <Input value={tab.version} readOnly />
          </PreferenceRow>

          <PreferenceRow label="本地路径">
            <Input value={tab.path} readOnly />
          </PreferenceRow>

          <PreferenceRow label="说明">
            <Input.TextArea value={tab.description ?? ''} autoSize={{ minRows: 3, maxRows: 6 }} readOnly />
          </PreferenceRow>

          <PreferenceRow label="配置(JSON)" description="保留原始配置文本，便于核对扩展注册时写入的 metadata。">
            <Input.TextArea value={tab.config ?? '{}'} autoSize={{ minRows: 6, maxRows: 12 }} readOnly />
          </PreferenceRow>
        </div>
      </section>

      {loading ? <div className="settings-status-inline">正在加载扩展设置...</div> : null}
    </div>
  );
}

Component.displayName = 'ExtensionSettings';
