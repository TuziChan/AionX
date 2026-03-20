import { Copy, PencilLine, Plus } from 'lucide-react';
import { getAssistantSourceLabel } from '@/features/settings/api/agent';
import { cn } from '@/shared/lib';
import { Badge, Button, Switch } from '@/shared/ui';
import type { AssistantEntry } from '../types';

interface AssistantListPaneProps {
  assistants: AssistantEntry[];
  selectedAssistantId: string | null;
  onAddAssistant: () => void;
  onDuplicateAssistant: (assistant: AssistantEntry) => void;
  onEditAssistant: (assistant: AssistantEntry) => void;
  onSelectAssistant: (assistantId: string) => void;
  onToggleAssistantEnabled: (assistant: AssistantEntry, enabled: boolean) => void;
  resolveStatusLabel: (assistant: AssistantEntry) => string;
  togglingAssistantId: string | null;
}

export function AssistantListPane({
  assistants,
  selectedAssistantId,
  onAddAssistant,
  onDuplicateAssistant,
  onEditAssistant,
  onSelectAssistant,
  onToggleAssistantEnabled,
  resolveStatusLabel,
  togglingAssistantId,
}: AssistantListPaneProps) {
  return (
    <section
      className="settings-group-card settings-agent-page__collection-card"
      data-testid="agent-assistant-list"
    >
      <div className="settings-model-page__pane-header settings-agent-page__collection-header">
        <div>
          <div className="settings-group-card__title">智能助手</div>
          <div className="settings-model-page__pane-subtitle">
            按照原项目的助手管理方式统一查看、启停、复制并打开抽屉编辑助手配置。
          </div>
        </div>
        <Button data-testid="agent-add-assistant" type="button" variant="outline" onClick={onAddAssistant}>
          <Plus data-icon="inline-start" />
          新建助手
        </Button>
      </div>

      <div className="settings-agent-page__items">
        {assistants.length === 0 ? (
          <div className="settings-empty-state settings-model-page__empty settings-agent-page__empty">
            <div className="settings-empty-state__title">暂无可用助手</div>
            <div className="settings-empty-state__desc">先创建一个自定义助手，列表会继续展示启用状态、来源和配置入口。</div>
          </div>
        ) : (
          assistants.map((assistant) => (
            <div
              key={assistant.id}
              data-testid={`agent-assistant-item-${assistant.id}`}
              className={cn('settings-agent-page__item', {
                'settings-agent-page__item--active': assistant.id === selectedAssistantId,
              })}
              onClick={() => {
                onSelectAssistant(assistant.id);
                onEditAssistant(assistant);
              }}
            >
              <div className="settings-agent-page__item-main">
                <div className="settings-assistants__avatar">{assistant.avatar || '🤖'}</div>
                <div className="settings-assistants__meta">
                  <div className="settings-assistants__name">{assistant.name}</div>
                  <div className="settings-assistants__desc">{assistant.description}</div>
                </div>
              </div>
              <div className="settings-agent-page__item-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="settings-agent-page__ghost-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDuplicateAssistant(assistant);
                  }}
                >
                  <Copy data-icon="inline-start" />
                  复制
                </Button>
                <Switch
                  checked={assistant.enabled}
                  disabled={togglingAssistantId === assistant.id}
                  onClick={(event) => event.stopPropagation()}
                  onCheckedChange={(checked) => {
                    onToggleAssistantEnabled(assistant, checked);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectAssistant(assistant.id);
                    onEditAssistant(assistant);
                  }}
                >
                  <PencilLine />
                </Button>
                <Badge variant={assistant.source === 'builtin' ? 'info' : 'outline'}>
                  {getAssistantSourceLabel(assistant.source)}
                </Badge>
                <Badge variant={assistant.enabled ? 'default' : 'outline'}>{resolveStatusLabel(assistant)}</Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
