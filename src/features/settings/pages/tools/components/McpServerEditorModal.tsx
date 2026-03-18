import { Form, Input, Modal, Select } from '@arco-design/web-react';
import { useEffect } from 'react';
import type { McpServer } from '@/bindings';
import { EMPTY_MCP_SERVER } from '@/features/settings/api/tools';
import type { McpServerFormValues } from '../types';

interface McpServerEditorModalProps {
  server: McpServer | null;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: McpServerFormValues, editingServer?: McpServer | null) => Promise<void>;
}

export function McpServerEditorModal({ server, visible, onCancel, onSubmit }: McpServerEditorModalProps) {
  const [form] = Form.useForm<McpServerFormValues>();

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (server) {
      form.setFieldsValue({
        name: server.name,
        type: server.type as McpServerFormValues['type'],
        command: server.command ?? '',
        args: server.args ?? '[]',
        env: server.env ?? '{}',
        url: server.url ?? '',
        oauthConfig: server.oauth_config ?? '{}',
      });
      return;
    }

    form.setFieldsValue(EMPTY_MCP_SERVER);
  }, [form, server, visible]);

  const handleOk = async () => {
    const values = await form.validate();
    await onSubmit(values, server);
  };

  return (
    <Modal
      visible={visible}
      className="settings-tools-page__editor-modal"
      title={server ? '编辑 MCP Server' : '添加 MCP Server'}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      unmountOnExit
    >
      <Form form={form} layout="vertical">
        <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input id="tools-server-name" />
        </Form.Item>
        <Form.Item field="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
          <Select
            options={[
              { label: 'stdio', value: 'stdio' },
              { label: 'sse', value: 'sse' },
              { label: 'http', value: 'http' },
            ]}
          />
        </Form.Item>
        <Form.Item field="command" label="命令">
          <Input id="tools-server-command" />
        </Form.Item>
        <Form.Item field="args" label="参数（JSON 数组）">
          <Input.TextArea id="tools-server-args" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item field="env" label="环境变量（JSON 对象）">
          <Input.TextArea id="tools-server-env" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item field="url" label="URL">
          <Input id="tools-server-url" />
        </Form.Item>
        <Form.Item field="oauthConfig" label="OAuth 配置（JSON）">
          <Input.TextArea id="tools-server-oauth-config" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
