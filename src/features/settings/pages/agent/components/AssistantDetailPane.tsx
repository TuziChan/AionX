import { Button, Popconfirm, Tag } from '@arco-design/web-react';
import { DeleteFour, Write } from '@icon-park/react';
import { getAssistantSourceLabel } from '@/features/settings/api/agent';
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
          <Tag color={assistant.source === 'builtin' ? 'arcoblue' : 'green'}>{getAssistantSourceLabel(assistant.source)}</Tag>
          <Tag color={assistant.enabled ? 'green' : 'gray'}>{resolveStatusLabel(assistant)}</Tag>
          <Button data-testid="agent-edit-assistant" icon={<Write size="16" />} onClick={() => onEditAssistant(assistant)}>
            编辑
          </Button>
          {assistant.source === 'custom' ? (
            <Popconfirm title="确认删除这个自定义助手？" onOk={() => onDeleteAssistant(assistant)}>
              <Button
                data-testid="agent-delete-assistant"
                status="danger"
                loading={deleting}
                icon={<DeleteFour size="16" />}
              >
                删除
              </Button>
            </Popconfirm>
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
