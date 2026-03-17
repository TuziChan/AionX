import { useMemo, useState } from 'react';
import type { ModelProvider } from '../../types';
import { ProviderDetailPane } from './components/ProviderDetailPane';
import { ModelEditorModal } from './components/ModelEditorModal';
import { ProviderEditorModal } from './components/ProviderEditorModal';
import { ProviderListPane } from './components/ProviderListPane';
import { useModelProviders } from './hooks/useModelProviders';
import type { ModelEditorDraft } from './types';

export function Component() {
  const {
    checkingModelKey,
    loading,
    providerSummaries,
    searchValue,
    selectedProvider,
    selectedProviderId,
    cycleModelProtocol,
    deleteModel,
    deleteProvider,
    runHealthCheck,
    saveModel,
    selectProvider,
    setSearchValue,
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

  const selectedSummary = useMemo(
    () => providerSummaries.find((provider) => provider.id === selectedProviderId) ?? selectedProvider,
    [providerSummaries, selectedProvider, selectedProviderId],
  );

  return (
    <div className="settings-panel settings-panel--wide settings-model-page">
      <div className="settings-split-view settings-model-page__shell">
        <ProviderListPane
          providers={providerSummaries}
          searchValue={searchValue}
          selectedProviderId={selectedProviderId}
          onAddProvider={openCreateProvider}
          onSearchChange={setSearchValue}
          onSelectProvider={selectProvider}
        />

        <ProviderDetailPane
          checkingModelKey={checkingModelKey}
          provider={selectedSummary}
          onAddModel={openAddModel}
          onDeleteModel={deleteModel}
          onDeleteProvider={deleteProvider}
          onEditModel={openEditModel}
          onEditProvider={openEditProvider}
          onRunHealthCheck={runHealthCheck}
          onToggleModel={toggleModel}
          onToggleProviderEnabled={toggleProviderEnabled}
          onToggleProtocol={cycleModelProtocol}
        />
      </div>

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
