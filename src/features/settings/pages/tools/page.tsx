import { useState } from 'react';
import type { McpServer } from '@/bindings';
import { ImageGenerationCard } from './components/ImageGenerationCard';
import { McpServerEditorModal } from './components/McpServerEditorModal';
import { McpServerListPane } from './components/McpServerListPane';
import { useToolServers } from './hooks/useToolServers';

export function Component() {
  const {
    imageOptions,
    imageSettings,
    loading,
    searchValue,
    selectedServer,
    selectedServerId,
    serverSummaries,
    testingServerId,
    removeServer,
    runConnectionTest,
    saveImageSettings,
    selectServer,
    setSearchValue,
    toggleServer,
    upsertServer,
  } = useToolServers();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);

  const openCreateServer = () => {
    setEditingServer(null);
    setEditorVisible(true);
  };

  const openEditServer = (server: McpServer) => {
    setEditingServer(server);
    setEditorVisible(true);
  };

  const selectedSummary =
    serverSummaries.find((server) => server.id === selectedServerId) ??
    (selectedServer
      ? {
          ...selectedServer,
          endpointLabel: selectedServer.url?.trim() || selectedServer.command?.trim() || '未配置地址/命令',
          oauthReady: Boolean(selectedServer.oauth_config && selectedServer.oauth_config !== '{}'),
        }
      : null);

  return (
    <div className="settings-panel settings-panel--wide settings-tools-page">
      <McpServerListPane
        searchValue={searchValue}
        selectedServerId={selectedServerId}
        server={selectedSummary}
        servers={serverSummaries}
        testingServerId={testingServerId}
        testMessage={selectedSummary?.lastTestMessage}
        onAddServer={openCreateServer}
        onDeleteServer={removeServer}
        onEditServer={openEditServer}
        onSearchChange={setSearchValue}
        onSelectServer={selectServer}
        onTestServer={runConnectionTest}
        onToggleServer={toggleServer}
      />

      <ImageGenerationCard
        options={imageOptions}
        settings={imageSettings}
        onChangeSelection={async (value) => {
          if (!value) {
            await saveImageSettings({
              enabled: false,
              providerId: null,
              modelName: null,
            });
            return;
          }

          const [providerId, modelName] = value.split('|');
          await saveImageSettings({
            enabled: imageSettings.enabled,
            providerId,
            modelName,
          });
        }}
        onToggleEnabled={async (enabled) => {
          await saveImageSettings({
            ...imageSettings,
            enabled,
          });
        }}
      />

      <McpServerEditorModal
        server={editingServer}
        visible={editorVisible}
        onCancel={() => setEditorVisible(false)}
        onSubmit={async (values, server) => {
          await upsertServer(values, server);
          setEditorVisible(false);
        }}
      />

      {loading ? <div className="settings-status-inline">正在加载工具配置...</div> : null}
    </div>
  );
}

Component.displayName = 'ToolsSettings';
