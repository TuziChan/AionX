import { useState } from 'react';
import { AssistantDetailPane } from './components/AssistantDetailPane';
import { AssistantEditorModal } from './components/AssistantEditorModal';
import { AssistantListPane } from './components/AssistantListPane';
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
  } = useAgentAssistants();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<typeof selectedAssistant>(null);

  const openCreateAssistant = () => {
    setEditingAssistant(null);
    setEditorVisible(true);
  };

  return (
    <div className="settings-panel settings-panel--wide settings-agent-page">
      <div className="settings-split-view settings-agent-page__shell">
        <AssistantListPane
          assistants={assistants}
          selectedAssistantId={selectedAssistantId}
          onAddAssistant={openCreateAssistant}
          onSelectAssistant={selectAssistant}
          resolveStatusLabel={getStatusLabel}
        />

        <AssistantDetailPane
          assistant={selectedAssistant}
          deleting={removingAssistantId === selectedAssistant?.id}
          onDeleteAssistant={(assistant) => void deleteAssistant(assistant)}
          onEditAssistant={(assistant) => {
            setEditingAssistant(assistant);
            setEditorVisible(true);
          }}
          resolveStatusLabel={getStatusLabel}
        />
      </div>

      <AssistantEditorModal
        agentOptions={agentOptions}
        assistant={editingAssistant}
        saving={saving}
        visible={editorVisible}
        onCancel={() => setEditorVisible(false)}
        onSubmit={async (values, assistant) => {
          await saveAssistant(values, assistant);
          setEditorVisible(false);
        }}
      />

      {loading ? <div className="settings-status-inline">正在加载助手配置...</div> : null}
    </div>
  );
}

Component.displayName = 'AgentSettings';
