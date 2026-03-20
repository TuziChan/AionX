import { LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { notify } from '@/shared/lib';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Switch,
  Textarea,
} from '@/shared/ui';
import type { AgentOption, AssistantEditorValues, AssistantEntry } from '../types';
import { getDefaultAssistantValues } from '../types';

interface AssistantEditorModalProps {
  agentOptions: AgentOption[];
  assistant: AssistantEntry | null;
  deleting: boolean;
  initialValues?: AssistantEditorValues | null;
  resolveStatusLabel: (assistant: AssistantEntry) => string;
  saving: boolean;
  visible: boolean;
  onCancel: () => void;
  onDelete: (assistant: AssistantEntry) => void;
  onSubmit: (values: AssistantEditorValues, editingAssistant?: AssistantEntry | null) => Promise<void>;
}

export function AssistantEditorModal({
  agentOptions,
  assistant,
  deleting,
  initialValues,
  resolveStatusLabel,
  saving,
  visible,
  onCancel,
  onDelete,
  onSubmit,
}: AssistantEditorModalProps) {
  const [values, setValues] = useState<AssistantEditorValues>(() =>
    initialValues ?? getDefaultAssistantValues(agentOptions[0]?.value ?? 'gemini'),
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isCreating = !assistant;
  const isBuiltin = assistant?.source === 'builtin';

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (assistant) {
      setValues({
        id: assistant.id,
        source: assistant.source,
        name: assistant.name,
        description: assistant.description,
        avatar: assistant.avatar,
        mainAgent: assistant.mainAgent,
        enabled: assistant.enabled,
        prompt: assistant.prompt,
      });
      return;
    }

    setValues(initialValues ?? getDefaultAssistantValues(agentOptions[0]?.value ?? 'gemini'));
  }, [agentOptions, assistant, initialValues, visible]);

  const updateValue = <TKey extends keyof AssistantEditorValues>(key: TKey, value: AssistantEditorValues[TKey]) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const previewAvatar = values.avatar || '🤖';
  const previewName = values.name || '新助手';
  const previewDescription = values.description || '尚未填写助手说明';
  const previewMainAgent = values.mainAgent || agentOptions[0]?.value || 'gemini';
  const previewPrompt = values.prompt ?? '';
  const previewStatus = assistant
    ? resolveStatusLabel({
        ...assistant,
        enabled: values.enabled,
        mainAgent: values.mainAgent,
      })
    : values.enabled
      ? '未保存'
      : '已停用';
  const previewSource = isCreating ? '自定义' : assistant?.source === 'builtin' ? '内置' : '自定义';
  const title = useMemo(() => {
    if (isCreating) {
      return '创建自定义助手';
    }
    return assistant?.source === 'builtin' ? '编辑内置助手' : '编辑自定义助手';
  }, [assistant?.source, isCreating]);

  const handleSubmit = async () => {
    const nextName = values.name.trim();
    if (!nextName) {
      notify.error('请输入助手名称');
      return;
    }

    if (!values.mainAgent.trim()) {
      notify.error('请选择主 Agent');
      return;
    }

    await onSubmit(
      {
        ...values,
        name: nextName,
        description: values.description.trim(),
        avatar: values.avatar.trim() || '🤖',
      },
      assistant,
    );
  };

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <SheetContent
        side="right"
        data-testid="agent-assistant-editor"
        className="settings-agent-page__editor-modal w-full sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>编辑助手名称、说明、主 Agent 与 Prompt，保存后会立即刷新当前列表。</SheetDescription>
        </SheetHeader>

      <div className="settings-agent-page__drawer-body" data-testid="agent-assistant-detail">
        <div className="settings-agent-page__drawer-hero">
          <div className="settings-assistants__hero-avatar">{previewAvatar}</div>
          <div className="settings-agent-page__drawer-hero-copy">
            <div className="settings-assistants__hero-name">{previewName}</div>
            <div className="settings-assistants__hero-desc">{previewDescription}</div>
          </div>
        </div>

        <div className="settings-agent-page__drawer-metrics">
          <div className="settings-tools-page__meta-card">
            <div className="settings-tools-page__meta-label">来源</div>
            <div className="settings-tools-page__meta-value" data-testid="agent-source-value">
              {previewSource}
            </div>
          </div>
          <div className="settings-tools-page__meta-card">
            <div className="settings-tools-page__meta-label">状态</div>
            <div className="settings-tools-page__meta-value" data-testid="agent-status-value">
              {previewStatus}
            </div>
          </div>
          <div className="settings-tools-page__meta-card">
            <div className="settings-tools-page__meta-label">主 Agent</div>
            <div className="settings-tools-page__meta-value" data-testid="agent-main-agent-value">
              {previewMainAgent}
            </div>
          </div>
        </div>

        <div className="settings-agent-page__drawer-tags">
          <Badge variant={previewSource === '内置' ? 'info' : 'outline'}>{previewSource}</Badge>
          <Badge variant={previewStatus === '已停用' ? 'outline' : 'default'}>{previewStatus}</Badge>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-assistant-name">名称</Label>
            <Input
              id="agent-assistant-name"
              readOnly={isBuiltin}
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-assistant-description">描述</Label>
            <Textarea
              id="agent-assistant-description"
              className="min-h-24"
              readOnly={isBuiltin}
              value={values.description}
              onChange={(event) => updateValue('description', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-assistant-avatar">头像</Label>
            <Input
              id="agent-assistant-avatar"
              readOnly={isBuiltin}
              value={values.avatar}
              onChange={(event) => updateValue('avatar', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-assistant-main-agent">主 Agent</Label>
            <Select value={values.mainAgent} onValueChange={(value) => updateValue('mainAgent', value)}>
              <SelectTrigger id="agent-assistant-main-agent">
                <SelectValue placeholder="选择 Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {agentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="agent-assistant-enabled">启用</Label>
            <Switch
              id="agent-assistant-enabled"
              data-testid="agent-assistant-enabled"
              checked={values.enabled}
              onCheckedChange={(checked) => updateValue('enabled', checked)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent-assistant-prompt">Prompt / Rules</Label>
            <Textarea
              id="agent-assistant-prompt"
              className="min-h-48"
              readOnly={isBuiltin}
              value={values.prompt}
              onChange={(event) => updateValue('prompt', event.target.value)}
            />
          </div>
        </div>

        <div className="settings-assistants__prompt">
          <div className="settings-assistants__prompt-title">当前规则预览</div>
          <pre>{previewPrompt || '暂无预设规则内容'}</pre>
        </div>
      </div>

        <SheetFooter className="settings-agent-page__drawer-footer">
          <div className="settings-inline-actions">
            <Button
              type="button"
              data-testid="agent-assistant-save"
              disabled={saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              {isCreating ? '创建' : '保存'}
            </Button>
            <Button
              type="button"
              data-testid="agent-assistant-cancel"
              variant="outline"
              disabled={saving}
              onClick={onCancel}
            >
              取消
            </Button>
          </div>
          {!isCreating && assistant?.source === 'custom' ? (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {deleting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
                删除
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除这个自定义助手？</AlertDialogTitle>
                  <AlertDialogDescription>删除后会立即移除当前助手配置，且无法自动恢复。</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      onDelete(assistant);
                    }}
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
