import { Button, Tag } from '@arco-design/web-react';
import { Plus } from '@icon-park/react';
import classNames from 'classnames';
import { getAssistantSourceLabel } from '@/features/settings/api/agent';
import type { AssistantEntry } from '../types';

interface AssistantListPaneProps {
  assistants: AssistantEntry[];
  selectedAssistantId: string | null;
  onAddAssistant: () => void;
  onSelectAssistant: (assistantId: string) => void;
  resolveStatusLabel: (assistant: AssistantEntry) => string;
}

export function AssistantListPane({
  assistants,
  selectedAssistantId,
  onAddAssistant,
  onSelectAssistant,
  resolveStatusLabel,
}: AssistantListPaneProps) {
  return (
    <section className="settings-group-card settings-split-view__list settings-assistants__list" data-testid="agent-assistant-list">
      <div className="settings-model-page__pane-header">
        <div>
          <div className="settings-group-card__title">智能助手</div>
          <div className="settings-model-page__pane-subtitle">统一查看内置助手和自定义助手的启用状态、主 Agent 与规则。</div>
        </div>
        <Button data-testid="agent-add-assistant" type="outline" icon={<Plus size="16" />} onClick={onAddAssistant}>
          新建助手
        </Button>
      </div>

      <div className="settings-assistants__items">
        {assistants.length === 0 ? (
          <div className="settings-empty-state settings-model-page__empty">
            <div className="settings-empty-state__title">暂无可用助手</div>
            <div className="settings-empty-state__desc">先创建一个自定义助手，右侧会继续展示规则、主 Agent 和启用状态。</div>
          </div>
        ) : (
          assistants.map((assistant) => (
            <button
              key={assistant.id}
              type="button"
              data-testid={`agent-assistant-item-${assistant.id}`}
              className={classNames('settings-assistants__item', {
                'settings-assistants__item--active': assistant.id === selectedAssistantId,
              })}
              onClick={() => onSelectAssistant(assistant.id)}
            >
              <div className="settings-assistants__avatar">{assistant.avatar || '🤖'}</div>
              <div className="settings-assistants__meta">
                <div className="settings-assistants__name">{assistant.name}</div>
                <div className="settings-assistants__desc">{assistant.description}</div>
              </div>
              <div className="settings-inline-actions">
                <Tag color={assistant.source === 'builtin' ? 'arcoblue' : 'green'}>
                  {getAssistantSourceLabel(assistant.source)}
                </Tag>
                <Tag color={assistant.enabled ? 'green' : 'gray'}>{resolveStatusLabel(assistant)}</Tag>
              </div>
            </button>
          ))
        )}
      </div>
    </section>
  );
}
