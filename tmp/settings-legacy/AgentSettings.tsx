import { Alert, Button, Form, Input, Message, Modal, Select, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour, Plus, Robot } from '@icon-park/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { commands, type AssistantPlugin, type DetectedAgent } from '@/bindings';
import { getSetting, updateSetting } from '@/services/settings';

type AssistantSource = 'builtin' | 'custom';

interface AssistantEntry {
  id: string;
  source: AssistantSource;
  name: string;
  description: string;
  avatar: string;
  mainAgent: string;
  enabled: boolean;
  prompt: string;
  pluginId?: string;
}

const BUILTIN_ASSISTANTS: AssistantEntry[] = [
  { id: 'builtin-star-office-helper', source: 'builtin', name: 'Star Office 助手', description: '用于在 Aion 预览中安装、连接并排查 Star-Office-UI 可视化问题。', avatar: '📺', mainAgent: 'gemini', enabled: true, prompt: '' },
  { id: 'builtin-openclaw-setup', source: 'builtin', name: 'OpenClaw 部署专家', description: 'OpenClaw 安装、部署、配置和故障排查专家。', avatar: '🦞', mainAgent: 'gemini', enabled: true, prompt: '' },
  { id: 'builtin-cowork', source: 'builtin', name: 'Cowork', description: '具有文件操作、文档处理和多步骤工作流规划的自主任务执行助手。', avatar: '🛠️', mainAgent: 'gemini', enabled: true, prompt: '' },
  { id: 'builtin-ui-ux-pro-max', source: 'builtin', name: 'UI/UX 专业设计师', description: '专业 UI/UX 设计智能助手。', avatar: '🎨', mainAgent: 'gemini', enabled: true, prompt: '' },
  { id: 'builtin-planning-with-files', source: 'builtin', name: '文件规划助手', description: 'Manus 风格的文件规划，用于复杂任务。', avatar: '📋', mainAgent: 'gemini', enabled: true, prompt: '' },
];

interface AssistantPluginConfig {
  description?: string;
  avatar?: string;
  mainAgent?: string;
  prompt?: string;
}

function parseAssistantConfig(config: string | null): AssistantPluginConfig {
  if (!config) return {};
  try {
    return JSON.parse(config) as AssistantPluginConfig;
  } catch {
    return {};
  }
}

function stringifyAssistantConfig(config: AssistantPluginConfig) {
  return JSON.stringify(config, null, 2);
}

