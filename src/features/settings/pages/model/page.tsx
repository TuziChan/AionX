import { useState } from 'react';
import type { ModelProvider } from '../../types';
import { ModelEditorModal } from './components/ModelEditorModal';
import { ProviderEditorModal } from './components/ProviderEditorModal';
import { ProviderStackPane } from './components/ProviderStackPane';
import { useModelProviders } from './hooks/useModelProviders';
import type { ModelEditorDraft } from './types';

export function Component() {
  const {
    checkingModelKey,
    loading,
    providerSummaries,
    selectedProviderId,
    cycleModelProtocol,
    deleteModel,
    deleteProvider,
    runHealthCheck,
    saveModel,
    selectProvider,
    toggleModel,
    toggleProviderEnabled,
    upsertProvider,
  } = useModelProviders();

  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null);
  const [modelModalDraft, setModelModalDraft] = useState<ModelEditorDraft | null>(null);

  const openCreateProvider = () => {
    setEditingProvider(null);
    setProviderModalVisible(true);
  };

  const openEditProvider = (provider: ModelProvider) => {
    setEditingProvider(provider);
    setProviderModalVisible(true);
  };

  const openAddModel = (providerId: string) => {
    setModelModalDraft({
      providerId,
      originalName: null,
      name: '',
    });
  };

  const openEditModel = (providerId: string, modelName: string) => {
    setModelModalDraft({
      providerId,
      originalName: modelName,
      name: modelName,
    });
  };

  return (
    <div className="settings-panel settings-panel--wide settings-model-page">
      <ProviderStackPane
        checkingModelKey={checkingModelKey}
        providers={providerSummaries}
        selectedProviderId={selectedProviderId}
        onAddModel={openAddModel}
        onAddProvider={openCreateProvider}
        onDeleteModel={deleteModel}
        onDeleteProvider={deleteProvider}
        onEditModel={openEditModel}
        onEditProvider={openEditProvider}
        onRunHealthCheck={runHealthCheck}
        onSelectProvider={selectProvider}
        onToggleModel={toggleModel}
        onToggleProviderEnabled={toggleProviderEnabled}
        onToggleProtocol={cycleModelProtocol}
      />

      <ProviderEditorModal
        provider={editingProvider}
        visible={providerModalVisible}
        onCancel={() => setProviderModalVisible(false)}
        onSubmit={async (values, provider) => {
          await upsertProvider(values, provider);
          setProviderModalVisible(false);
        }}
      />

      <ModelEditorModal
        draft={modelModalDraft}
        visible={Boolean(modelModalDraft)}
        onCancel={() => setModelModalDraft(null)}
        onSubmit={saveModel}
      />

      {loading ? <div className="settings-status-inline">正在加载模型配置...</div> : null}
    </div>
  );
}

Component.displayName = 'ModelSettings';
