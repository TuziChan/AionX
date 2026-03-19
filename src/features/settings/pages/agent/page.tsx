import { useState } from 'react';
import { SettingsPage } from '@/shared/ui';
import { AssistantEditorModal } from './components/AssistantEditorModal';
import { AssistantListPane } from './components/AssistantListPane';
import type { AssistantEditorValues } from './types';
import { useAgentAssistants } from './hooks/useAgentAssistants';

export function Component() {
  const {
    agentOptions,
    assistants,
    loading,
    removingAssistantId,
    saving,
    selectedAssistant,
    selectedAssistantId,
    deleteAssistant,
    getStatusLabel,
    saveAssistant,
    selectAssistant,
    toggleAssistantEnabled,
    togglingAssistantId,
  } = useAgentAssistants();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<typeof selectedAssistant>(null);
  const [initialValues, setInitialValues] = useState<AssistantEditorValues | null>(null);

  const openCreateAssistant = () => {
    setEditingAssistant(null);
    setInitialValues(null);
    setEditorVisible(true);
  };

  const openEditAssistant = (assistant: NonNullable<typeof selectedAssistant>) => {
    selectAssistant(assistant.id);
    setEditingAssistant(assistant);
    setInitialValues(null);
    setEditorVisible(true);
  };

  const openDuplicateAssistant = (assistant: NonNullable<typeof selectedAssistant>) => {
    selectAssistant(assistant.id);
    setEditingAssistant(null);
    setInitialValues({
      id: '',
      source: 'custom',
      name: `${assistant.name} (副本)`,
      description: assistant.description,
      avatar: assistant.avatar,
      mainAgent: assistant.mainAgent,
      enabled: assistant.enabled,
      prompt: assistant.prompt,
    });
    setEditorVisible(true);
  };

  return (
    <SettingsPage className="settings-agent-page">
      <AssistantListPane
        assistants={assistants}
        selectedAssistantId={selectedAssistantId}
        onAddAssistant={openCreateAssistant}
        onDuplicateAssistant={openDuplicateAssistant}
        onEditAssistant={openEditAssistant}
        onSelectAssistant={selectAssistant}
        onToggleAssistantEnabled={(assistant, enabled) => void toggleAssistantEnabled(assistant, enabled)}
        resolveStatusLabel={getStatusLabel}
        togglingAssistantId={togglingAssistantId}
      />

      <AssistantEditorModal
        agentOptions={agentOptions}
        deleting={removingAssistantId === editingAssistant?.id}
        assistant={editingAssistant}
        initialValues={initialValues}
        resolveStatusLabel={getStatusLabel}
        saving={saving}
        visible={editorVisible}
        onCancel={() => {
          setEditorVisible(false);
          setEditingAssistant(null);
          setInitialValues(null);
        }}
        onDelete={(assistant) => {
          void deleteAssistant(assistant).then((deleted) => {
            if (!deleted) {
              return;
            }
            setEditorVisible(false);
            setEditingAssistant(null);
            setInitialValues(null);
          });
        }}
        onSubmit={async (values, assistant) => {
          await saveAssistant(values, assistant);
          setEditorVisible(false);
          setEditingAssistant(null);
          setInitialValues(null);
        }}
      />

      {loading ? <div className="settings-status-inline">正在加载助手配置...</div> : null}
    </SettingsPage>
  );
}

Component.displayName = 'AgentSettings';
