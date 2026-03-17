import { Button } from '@arco-design/web-react';
import { Plus } from '@icon-park/react';
import { useState } from 'react';
import type { ChannelPlugin } from '@/bindings';
import { ChannelPluginForm } from './components/ChannelPluginForm';
import { ChannelsTab } from './components/ChannelsTab';
import { WebuiServiceTab } from './components/WebuiServiceTab';
import { useWebuiSettings } from './hooks/useWebuiSettings';
import type { ChannelPluginType, WebuiInnerTab } from './types';

const WEBUI_TABS: Array<{ key: WebuiInnerTab; label: string }> = [
  { key: 'service', label: '服务' },
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
  const [activeTab, setActiveTab] = useState<WebuiInnerTab>('service');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<ChannelPlugin | null>(null);
  const [createPluginType, setCreatePluginType] = useState<ChannelPluginType>('telegram');

  const openCreatePlugin = (type: ChannelPluginType = 'telegram') => {
    setEditingPlugin(null);
    setCreatePluginType(type);
    setActiveTab('channels');
    setEditorVisible(true);
  };

  const openEditPlugin = (plugin: ChannelPlugin) => {
    setEditingPlugin(plugin);
    setCreatePluginType(plugin.type as ChannelPluginType);
    setActiveTab('channels');
    setEditorVisible(true);
  };

  return (
    <div className="settings-panel settings-panel--wide settings-webui-page">
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

          {activeTab === 'channels' ? (
            <Button data-testid="webui-add-channel" icon={<Plus size="16" />} onClick={() => openCreatePlugin()}>
              新增频道
            </Button>
          ) : null}
        </div>
      </section>

      {activeTab === 'service' ? (
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
          deletingPluginId={deletingPluginId}
          plugins={plugins}
          togglingPluginId={togglingPluginId}
          onCreatePlugin={openCreatePlugin}
          onDeletePlugin={removePlugin}
          onEditPlugin={openEditPlugin}
          onTogglePlugin={setPluginEnabled}
        />
      )}

      <ChannelPluginForm
        defaultType={createPluginType}
        plugin={editingPlugin}
        saving={savingPlugin}
        visible={editorVisible}
        onCancel={() => setEditorVisible(false)}
        onSubmit={async (values, plugin) => {
          await savePlugin(values, plugin);
          setEditorVisible(false);
        }}
      />

      {loading ? <div className="settings-status-inline">正在加载 WebUI 配置...</div> : null}
    </div>
  );
}

Component.displayName = 'WebuiSettings';
