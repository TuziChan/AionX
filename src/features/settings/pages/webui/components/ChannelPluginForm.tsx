import { Form, Input, Modal, Select, Switch } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import type { ChannelPlugin } from '@/bindings';
import { CHANNEL_PRESETS, EMPTY_CHANNEL_PLUGIN_FORM, getPresetLabel, parseChannelPluginForm } from '@/features/settings/api/webui';
import type { ChannelPluginFormValues } from '../types';

interface ChannelPluginFormProps {
  defaultType: ChannelPluginFormValues['type'];
  plugin: ChannelPlugin | null;
  saving: boolean;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ChannelPluginFormValues, editingPlugin?: ChannelPlugin | null) => Promise<void>;
}

export function ChannelPluginForm({ defaultType, plugin, saving, visible, onCancel, onSubmit }: ChannelPluginFormProps) {
  const [form] = Form.useForm<ChannelPluginFormValues>();
  const [selectedType, setSelectedType] = useState<ChannelPluginFormValues['type']>(defaultType);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (plugin) {
      const values = parseChannelPluginForm(plugin);
      setSelectedType(values.type);
      form.setFieldsValue(values);
      return;
    }

    setSelectedType(defaultType);
    form.setFieldsValue({
      ...EMPTY_CHANNEL_PLUGIN_FORM,
      type: defaultType,
      name: `${getPresetLabel(defaultType)} 通道`,
    });
  }, [defaultType, form, plugin, visible]);

  const handleTypeChange = (value: string) => {
    const nextType = value as ChannelPluginFormValues['type'];
    setSelectedType(nextType);

    if (plugin) {
      return;
    }

    form.setFieldsValue({
      ...form.getFieldsValue(),
      type: nextType,
      name: `${getPresetLabel(nextType)} 通道`,
    });
  };

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values, plugin);
  };

  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case 'telegram':
        return (
          <>
            <Form.Item field="botToken" label="Bot Token" rules={[{ required: true, message: '请输入 Bot Token' }]}>
              <Input.Password id="webui-channel-bot-token" />
            </Form.Item>
            <Form.Item field="webhookUrl" label="Webhook URL">
              <Input id="webui-channel-webhook-url" />
            </Form.Item>
          </>
        );
      case 'lark':
        return (
          <>
            <Form.Item field="appId" label="App ID" rules={[{ required: true, message: '请输入 App ID' }]}>
              <Input id="webui-channel-app-id" />
            </Form.Item>
            <Form.Item field="appSecret" label="App Secret" rules={[{ required: true, message: '请输入 App Secret' }]}>
              <Input.Password id="webui-channel-app-secret" />
            </Form.Item>
          </>
        );
      case 'dingtalk':
        return (
          <>
            <Form.Item field="appKey" label="App Key" rules={[{ required: true, message: '请输入 App Key' }]}>
              <Input id="webui-channel-app-key" />
            </Form.Item>
            <Form.Item field="appSecret" label="App Secret" rules={[{ required: true, message: '请输入 App Secret' }]}>
              <Input.Password id="webui-channel-app-secret" />
            </Form.Item>
          </>
        );
      case 'slack':
        return (
          <>
            <Form.Item field="botToken" label="Bot Token" rules={[{ required: true, message: '请输入 Bot Token' }]}>
              <Input.Password id="webui-channel-bot-token" />
            </Form.Item>
            <Form.Item field="signingSecret" label="Signing Secret">
              <Input.Password id="webui-channel-signing-secret" />
            </Form.Item>
          </>
        );
      case 'discord':
        return (
          <>
            <Form.Item field="botToken" label="Bot Token" rules={[{ required: true, message: '请输入 Bot Token' }]}>
              <Input.Password id="webui-channel-bot-token" />
            </Form.Item>
            <Form.Item field="applicationId" label="Application ID">
              <Input id="webui-channel-application-id" />
            </Form.Item>
          </>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      className="settings-webui-page__channel-modal"
      title={plugin ? '编辑频道插件' : '创建频道插件'}
      okButtonProps={{ loading: saving }}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item field="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select
            id="webui-channel-type"
            disabled={Boolean(plugin)}
            options={CHANNEL_PRESETS.map((preset) => ({ label: preset.label, value: preset.type }))}
            onChange={(value) => handleTypeChange(String(value))}
          />
        </Form.Item>
        <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input id="webui-channel-name" />
        </Form.Item>
        <Form.Item field="enabled" label="启用状态" triggerPropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item field="defaultModel" label="默认模型">
          <Input id="webui-channel-default-model" placeholder="例如 gemini-2.5-pro" />
        </Form.Item>
        {renderTypeSpecificFields()}
        <Form.Item field="extraConfig" label="额外配置（JSON）">
          <Input.TextArea id="webui-channel-extra-config" autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
