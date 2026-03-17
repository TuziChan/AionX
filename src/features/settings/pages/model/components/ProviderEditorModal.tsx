import { Form, Input, Modal, Select } from '@arco-design/web-react';
import { useEffect } from 'react';
import { EMPTY_MODEL_PROVIDER } from '@/features/settings/api/model';
import type { ModelProvider } from '@/features/settings/types';
import type { ProviderFormValues } from '../types';

interface ProviderEditorModalProps {
  provider: ModelProvider | null;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ProviderFormValues, editingProvider?: ModelProvider | null) => Promise<void>;
}

export function ProviderEditorModal({ provider, visible, onCancel, onSubmit }: ProviderEditorModalProps) {
  const [form] = Form.useForm<ProviderFormValues>();

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (provider) {
      form.setFieldsValue({
        id: provider.id,
        platform: provider.platform,
        name: provider.name,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        contextLimit: provider.contextLimit,
      });
      return;
    }

    form.setFieldsValue(EMPTY_MODEL_PROVIDER);
  }, [form, provider, visible]);

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values, provider);
  };

  return (
    <Modal
      visible={visible}
      className="settings-model-page__provider-modal"
      title={provider ? '编辑平台' : '添加平台'}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item field="name" label="平台名称" rules={[{ required: true, message: '请输入平台名称' }]}>
          <Input id="model-provider-name" />
        </Form.Item>
        <Form.Item field="platform" label="平台类型" rules={[{ required: true, message: '请选择平台类型' }]}>
          <Select
            options={[
              { label: 'OpenAI Compatible', value: 'openai-compatible' },
              { label: 'Gemini', value: 'gemini' },
              { label: 'Anthropic', value: 'anthropic' },
            ]}
          />
        </Form.Item>
        <Form.Item field="baseUrl" label="Base URL">
          <Input id="model-provider-base-url" />
        </Form.Item>
        <Form.Item field="apiKey" label="API Key">
          <Input.TextArea id="model-provider-api-key" autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
        <Form.Item field="contextLimit" label="Context Limit">
          <Input id="model-provider-context-limit" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
