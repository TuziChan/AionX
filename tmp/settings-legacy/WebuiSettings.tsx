import { Button, Form, Input, Message, Modal, Select, Switch, Tabs } from '@arco-design/web-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { commands, type ChannelPlugin, type CreateChannelPlugin, type WebUiStatus } from '@/bindings';
import { getSetting, updateSetting } from '@/services/settings';
import { PreferenceRow } from '../components/PreferenceRow';

const DEFAULT_PORT = 9527;
const CHANNEL_PRESETS = [
  { type: 'telegram', label: 'Telegram', description: 'Bot Token / 默认模型 / 远程入口' },
  { type: 'lark', label: 'Lark', description: 'App 配置 / 默认模型 / 企业消息入口' },
  { type: 'dingtalk', label: 'DingTalk', description: '企业机器人配置 / 默认模型' },
  { type: 'slack', label: 'Slack', description: '预留频道入口' },
  { type: 'discord', label: 'Discord', description: '预留频道入口' },
] as const;

export function Component() {
  const [activeTab, setActiveTab] = useState<'webui' | 'channels'>('webui');
  const [status, setStatus] = useState<WebUiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [remote, setRemote] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [plugins, setPlugins] = useState<ChannelPlugin[]>([]);
  const [channelModalVisible, setChannelModalVisible] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<ChannelPlugin | null>(null);
  const [channelForm] = Form.useForm<CreateChannelPlugin>();
  const [selectedChannelType, setSelectedChannelType] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [statusResult, pluginsResult] = await Promise.all([
        commands.getWebuiStatus(),
        commands.listChannelPlugins(),
      ]);
      if (statusResult.status === 'ok') {
        setStatus(statusResult.data);
        const savedRemote = await getSetting<boolean>('webui.desktop.allowRemote', statusResult.data.remote);
        setRemote(savedRemote);
      } else {
        Message.error(`获取 WebUI 状态失败: ${String(statusResult.error)}`);
      }

      if (pluginsResult.status === 'ok') {
        setPlugins(pluginsResult.data);
      } else {
        Message.error(`获取频道插件失败: ${String(pluginsResult.error)}`);
      }
    } catch (error) {
      Message.error(`获取 WebUI 状态失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const displayUrl = useMemo(() => {
    const port = status?.port ?? DEFAULT_PORT;
    return `http://localhost:${port}`;
  }, [status?.port]);

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      setStarting(true);
      try {
        const result = await commands.startWebui(DEFAULT_PORT, remote);
        if (result.status === 'ok') {
          await Promise.all([
            updateSetting('webui.desktop.enabled', true),
            updateSetting('webui.desktop.allowRemote', result.data.remote),
            updateSetting('webui.desktop.port', result.data.port),
          ]);
          setStatus({
            running: true,
            port: result.data.port,
            remote: result.data.remote,
            admin_username: result.data.admin_username,
            initial_password: result.data.initial_password,
          });
          Message.success('WebUI 已启动');
        } else {
          Message.error(`启动 WebUI 失败: ${String(result.error)}`);
        }
      } catch (error) {
        Message.error(`启动 WebUI 失败: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setStarting(false);
      }
      return;
    }

    setStopping(true);
    try {
      const result = await commands.stopWebui();
      if (result.status === 'ok') {
        await updateSetting('webui.desktop.enabled', false);
        setStatus((prev) =>
          prev
            ? { ...prev, running: false, port: null, initial_password: null }
            : { running: false, port: null, remote, admin_username: 'admin', initial_password: null },
        );
        Message.success('WebUI 已停止');
      } else {
        Message.error(`停止 WebUI 失败: ${String(result.error)}`);
      }
    } catch (error) {
      Message.error(`停止 WebUI 失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setStopping(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Message.error('请输入新密码');
      return;
    }
    if (newPassword.length < 8) {
      Message.error('新密码至少 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      Message.error('两次输入的密码不一致');
      return;
    }

    setChangingPassword(true);
    try {
      const result = await commands.changeWebuiPassword(newPassword);
      if (result.status === 'ok') {
        setStatus((prev) => (prev ? { ...prev, initial_password: null } : prev));
        setNewPassword('');
        setConfirmPassword('');
        Message.success('管理员密码已更新');
      } else {
        Message.error(`修改密码失败: ${String(result.error)}`);
      }
    } catch (error) {
      Message.error(`修改密码失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const result = await commands.resetWebuiPassword();
      if (result.status === 'ok') {
        setStatus((prev) => (prev ? { ...prev, initial_password: result.data.password } : prev));
        Message.success('已生成新的随机密码');
      } else {
        Message.error(`重置密码失败: ${String(result.error)}`);
      }
    } catch (error) {
      Message.error(`重置密码失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setResettingPassword(false);
    }
  };

  const openAddPlugin = (channelType?: string) => {
    setEditingPlugin(null);
    setSelectedChannelType(channelType ?? null);
    channelForm.setFieldsValue({
      type: channelType ?? 'telegram',
      name: '',
      config: '{}',
    });
    setChannelModalVisible(true);
  };

  const openEditPlugin = (plugin: ChannelPlugin) => {
    setEditingPlugin(plugin);
    setSelectedChannelType(plugin.type);
    channelForm.setFieldsValue({
      type: plugin.type,
      name: plugin.name,
      config: plugin.config ?? '{}',
    });
    setChannelModalVisible(true);
  };

  const handleSavePlugin = async () => {
    const values = await channelForm.validate();
    if (editingPlugin) {
      const result = await commands.updateChannelPlugin(editingPlugin.id, {
        name: values.name,
        enabled: editingPlugin.enabled,
        config: values.config,
        status: editingPlugin.status,
      });
      if (result.status !== 'ok') {
        Message.error(`保存失败: ${String(result.error)}`);
        return;
      }
      Message.success('频道插件已更新');
    } else {
      const result = await commands.createChannelPlugin(values);
      if (result.status !== 'ok') {
        Message.error(`创建失败: ${String(result.error)}`);
        return;
      }
      Message.success('频道插件已创建');
    }
    setChannelModalVisible(false);
    void loadStatus();
  };

  const handleTogglePlugin = async (plugin: ChannelPlugin, enabled: boolean) => {
    const result = await commands.updateChannelPlugin(plugin.id, {
      name: plugin.name,
      enabled,
      config: plugin.config,
      status: plugin.status,
    });
    if (result.status !== 'ok') {
      Message.error(`更新失败: ${String(result.error)}`);
      return;
    }
    void loadStatus();
  };

  return (
    <div className="settings-panel">
      <Tabs activeTab={activeTab} onChange={(key) => setActiveTab((key as 'webui' | 'channels') || 'webui')} type="line">
        <Tabs.TabPane key="webui" title="WebUI" />
        <Tabs.TabPane key="channels" title="Channels" />
      </Tabs>

      {activeTab === 'webui' ? (
        <>
          <div className="settings-group-card">
            <div className="settings-group-card__body">
              <PreferenceRow
                label="启用 WebUI"
                extra={starting ? <span className="settings-status-inline">启动中</span> : null}
              >
                  <Switch checked={Boolean(status?.running)} loading={starting || stopping} onChange={(value) => void handleToggle(value)} />
              </PreferenceRow>

              <PreferenceRow
                label="访问地址"
                description={status?.running ? '当前 WebUI 已启动，可直接在浏览器访问。' : '启动后会在这里显示访问地址。'}
              >
                <Input value={displayUrl} readOnly />
              </PreferenceRow>

              <PreferenceRow
                label="允许远程访问"
                description="当前版本先保留与 AionUi 相同的信息入口，后续再补齐局域网地址与二维码登录。"
              >
                <Switch
                  checked={remote}
                  onChange={(value) => {
                    setRemote(value);
                    void updateSetting('webui.desktop.allowRemote', value);
                  }}
                  disabled={Boolean(status?.running)}
                />
              </PreferenceRow>
            </div>
          </div>

          <div className="settings-group-card">
            <div className="settings-group-card__title">登录信息</div>
            <div className="settings-group-card__body">
              <PreferenceRow label="用户名">
                <Input value={status?.admin_username ?? 'admin'} readOnly />
              </PreferenceRow>
              <PreferenceRow
                label="初始密码"
                description={status?.initial_password ? '首次创建或重置后会在此显示一次。' : '没有可显示的初始密码时，不会重复暴露历史密码。'}
              >
                <Input value={status?.initial_password ?? '******'} readOnly />
              </PreferenceRow>
              <PreferenceRow label="状态">
                <Input value={loading ? '读取中' : status?.running ? '运行中' : '未启动'} readOnly />
              </PreferenceRow>
            </div>
          </div>

          <div className="settings-group-card">
            <div className="settings-group-card__title">密码管理</div>
            <div className="settings-group-card__body">
              <PreferenceRow label="新密码">
                <Input.Password value={newPassword} onChange={setNewPassword} placeholder="至少 8 位" />
              </PreferenceRow>
              <PreferenceRow label="确认新密码">
                <Input.Password value={confirmPassword} onChange={setConfirmPassword} placeholder="再次输入新密码" />
              </PreferenceRow>
              <div className="settings-inline-actions">
                <Button type="primary" loading={changingPassword} onClick={() => void handleChangePassword()}>
                  设置新密码
                </Button>
                <Button loading={resettingPassword} onClick={() => void handleResetPassword()}>
                  重置随机密码
                </Button>
                <Button onClick={() => void loadStatus()} disabled={loading}>
                  刷新状态
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="settings-group-card">
          <div className="settings-model__header">
            <div className="settings-group-card__title">频道插件</div>
            <Button onClick={() => openAddPlugin()}>新增频道</Button>
          </div>
          <div className="settings-tools__server-list">
            {CHANNEL_PRESETS.map((preset, index) => {
              const plugin = plugins.find((item) => item.type === preset.type) ?? null;

              return (
                <div key={preset.type}>
                  <div className="settings-tools__server-item">
                    <div className="settings-tools__server-main">
                      <div className="settings-tools__server-title">{preset.label}</div>
                      <div className="settings-tools__server-meta">
                        <span>{preset.description}</span>
                        <span>{plugin ? plugin.status : '未创建'}</span>
                      </div>
                    </div>
                    <div className="settings-tools__server-actions">
                      <Switch
                        checked={Boolean(plugin?.enabled)}
                        disabled={!plugin}
                        onChange={(value) => plugin && void handleTogglePlugin(plugin, value)}
                      />
                      <Button size="mini" onClick={() => (plugin ? openEditPlugin(plugin) : openAddPlugin(preset.type))}>
                        {plugin ? '编辑' : '创建'}
                      </Button>
                    </div>
                  </div>
                  {index < CHANNEL_PRESETS.length - 1 ? <div className="settings-model__divider" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal visible={channelModalVisible} title={editingPlugin ? '编辑频道插件' : '创建频道插件'} onCancel={() => setChannelModalVisible(false)} onOk={() => void handleSavePlugin()}>
        <Form form={channelForm} layout="vertical">
          <Form.Item field="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              value={selectedChannelType ?? undefined}
              options={[
                { label: 'telegram', value: 'telegram' },
                { label: 'lark', value: 'lark' },
                { label: 'dingtalk', value: 'dingtalk' },
                { label: 'slack', value: 'slack' },
                { label: 'discord', value: 'discord' },
              ]}
              onChange={(value) => setSelectedChannelType(String(value))}
            />
          </Form.Item>
          <Form.Item field="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item field="config" label="配置(JSON)">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

Component.displayName = 'WebuiSettings';
