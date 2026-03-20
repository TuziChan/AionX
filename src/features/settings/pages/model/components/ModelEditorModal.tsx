import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@/shared/ui';
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
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="settings-model-page__model-modal">
        <DialogHeader>
          <DialogTitle>{draft.originalName ? '编辑模型' : '添加模型'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="model-name-input">模型名称</Label>
          <Input
            id="model-name-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如 gpt-5-codex"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button data-testid="model-save" type="button" onClick={() => void handleOk()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
