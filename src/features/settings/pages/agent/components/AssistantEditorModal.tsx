import { Button, Drawer, Form, Input, Select, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour } from '@icon-park/react';
import { useEffect, useMemo } from 'react';
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
  const [form] = Form.useForm<AssistantEditorValues>();
  const isCreating = !assistant;
  const isBuiltin = assistant?.source === 'builtin';

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (assistant) {
      form.setFieldsValue({
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

    form.setFieldsValue(initialValues ?? getDefaultAssistantValues(agentOptions[0]?.value ?? 'gemini'));
  }, [agentOptions, assistant, form, initialValues, visible]);

  const previewAvatar = assistant?.avatar || initialValues?.avatar || '🤖';
  const previewName = assistant?.name || initialValues?.name || '新助手';
  const previewDescription = assistant?.description || initialValues?.description || '尚未填写助手说明';
  const previewMainAgent = assistant?.mainAgent || initialValues?.mainAgent || agentOptions[0]?.value || 'gemini';
  const previewPrompt = assistant?.prompt ?? initialValues?.prompt ?? '';
  const previewStatus = assistant ? resolveStatusLabel(assistant) : '未保存';
  const previewSource = isCreating ? '自定义' : assistant?.source === 'builtin' ? '内置' : '自定义';
  const title = useMemo(() => {
    if (isCreating) {
      return '创建自定义助手';
    }
    return assistant?.source === 'builtin' ? '编辑内置助手' : '编辑自定义助手';
  }, [assistant?.source, isCreating]);

  return (
    <Drawer
      visible={visible}
      title={title}
      width={520}
      className="settings-agent-page__editor-modal"
      onCancel={onCancel}
      footer={
        <div className="settings-agent-page__drawer-footer">
          <div className="settings-inline-actions">
            <Button type="primary" loading={saving} onClick={() => void form.validate().then((values) => onSubmit(values, assistant))}>
              {isCreating ? '创建' : '保存'}
            </Button>
            <Button onClick={onCancel}>取消</Button>
          </div>
          {!isCreating && assistant?.source === 'custom' ? (
            <Button status="danger" loading={deleting} icon={<DeleteFour size="16" />} onClick={() => onDelete(assistant)}>
              删除
            </Button>
          ) : null}
        </div>
      }
    >
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
          <Tag color={previewSource === '内置' ? 'arcoblue' : 'green'}>{previewSource}</Tag>
          <Tag color={previewStatus === '已停用' ? 'gray' : 'green'}>{previewStatus}</Tag>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item field="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item field="source" hidden>
            <Input />
          </Form.Item>
          <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入助手名称' }]}>
            <Input id="agent-assistant-name" readOnly={isBuiltin} />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea
              id="agent-assistant-description"
              autoSize={{ minRows: 2, maxRows: 4 }}
              readOnly={isBuiltin}
            />
          </Form.Item>
          <Form.Item field="avatar" label="头像">
            <Input id="agent-assistant-avatar" readOnly={isBuiltin} />
          </Form.Item>
          <Form.Item field="mainAgent" label="主 Agent" rules={[{ required: true, message: '请选择主 Agent' }]}>
            <Select
              id="agent-assistant-main-agent"
              options={agentOptions}
              placeholder="选择 Agent"
              allowClear={false}
            />
          </Form.Item>
          <Form.Item field="enabled" label="启用">
            <Switch data-testid="agent-assistant-enabled" />
          </Form.Item>
          <Form.Item field="prompt" label="Prompt / Rules">
            <Input.TextArea id="agent-assistant-prompt" autoSize={{ minRows: 8, maxRows: 14 }} readOnly={isBuiltin} />
          </Form.Item>
        </Form>

        <div className="settings-assistants__prompt">
          <div className="settings-assistants__prompt-title">当前规则预览</div>
          <pre>{previewPrompt || '暂无预设规则内容'}</pre>
        </div>
      </div>
    </Drawer>
  );
}
