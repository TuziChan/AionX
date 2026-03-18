import { Input, Modal } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import type { ModelEditorDraft } from '../types';

interface ModelEditorModalProps {
  draft: ModelEditorDraft | null;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (draft: ModelEditorDraft) => Promise<boolean>;
}

export function ModelEditorModal({ draft, visible, onCancel, onSubmit }: ModelEditorModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setName(draft?.name ?? '');
    }
  }, [draft, visible]);

  if (!draft) {
    return null;
  }

  const handleOk = async () => {
    const success = await onSubmit({
      ...draft,
      name,
    });

    if (success) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      className="settings-model-page__model-modal"
      title={draft.originalName ? '编辑模型' : '添加模型'}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      unmountOnExit
    >
      <Input id="model-name-input" value={name} onChange={setName} placeholder="例如 gpt-5-codex" />
    </Modal>
  );
}
