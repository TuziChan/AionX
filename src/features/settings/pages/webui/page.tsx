import { SettingsPage, SettingsPageStack, Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
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
    resetPassword,
    savePlugin,
    setPluginEnabled,
    submitPasswordChange,
    toggleServer,
    updateSettingsDraft,
  } = useWebuiSettings();

  return (
    <SettingsPage className="settings-webui-page">
      <Tabs defaultValue="webui" className="w-full">
        <section className="settings-group-card settings-webui-page__toolbar-card">
          <div className="settings-webui-page__toolbar">
            <TabsList className="settings-webui-page__tab-list" aria-label="WebUI 设置分区">
              {WEBUI_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  data-testid={`webui-tab-${tab.key}`}
                  className="settings-webui-page__tab"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </section>

        <SettingsPageStack>
          <TabsContent value="webui" className="mt-0">
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
          </TabsContent>

          <TabsContent value="channels" className="mt-0">
            <ChannelsTab
              plugins={plugins}
              savingPlugin={savingPlugin}
              togglingPluginId={togglingPluginId}
              onSavePlugin={savePlugin}
              onTogglePlugin={setPluginEnabled}
            />
          </TabsContent>
        </SettingsPageStack>
      </Tabs>

      {loading ? <div className="settings-status-inline">正在加载 WebUI 配置...</div> : null}
    </SettingsPage>
  );
}

Component.displayName = 'WebuiSettings';
