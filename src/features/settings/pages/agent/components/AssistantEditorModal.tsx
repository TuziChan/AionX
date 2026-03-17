import { Form, Input, Modal, Select, Switch } from '@arco-design/web-react';
import { useEffect } from 'react';
import type { AgentOption, AssistantEditorValues, AssistantEntry } from '../types';
import { getDefaultAssistantValues } from '../types';

interface AssistantEditorModalProps {
  agentOptions: AgentOption[];
  assistant: AssistantEntry | null;
  saving: boolean;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: AssistantEditorValues, editingAssistant?: AssistantEntry | null) => Promise<void>;
}

export function AssistantEditorModal({
  agentOptions,
  assistant,
  saving,
  visible,
  onCancel,
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

    form.setFieldsValue(getDefaultAssistantValues(agentOptions[0]?.value ?? 'gemini'));
  }, [agentOptions, assistant, form, visible]);

  return (
    <Modal
      visible={visible}
      title={isCreating ? '创建自定义助手' : assistant?.source === 'builtin' ? '编辑内置助手' : '编辑自定义助手'}
      confirmLoading={saving}
      className="settings-assistants__modal settings-agent-page__editor-modal"
      onCancel={onCancel}
      onOk={() => void form.validate().then((values) => onSubmit(values, assistant))}
    >
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
          <Input.TextArea id="agent-assistant-prompt" autoSize={{ minRows: 6, maxRows: 12 }} readOnly={isBuiltin} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
