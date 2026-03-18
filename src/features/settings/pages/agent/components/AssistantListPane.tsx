import { Button, Switch, Tag } from '@arco-design/web-react';
import { Copy, Plus, SettingOne } from '@icon-park/react';
import classNames from 'classnames';
import { getAssistantSourceLabel } from '@/features/settings/api/agent';
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
        <Button data-testid="agent-add-assistant" type="outline" icon={<Plus size="16" />} onClick={onAddAssistant}>
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
              className={classNames('settings-agent-page__item', {
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
                <button
                  type="button"
                  className="settings-agent-page__ghost-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDuplicateAssistant(assistant);
                  }}
                >
                  <Copy size="14" />
                  复制
                </button>
                <Switch
                  size="small"
                  checked={assistant.enabled}
                  loading={togglingAssistantId === assistant.id}
                  onChange={(checked, event) => {
                    event?.stopPropagation?.();
                    onToggleAssistantEnabled(assistant, checked);
                  }}
                />
                <Button
                  type="text"
                  icon={<SettingOne size="16" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectAssistant(assistant.id);
                    onEditAssistant(assistant);
                  }}
                />
                <Tag color={assistant.source === 'builtin' ? 'arcoblue' : 'green'}>
                  {getAssistantSourceLabel(assistant.source)}
                </Tag>
                <Tag color={assistant.enabled ? 'green' : 'gray'}>{resolveStatusLabel(assistant)}</Tag>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
