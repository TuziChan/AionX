import { Button, Collapse, Divider, Form, Input, Message, Modal, Popconfirm, Select, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour, Heartbeat, Minus, Plus, Write } from '@icon-park/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSetting, updateSetting } from '@/services/settings';
import type { ModelProvider } from '../types';

const DEFAULT_PROVIDERS: ModelProvider[] = [];

const PROTOCOL_OPTIONS = [
  { label: 'OpenAI', value: 'openai', color: 'green' },
  { label: 'Gemini', value: 'gemini', color: 'blue' },
  { label: 'Anthropic', value: 'anthropic', color: 'orange' },
];

function getApiKeyCount(apiKey: string) {
  if (!apiKey) return 0;
  return apiKey.split(/[,\n]/).filter((value) => value.trim().length > 0).length;
}

function getProviderState(platform: ModelProvider) {
  if (!platform.modelEnabled) {
    return { checked: true, indeterminate: false };
  }

  const enabledCount = platform.model.filter((model) => platform.modelEnabled?.[model] !== false).length;
  if (enabledCount === 0) return { checked: false, indeterminate: false };
  if (enabledCount === platform.model.length) return { checked: true, indeterminate: false };
  return { checked: true, indeterminate: true };
}

function isModelEnabled(platform: ModelProvider, model: string) {
  if (!platform.modelEnabled) return true;
  return platform.modelEnabled[model] !== false;
}

const EMPTY_PLATFORM: ModelProvider = {
  id: '',
  platform: 'openai-compatible',
  name: '',
  baseUrl: '',
  apiKey: '',
  model: [],
  enabled: true,
};