export function Component() {
  const [assistants, setAssistants] = useState<AssistantEntry[]>([]);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [detectedAgents, setDetectedAgents] = useState<DetectedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customPluginId, setCustomPluginId] = useState<string | null>(null);
  const [form] = Form.useForm<AssistantEntry>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pluginsResult, detectResult] = await Promise.all([
        commands.listAssistantPlugins(),
        commands.detectAgents(),
      ]);

      const builtinOverrides = await Promise.all(
        BUILTIN_ASSISTANTS.map(async (assistant) => {
          const saved = await getSetting<Partial<AssistantEntry>>(`assistant.builtin.${assistant.id}`, {});
          return {
            ...assistant,
            mainAgent: saved.mainAgent ?? assistant.mainAgent,
            enabled: saved.enabled ?? assistant.enabled,
          };
        }),
      );

      const customAssistants: AssistantEntry[] =
        pluginsResult.status === 'ok'
          ? pluginsResult.data.map((plugin: AssistantPlugin) => {
              const parsed = parseAssistantConfig(plugin.config);
              return {
                id: `custom-${plugin.id}`,
                source: 'custom',
                name: plugin.name,
                description: parsed.description ?? '',
                avatar: parsed.avatar ?? '🤖',
                mainAgent: parsed.mainAgent ?? 'gemini',
                enabled: plugin.enabled,
                prompt: parsed.prompt ?? '',
                pluginId: plugin.id,
              };
            })
          : [];

      setAssistants([...builtinOverrides, ...customAssistants]);
      setActiveAssistantId((prev) => prev ?? builtinOverrides[0]?.id ?? customAssistants[0]?.id ?? null);

      if (detectResult.status === 'ok') {
        setDetectedAgents(detectResult.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeAssistant = useMemo(
    () => assistants.find((assistant) => assistant.id === activeAssistantId) ?? null,
    [activeAssistantId, assistants],
  );

  const agentOptions = useMemo(
    () =>
      detectedAgents.map((agent) => ({
        label: `${agent.name}${agent.version ? ` (${agent.version})` : ''}`,
        value: agent.agent_type,
      })),
    [detectedAgents],
  );

  const openCreate = () => {
    setIsCreating(true);
    setCustomPluginId(null);
    form.setFieldsValue({
      id: '',
      source: 'custom',
      name: '',
      description: '',
      avatar: '🤖',
      mainAgent: detectedAgents[0]?.agent_type ?? 'gemini',
      enabled: true,
      prompt: '',
    });
    setEditorVisible(true);
  };

  const openEdit = (assistant: AssistantEntry) => {
    setIsCreating(false);
    setCustomPluginId(assistant.pluginId ?? null);
    form.setFieldsValue(assistant);
    setEditorVisible(true);
  };

  const handleSave = async () => {
    const values = await form.validate();

    if (values.source === 'builtin') {
      await updateSetting(`assistant.builtin.${values.id}`, {
        mainAgent: values.mainAgent,
        enabled: values.enabled,
      });
      Message.success('内置助手配置已更新');
      setEditorVisible(false);
      void load();
      return;
    }

    const config = stringifyAssistantConfig({
      description: values.description,
      avatar: values.avatar,
      mainAgent: values.mainAgent,
      prompt: values.prompt,
    });

    if (isCreating) {
      const result = await commands.createAssistantPlugin({
        type: 'custom-assistant',
        name: values.name,
        config,
      });
      if (result.status !== 'ok') {
        Message.error(`创建失败: ${String(result.error)}`);
        return;
      }
      Message.success('自定义助手已创建');
    } else if (customPluginId) {
      const result = await commands.updateAssistantPlugin(customPluginId, {
        name: values.name,
        enabled: values.enabled,
        config,
        status: null,
      });
      if (result.status !== 'ok') {
        Message.error(`保存失败: ${String(result.error)}`);
        return;
      }
      Message.success('自定义助手已更新');
    }

    setEditorVisible(false);
    void load();
  };

  const handleDelete = async () => {
    if (!activeAssistant?.pluginId) return;
    const result = await commands.removeAssistantPlugin(activeAssistant.pluginId);
    if (result.status !== 'ok') {
      Message.error(`删除失败: ${String(result.error)}`);
      return;
    }
    Message.success('自定义助手已删除');
    setActiveAssistantId(null);
    void load();
  };

  return (
    <div className="settings-panel settings-panel--wide">
      <div className="settings-assistants">
        <div className="settings-assistants__list">
          <div className="settings-model__header">
            <div className="settings-group-card__title">智能助手</div>
            <Button type="outline" icon={<Plus size="16" />} onClick={openCreate}>
              新建助手
            </Button>
          </div>

          <div className="settings-assistants__items">
            {assistants.map((assistant) => (
              <button
                key={assistant.id}
                type="button"
                className={`settings-assistants__item ${activeAssistantId === assistant.id ? 'settings-assistants__item--active' : ''}`}
                onClick={() => setActiveAssistantId(assistant.id)}
              >
                <div className="settings-assistants__avatar">{assistant.avatar || <Robot size={18} />}</div>
                <div className="settings-assistants__meta">
                  <div className="settings-assistants__name">{assistant.name}</div>
                  <div className="settings-assistants__desc">{assistant.description}</div>
                </div>
                <Tag color={assistant.source === 'builtin' ? 'blue' : 'green'}>
                  {assistant.source === 'builtin' ? 'Builtin' : 'Custom'}
                </Tag>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-assistants__detail">
          {activeAssistant ? (
            <>
              <div className="settings-model__header">
                <div className="settings-group-card__title">{activeAssistant.name}</div>
                <div className="settings-inline-actions">
                  <Button onClick={() => openEdit(activeAssistant)}>编辑</Button>
                  {activeAssistant.source === 'custom' ? (
                    <Button status="danger" icon={<DeleteFour size="16" />} onClick={() => void handleDelete()}>
                      删除
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="settings-group-card__body">
                <div className="settings-assistants__hero">
                  <div className="settings-assistants__hero-avatar">{activeAssistant.avatar}</div>
                  <div>
                    <div className="settings-assistants__hero-name">{activeAssistant.name}</div>
                    <div className="settings-assistants__hero-desc">{activeAssistant.description}</div>
                  </div>
                </div>
                <div className="settings-assistants__info">
                  <div>主 Agent: {activeAssistant.mainAgent}</div>
                  <div>启用状态: {activeAssistant.enabled ? '已启用' : '已禁用'}</div>
                </div>
                <div className="settings-assistants__prompt">
                  <div className="settings-assistants__prompt-title">Prompt / Rules</div>
                  <pre>{activeAssistant.prompt || '暂无预设规则内容'}</pre>
                </div>
              </div>
            </>
          ) : (
            <Alert type="info" content="请选择一个助手进行查看或编辑。" />
          )}
        </div>
      </div>

      <Modal
        visible={editorVisible}
        title={isCreating ? '创建助手' : '编辑助手'}
        onCancel={() => setEditorVisible(false)}
        onOk={() => void handleSave()}
        className="settings-assistants__modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item field="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item field="source" hidden>
            <Input />
          </Form.Item>
          <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input readOnly={!isCreating && activeAssistant?.source === 'builtin'} />
          </Form.Item>
          <Form.Item field="description" label="描述">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} readOnly={!isCreating && activeAssistant?.source === 'builtin'} />
          </Form.Item>
          <Form.Item field="avatar" label="头像">
            <Input readOnly={!isCreating && activeAssistant?.source === 'builtin'} />
          </Form.Item>
          <Form.Item field="mainAgent" label="主 Agent">
            <Select options={agentOptions} />
          </Form.Item>
          <Form.Item field="enabled" label="启用">
            <Switch />
          </Form.Item>
          <Form.Item field="prompt" label="Prompt / Rules">
            <Input.TextArea autoSize={{ minRows: 6, maxRows: 12 }} readOnly={!isCreating && activeAssistant?.source === 'builtin'} />
          </Form.Item>
        </Form>
      </Modal>

      {loading ? <Alert type="info" content="正在加载助手列表..." /> : null}
    </div>
  );
}

Component.displayName = 'AgentSettings';
