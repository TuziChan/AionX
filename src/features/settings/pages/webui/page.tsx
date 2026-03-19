import { useState } from 'react';
import { SettingsPage, SettingsPageStack } from '@/shared/ui';
import { ChannelsTab } from './components/ChannelsTab';
import { WebuiServiceTab } from './components/WebuiServiceTab';
import { useWebuiSettings } from './hooks/useWebuiSettings';
import type { WebuiInnerTab } from './types';

const WEBUI_TABS: Array<{ key: WebuiInnerTab; label: string }> = [
  { key: 'webui', label: 'WebUI' },
  { key: 'channels', label: '通道' },
];

export function Component() {
  const {
    changingPassword,
    deletingPluginId,
    loading,
    plugins,
    resettingPassword,
    savingPlugin,
    savingSettings,
    settings,
    starting,
    status,
    stopping,
    togglingPluginId,
    load,
    persistSettings,
    removePlugin,
    resetPassword,
    savePlugin,
    setPluginEnabled,
    submitPasswordChange,
    toggleServer,
    updateSettingsDraft,
  } = useWebuiSettings();
  const [activeTab, setActiveTab] = useState<WebuiInnerTab>('webui');

  return (
    <SettingsPage className="settings-webui-page">
      <section className="settings-group-card settings-webui-page__toolbar-card">
        <div className="settings-webui-page__toolbar">
          <div className="settings-webui-page__tab-list" role="tablist" aria-label="WebUI 设置分区">
            {WEBUI_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                data-testid={`webui-tab-${tab.key}`}
                aria-selected={activeTab === tab.key}
                className={`settings-webui-page__tab${activeTab === tab.key ? ' settings-webui-page__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <SettingsPageStack>
        {activeTab === 'webui' ? (
          <WebuiServiceTab
            changingPassword={changingPassword}
            loading={loading}
            resettingPassword={resettingPassword}
            savingSettings={savingSettings}
            settings={settings}
            starting={starting}
            status={status}
            stopping={stopping}
            onChangePassword={submitPasswordChange}
            onReload={load}
            onResetPassword={resetPassword}
            onSaveSettings={async (nextSettings) => {
              await persistSettings(nextSettings);
            }}
            onSettingsChange={updateSettingsDraft}
            onToggleRunning={toggleServer}
          />
        ) : (
          <ChannelsTab
            plugins={plugins}
            savingPlugin={savingPlugin}
            togglingPluginId={togglingPluginId}
            onSavePlugin={savePlugin}
            onTogglePlugin={setPluginEnabled}
          />
        )}
      </SettingsPageStack>

      {loading ? <div className="settings-status-inline">正在加载 WebUI 配置...</div> : null}
    </SettingsPage>
  );
}

Component.displayName = 'WebuiSettings';
