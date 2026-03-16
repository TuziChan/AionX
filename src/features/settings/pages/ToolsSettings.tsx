import { Button, Divider, Form, Input, Message, Modal, Popconfirm, Select, Switch } from '@arco-design/web-react';
import { Plus } from '@icon-park/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { commands, type CreateMcpServer, type McpServer } from '@/bindings';
import { getSetting, updateSetting } from '@/services/settings';
import type { ImageGenerationModel, ModelProvider } from '../types';
import { PreferenceRow } from '../components/PreferenceRow';

const MCP_TYPE_OPTIONS = [
  { label: 'stdio', value: 'stdio' },
  { label: 'sse', value: 'sse' },
  { label: 'http', value: 'http' },
];

const EMPTY_SERVER: CreateMcpServer = {
  name: '',
  type: 'stdio',
  command: '',
  args: '[]',
  env: '{}',
  url: '',
  oauth_config: '{}',
};

export function Component() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState<ImageGenerationModel | null>(null);
  const [availableImageModels, setAvailableImageModels] = useState<Array<{ label: string; value: string }>>([]);
  const [form] = Form.useForm<CreateMcpServer>();

  const loadServers = useCallback(async () => {
    setLoading(true);
    try {
      const [mcpResult, modelConfig] = await Promise.all([
        commands.getMcpServers(),
        getSetting<ModelProvider[]>('model.config', []),
      ]);

      if (mcpResult.status === 'ok') {
        setServers(mcpResult.data);
      } else {
        Message.error(`加载 MCP 服务器失败: ${String(mcpResult.error)}`);
      }

      const imageCandidates = modelConfig.flatMap((provider) =>
        provider.model
          .filter((modelName) => {
            const value = modelName.toLowerCase();
            return value.includes('image') || value.includes('banana');
          })
          .map((modelName) => ({
            label: `${provider.name} / ${modelName}`,
            value: `${provider.id}|${modelName}`,
          })),
      );

      setAvailableImageModels(imageCandidates);
      setImageModel(await getSetting<ImageGenerationModel | null>('tools.imageGenerationModel', null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServers();
  }, [loadServers]);

  const openAddModal = () => {
    setEditingServer(null);
    form.setFieldsValue(EMPTY_SERVER);
    setShowModal(true);
  };

  const openEditModal = (server: McpServer) => {
    setEditingServer(server);
    form.setFieldsValue({
      name: server.name,
      type: server.type,
      command: server.command ?? '',
      args: server.args ?? '[]',
      env: server.env ?? '{}',
      url: server.url ?? '',
      oauth_config: server.oauth_config ?? '{}',
    });
    setShowModal(true);
  };

  const handleSaveServer = async () => {
    const values = await form.validate();

    if (editingServer) {
      const result = await commands.updateMcpServer(editingServer.id, {
        name: values.name,
        command: values.command,
        args: values.args,
        env: values.env,
        url: values.url,
        oauth_config: values.oauth_config,
        enabled: editingServer.enabled,
      });
      if (result.status !== 'ok') {
        Message.error(`更新失败: ${String(result.error)}`);
        return;
      }
      Message.success('MCP 服务器已更新');
    } else {
      const result = await commands.addMcpServer(values);
      if (result.status !== 'ok') {
        Message.error(`新增失败: ${String(result.error)}`);
        return;
      }
      Message.success('MCP 服务器已添加');
    }

    setShowModal(false);
    void loadServers();
  };

  const handleDeleteServer = async (server: McpServer) => {
    const result = await commands.removeMcpServer(server.id);
    if (result.status !== 'ok') {
      Message.error(`删除失败: ${String(result.error)}`);
      return;
    }
    Message.success('MCP 服务器已删除');
    void loadServers();
  };

  const handleToggleServer = async (server: McpServer, checked: boolean) => {
    const result = await commands.updateMcpServer(server.id, {
      enabled: checked,
      name: server.name,
      command: server.command,
      args: server.args,
      env: server.env,
      url: server.url,
      oauth_config: server.oauth_config,
    });
    if (result.status !== 'ok') {
      Message.error(`切换失败: ${String(result.error)}`);
      return;
    }
    void loadServers();
  };

  const handleTestServer = async (server: McpServer) => {
    setTestingServerId(server.id);
    try {
      const result = await commands.testMcpConnection(server.id);
      if (result.status === 'ok') {
        Message.success(result.data);
      } else {
        Message.error(String(result.error));
      }
    } finally {
      setTestingServerId(null);
    }
  };

  const imageGenerationEnabled = useMemo(() => Boolean(imageModel?.switch), [imageModel?.switch]);

  const handleChangeImageModel = async (value: string) => {
    const [providerId, modelName] = value.split('|');
    const modelConfig = await getSetting<ModelProvider[]>('model.config', []);
    const provider = modelConfig.find((item) => item.id === providerId);
    if (!provider) return;

    const next: ImageGenerationModel = {
      ...provider,
      useModel: modelName,
      switch: imageModel?.switch ?? false,
    };

    setImageModel(next);
    await updateSetting('tools.imageGenerationModel', next);
  };

  const handleToggleImageGeneration = async (checked: boolean) => {
    const next = imageModel ? { ...imageModel, switch: checked } : null;
    setImageModel(next);
    await updateSetting('tools.imageGenerationModel', next);
  };

  return (
    <div className="settings-panel settings-panel--wide">
      <div className="settings-group-card">
        <div className="settings-model__header">
          <div className="settings-group-card__title">MCP 工具配置</div>
          <Button type="outline" icon={<Plus size="16" />} onClick={openAddModal}>
            添加服务器
          </Button>
        </div>

        <div className="settings-tools__server-list">
          {servers.length === 0 ? (
            <div className="settings-empty-state">
              <div className="settings-empty-state__title">暂无 MCP 服务器</div>
              <div className="settings-empty-state__desc">添加 stdio / sse / http 服务器后可在这里管理、测试和启用。</div>
            </div>
          ) : (
            servers.map((server, index) => (
              <div key={server.id}>
                <div className="settings-tools__server-item">
                  <div className="settings-tools__server-main">
                    <div className="settings-tools__server-title">{server.name}</div>
                    <div className="settings-tools__server-meta">
                      <span>{server.type}</span>
                      <span>{server.url || server.command || '未配置地址/命令'}</span>
                    </div>
                  </div>
                  <div className="settings-tools__server-actions">
                    <Switch checked={server.enabled} onChange={(value) => void handleToggleServer(server, value)} />
                    <Button size="mini" loading={testingServerId === server.id} onClick={() => void handleTestServer(server)}>
                      测试
                    </Button>
                    <Button size="mini" onClick={() => openEditModal(server)}>
                      编辑
                    </Button>
                    <Popconfirm title="确认删除该 MCP 服务器？" onOk={() => void handleDeleteServer(server)}>
                      <Button size="mini" status="danger">
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
                {index < servers.length - 1 ? <Divider className="settings-model__divider" /> : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="settings-group-card">
        <div className="settings-group-card__title">图像生成</div>
        <div className="settings-group-card__body">
          <PreferenceRow label="启用图像生成">
            <Switch checked={imageGenerationEnabled} onChange={(value) => void handleToggleImageGeneration(value)} disabled={!imageModel} />
          </PreferenceRow>
          <PreferenceRow label="图像生成模型">
            <Select value={imageModel ? `${imageModel.id}|${imageModel.useModel}` : undefined} options={availableImageModels} onChange={(value) => void handleChangeImageModel(String(value))} placeholder={availableImageModels.length ? '选择模型' : '暂无可用图像模型'} />
          </PreferenceRow>
        </div>
      </div>

      <Modal visible={showModal} title={editingServer ? '编辑 MCP 服务器' : '添加 MCP 服务器'} onCancel={() => setShowModal(false)} onOk={() => void handleSaveServer()}>
        <Form form={form} layout="vertical">
          <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item field="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={MCP_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item field="command" label="命令">
            <Input />
          </Form.Item>
          <Form.Item field="args" label="参数(JSON 数组)">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item field="env" label="环境变量(JSON 对象)">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
          <Form.Item field="url" label="URL">
            <Input />
          </Form.Item>
          <Form.Item field="oauth_config" label="OAuth 配置(JSON)">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>

      {loading ? <div className="settings-status-inline">正在加载工具设置...</div> : null}
    </div>
  );
}

Component.displayName = 'ToolsSettings';
