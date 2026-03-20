import { PencilLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { getAssistantSourceLabel } from '@/features/settings/api/agent';
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
} from '@/shared/ui';
import type { AssistantEntry } from '../types';

interface AssistantDetailPaneProps {
  assistant: AssistantEntry | null;
  deleting: boolean;
  onDeleteAssistant: (assistant: AssistantEntry) => void;
  onEditAssistant: (assistant: AssistantEntry) => void;
  resolveStatusLabel: (assistant: AssistantEntry) => string;
}

export function AssistantDetailPane({
  assistant,
  deleting,
  onDeleteAssistant,
  onEditAssistant,
  resolveStatusLabel,
}: AssistantDetailPaneProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!assistant) {
    return (
      <section className="settings-group-card settings-split-view__detail settings-assistants__detail" data-testid="agent-assistant-detail">
        <div className="settings-empty-state settings-model-page__detail-empty">
          <div className="settings-empty-state__title">选择一个助手</div>
          <div className="settings-empty-state__desc">左侧会列出所有内置与自定义助手，选中后即可查看详情或继续编辑。</div>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-group-card settings-split-view__detail settings-assistants__detail" data-testid="agent-assistant-detail">
      <div className="settings-model-page__detail-hero">
        <div className="settings-model-page__detail-meta">
          <div className="settings-model-page__detail-title">{assistant.name}</div>
          <div className="settings-model-page__detail-subtitle">
            <span>{getAssistantSourceLabel(assistant.source)}</span>
            <span>{assistant.mainAgent}</span>
          </div>
        </div>
        <div className="settings-model-page__detail-actions">
          <Badge variant={assistant.source === 'builtin' ? 'info' : 'outline'}>
            {getAssistantSourceLabel(assistant.source)}
          </Badge>
          <Badge variant={assistant.enabled ? 'default' : 'outline'}>{resolveStatusLabel(assistant)}</Badge>
          <Button data-testid="agent-edit-assistant" type="button" variant="outline" onClick={() => onEditAssistant(assistant)}>
            <PencilLine data-icon="inline-start" />
            编辑
          </Button>
          {assistant.source === 'custom' ? (
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <Button
                data-testid="agent-delete-assistant"
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 data-icon="inline-start" />
                删除
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除这个自定义助手？</AlertDialogTitle>
                  <AlertDialogDescription>
                    删除后将移除该助手的自定义配置，当前列表会立即刷新。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      onDeleteAssistant(assistant);
                    }}
                  >
                    确认删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      <div className="settings-assistants__hero">
        <div className="settings-assistants__hero-avatar">{assistant.avatar || '🤖'}</div>
        <div>
          <div className="settings-assistants__hero-name">{assistant.name}</div>
          <div className="settings-assistants__hero-desc">{assistant.description}</div>
        </div>
      </div>

      <div className="settings-tools-page__detail-grid">
        <div className="settings-tools-page__meta-card">
          <div className="settings-tools-page__meta-label">主 Agent</div>
          <div className="settings-tools-page__meta-value" data-testid="agent-main-agent-value">
            {assistant.mainAgent}
          </div>
        </div>
        <div className="settings-tools-page__meta-card">
          <div className="settings-tools-page__meta-label">状态</div>
          <div className="settings-tools-page__meta-value" data-testid="agent-status-value">
            {resolveStatusLabel(assistant)}
          </div>
        </div>
        <div className="settings-tools-page__meta-card">
          <div className="settings-tools-page__meta-label">来源</div>
          <div className="settings-tools-page__meta-value" data-testid="agent-source-value">
            {getAssistantSourceLabel(assistant.source)}
          </div>
        </div>
      </div>

      <div className="settings-assistants__prompt">
        <div className="settings-assistants__prompt-title">Prompt / Rules</div>
        <pre>{assistant.prompt || '暂无预设规则内容'}</pre>
      </div>
    </section>
  );
}