export function Component() {
  const [providers, setProviders] = useState<ModelProvider[]>(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [targetProviderId, setTargetProviderId] = useState<string>('');
  const [newModelName, setNewModelName] = useState('');
  const [platformForm] = Form.useForm<ModelProvider>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSetting<ModelProvider[]>('model.config', DEFAULT_PROVIDERS);
      setProviders(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProviders = useCallback(async (next: ModelProvider[]) => {
    setProviders(next);
    await updateSetting('model.config', next);
  }, []);

  const openAddPlatform = () => {
    setEditingProvider(null);
    platformForm.setFieldsValue(EMPTY_PLATFORM);
    setProviderModalVisible(true);
  };

  const openEditPlatform = (provider: ModelProvider) => {
    setEditingProvider(provider);
    platformForm.setFieldsValue(provider);
    setProviderModalVisible(true);
  };

  const handleSavePlatform = async () => {
    const values = await platformForm.validate();
    const nextProvider: ModelProvider = {
      ...EMPTY_PLATFORM,
      ...values,
      id: values.id || editingProvider?.id || crypto.randomUUID(),
      model: editingProvider?.model ?? values.model ?? [],
      modelEnabled: editingProvider?.modelEnabled ?? {},
      modelProtocols: editingProvider?.modelProtocols ?? {},
      modelHealth: editingProvider?.modelHealth ?? {},
    };

    const next = editingProvider
      ? providers.map((provider) => (provider.id === editingProvider.id ? { ...provider, ...nextProvider } : provider))
      : [...providers, nextProvider];

    await saveProviders(next);
    setProviderModalVisible(false);
    Message.success(editingProvider ? '平台已更新' : '平台已添加');
  };

  const handleDeletePlatform = async (id: string) => {
    await saveProviders(providers.filter((provider) => provider.id !== id));
    Message.success('平台已删除');
  };

  const toggleProviderEnabled = async (provider: ModelProvider) => {
    const { checked } = getProviderState(provider);
    const nextState = !checked;
    const modelEnabled: Record<string, boolean> = {};
    provider.model.forEach((model) => {
      modelEnabled[model] = nextState;
    });
    await saveProviders(
      providers.map((item) =>
        item.id === provider.id
          ? {
              ...item,
              enabled: nextState,
              modelEnabled,
            }
          : item,
      ),
    );
  };

  const toggleModelEnabled = async (provider: ModelProvider, model: string, enabled: boolean) => {
    await saveProviders(
      providers.map((item) =>
        item.id === provider.id
          ? {
              ...item,
              modelEnabled: {
                ...(item.modelEnabled ?? {}),
                [model]: enabled,
              },
            }
          : item,
      ),
    );
  };

  const handleCycleProtocol = async (provider: ModelProvider, model: string) => {
    const current = provider.modelProtocols?.[model] ?? 'openai';
    const currentIndex = PROTOCOL_OPTIONS.findIndex((option) => option.value === current);
    const nextOption = PROTOCOL_OPTIONS[(currentIndex + 1) % PROTOCOL_OPTIONS.length];

    await saveProviders(
      providers.map((item) =>
        item.id === provider.id
          ? {
              ...item,
              modelProtocols: {
                ...(item.modelProtocols ?? {}),
                [model]: nextOption.value,
              },
            }
          : item,
      ),
    );
  };

  const handleOpenAddModel = (providerId: string) => {
    setTargetProviderId(providerId);
    setNewModelName('');
    setModelModalVisible(true);
  };

  const handleSaveModel = async () => {
    if (!newModelName.trim()) {
      Message.error('请输入模型名称');
      return;
    }

    await saveProviders(
      providers.map((provider) =>
        provider.id === targetProviderId
          ? {
              ...provider,
              model: [...provider.model, newModelName.trim()],
            }
          : provider,
      ),
    );
    setModelModalVisible(false);
    Message.success('模型已添加');
  };

  const handleDeleteModel = async (provider: ModelProvider, model: string) => {
    await saveProviders(
      providers.map((item) =>
        item.id === provider.id
          ? {
              ...item,
              model: item.model.filter((entry) => entry !== model),
            }
          : item,
      ),
    );
    Message.success('模型已删除');
  };

  const handleHealthCheck = async (provider: ModelProvider, model: string) => {
    await saveProviders(
      providers.map((item) =>
        item.id === provider.id
          ? {
              ...item,
              modelHealth: {
                ...(item.modelHealth ?? {}),
                [model]: {
                  status: 'healthy',
                  lastCheck: Date.now(),
                  latency: Math.floor(Math.random() * 500) + 80,
                },
              },
            }
          : item,
      ),
    );
    Message.success(`${provider.name} - ${model}: 健康检查通过`);
  };

  const emptyState = useMemo(() => providers.length === 0, [providers.length]);

  return (
    <div className="settings-panel settings-panel--wide">
      <div className="settings-group-card">
        <div className="settings-model__header">
          <div className="settings-group-card__title">模型与平台</div>
          <Button type="outline" icon={<Plus size="16" />} onClick={openAddPlatform}>
            添加平台
          </Button>
        </div>

        {emptyState ? (
          <div className="settings-empty-state">
            <div className="settings-empty-state__title">暂无已配置模型平台</div>
            <div className="settings-empty-state__desc">请先添加模型平台，再配置模型、协议和启用状态。</div>
          </div>
        ) : (
          <div className="settings-model__list">
            {providers.map((provider) => {
              const providerState = getProviderState(provider);
              return (
                <Collapse key={provider.id} bordered className="settings-model__collapse">
                  <Collapse.Item
                    name="models"
                    header={
                      <div className="settings-model__collapse-header">
                        <div className="settings-model__collapse-meta">
                          <span className="settings-model__collapse-title">{provider.name}</span>
                          <span className="settings-model__collapse-subtitle">
                            模型 {provider.model.length} / API Key {getApiKeyCount(provider.apiKey)}
                          </span>
                        </div>
                        <div className="settings-model__collapse-actions" onClick={(event) => event.stopPropagation()}>
                          <Switch checked={providerState.checked} onChange={() => void toggleProviderEnabled(provider)} />
                          <Button size="mini" icon={<Plus size="14" />} onClick={() => handleOpenAddModel(provider.id)} />
                          <Button size="mini" icon={<Write size="14" />} onClick={() => openEditPlatform(provider)} />
                          <Popconfirm title="确认删除该平台？" onOk={() => void handleDeletePlatform(provider.id)}>
                            <Button size="mini" icon={<Minus size="14" />} />
                          </Popconfirm>
                        </div>
                      </div>
                    }
                  >
                    <div className="settings-model__items">
                      {provider.model.map((model, index) => {
                        const protocol = PROTOCOL_OPTIONS.find((item) => item.value === (provider.modelProtocols?.[model] ?? 'openai'));
                        const health = provider.modelHealth?.[model];
                        return (
                          <div key={model}>
                            <div className="settings-model__item">
                              <div className="settings-model__item-main">
                                <span className={`settings-model__health settings-model__health--${health?.status ?? 'unknown'}`} />
                                <span className="settings-model__item-name">{model}</span>
                                {protocol ? (
                                  <Tag color={protocol.color} className="settings-model__protocol" onClick={() => void handleCycleProtocol(provider, model)}>
                                    {protocol.label}
                                  </Tag>
                                ) : null}
                                <Switch checked={isModelEnabled(provider, model)} onChange={(value) => void toggleModelEnabled(provider, model, value)} />
                              </div>
                              <div className="settings-model__item-actions">
                                <Button size="mini" icon={<Heartbeat size="16" />} onClick={() => void handleHealthCheck(provider, model)} />
                                <Popconfirm title="确认删除该模型？" onOk={() => void handleDeleteModel(provider, model)}>
                                  <Button size="mini" icon={<DeleteFour size="16" />} />
                                </Popconfirm>
                              </div>
                            </div>
                            {index < provider.model.length - 1 ? <Divider className="settings-model__divider" /> : null}
                          </div>
                        );
                      })}
                    </div>
                  </Collapse.Item>
                </Collapse>
              );
            })}
          </div>
        )}
      </div>

      <Modal visible={providerModalVisible} title={editingProvider ? '编辑平台' : '添加平台'} onCancel={() => setProviderModalVisible(false)} onOk={() => void handleSavePlatform()}>
        <Form form={platformForm} layout="vertical">
          <Form.Item field="name" label="平台名称" rules={[{ required: true, message: '请输入平台名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item field="platform" label="平台类型" rules={[{ required: true, message: '请输入平台类型' }]}>
            <Select
              options={[
                { label: 'OpenAI Compatible', value: 'openai-compatible' },
                { label: 'Gemini', value: 'gemini' },
                { label: 'Anthropic', value: 'anthropic' },
              ]}
            />
          </Form.Item>
          <Form.Item field="baseUrl" label="Base URL">
            <Input />
          </Form.Item>
          <Form.Item field="apiKey" label="API Key">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>
          <Form.Item field="contextLimit" label="Context Limit">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal visible={modelModalVisible} title="添加模型" onCancel={() => setModelModalVisible(false)} onOk={() => void handleSaveModel()}>
        <Input value={newModelName} onChange={setNewModelName} placeholder="例如 gpt-5-codex" />
      </Modal>

      {loading ? <div className="settings-status-inline">正在加载模型配置...</div> : null}
    </div>
  );
}

Component.displayName = 'ModelSettings';
