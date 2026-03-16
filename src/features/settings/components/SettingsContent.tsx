import { Button, Card, Input, Message, Select, Slider, Switch, Tag } from '@arco-design/web-react';
import { useEffect, useMemo, useState } from 'react';
import { getSettingsTabById } from './settingsConfig';
import { getSettingsSections, type SettingsFieldDefinition } from './settingsSchema';
import { commands, type WebUiStatus } from '../../../bindings';

function renderField(field: SettingsFieldDefinition) {
  switch (field.type) {
    case 'input':
      return <Input value={String(field.value)} readOnly />;
    case 'select':
      return (
        <Select
          disabled
          value={String(field.value)}
          options={(field.options || []).map((option) => ({ label: option, value: option }))}
        />
      );
    case 'switch':
      return <Switch checked={Boolean(field.value)} disabled />;
    case 'slider':
      return <Slider value={Number(field.value)} disabled />;
    default:
      return null;
  }
}

export function SettingsContent({ tabId }: { tabId: string }) {
  const tab = getSettingsTabById(tabId);
  const sections = getSettingsSections(tabId);
  const isWebuiTab = tabId === 'webui';
  const [webuiStatus, setWebuiStatus] = useState<WebUiStatus | null>(null);
  const [webuiLoading, setWebuiLoading] = useState(false);
  const [webuiStarting, setWebuiStarting] = useState(false);
  const [webuiStopping, setWebuiStopping] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const loadWebuiStatus = async () => {
    setWebuiLoading(true);
    try {
      const result = await commands.getWebuiStatus();
      if (result.status === 'ok') {
        setWebuiStatus(result.data);
      } else {
        Message.error(`获取 WebUI 状态失败: ${String(result.error)}`);
      }
    } catch (error) {
      Message.error(`获取 WebUI 状态失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setWebuiLoading(false);
    }
  };

  useEffect(() => {
    if (!isWebuiTab) return;
    void loadWebuiStatus();
  }, [isWebuiTab]);

  const webuiUrl = useMemo(() => {
    if (!webuiStatus?.running || !webuiStatus.port) {
      return 'http://127.0.0.1:9527';
    }
    const host = webuiStatus.remote ? '127.0.0.1' : '127.0.0.1';
    return `http://${host}:${webuiStatus.port}`;
  }, [webuiStatus]);

  const handleStartWebui = async () => {
    setWebuiStarting(true);
    try {
      const result = await commands.startWebui(9527, false);
      if (result.status === 'ok') {
        setWebuiStatus({
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
      setWebuiStarting(false);
    }
  };

  const handleStopWebui = async () => {
    setWebuiStopping(true);
    try {
      const result = await commands.stopWebui();
      if (result.status === 'ok') {
        setWebuiStatus((prev) =>
          prev
            ? {
                ...prev,
                running: false,
                port: null,
                initial_password: null,
              }
            : {
                running: false,
                port: null,
                remote: false,
                admin_username: 'admin',
                initial_password: null,
              },
        );
        Message.success('WebUI 已停止');
      } else {
        Message.error(`停止 WebUI 失败: ${String(result.error)}`);
      }
    } catch (error) {
      Message.error(`停止 WebUI 失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setWebuiStopping(false);
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
        setWebuiStatus((prev) =>
          prev
            ? { ...prev, initial_password: null }
            : {
                running: false,
                port: null,
                remote: false,
                admin_username: 'admin',
                initial_password: null,
              },
        );
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
        setWebuiStatus((prev) =>
          prev
            ? { ...prev, initial_password: result.data.password }
            : {
                running: false,
                port: null,
                remote: false,
                admin_username: 'admin',
                initial_password: result.data.password,
              },
        );
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

  if (isWebuiTab) {
    return (
      <div className="settings-page">
        <div className="settings-page__hero">
          <div>
            <p className="settings-page__eyebrow">{tab ? tab.label : 'WebUI'}</p>
            <h1 className="settings-page__title">{tab ? tab.title : 'WebUI'}</h1>
            <p className="settings-page__subtitle">
              对齐 AionUi 的首启管理员凭证展示逻辑。首次启动 WebUI 时会自动创建 `admin` 用户，并在此显示一次初始密码。
            </p>
          </div>
          <Tag color={webuiStatus?.running ? 'green' : 'gray'}>
            {webuiStatus?.running ? 'Running' : 'Stopped'}
          </Tag>
        </div>

        <div className="settings-page__grid">
          <Card className="settings-card" bordered={false}>
            <div className="settings-card__header">
              <h2>服务状态</h2>
            </div>
            <div className="settings-card__body">
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">运行状态</div>
                </div>
                <div className="settings-field__control">
                  <Tag color={webuiStatus?.running ? 'green' : 'gray'}>
                    {webuiLoading ? '读取中' : webuiStatus?.running ? '运行中' : '未启动'}
                  </Tag>
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">访问地址</div>
                </div>
                <div className="settings-field__control">
                  <Input value={webuiUrl} readOnly />
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">启动控制</div>
                </div>
                <div className="settings-field__control" style={{ display: 'flex', gap: 12 }}>
                  <Button type="primary" loading={webuiStarting} disabled={webuiStatus?.running} onClick={() => void handleStartWebui()}>
                    启动 WebUI
                  </Button>
                  <Button status="danger" loading={webuiStopping} disabled={!webuiStatus?.running} onClick={() => void handleStopWebui()}>
                    停止 WebUI
                  </Button>
                  <Button onClick={() => void loadWebuiStatus()} disabled={webuiLoading}>
                    刷新状态
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="settings-card" bordered={false}>
            <div className="settings-card__header">
              <h2>登录信息</h2>
            </div>
            <div className="settings-card__body">
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">用户名</div>
                </div>
                <div className="settings-field__control">
                  <Input value={webuiStatus?.admin_username ?? 'admin'} readOnly />
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">初始密码</div>
                </div>
                <div className="settings-field__control">
                  <Input
                    value={webuiStatus?.initial_password ?? '首次创建 admin 后会在这里显示；后续不会重复暴露'}
                    readOnly
                  />
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">说明</div>
                </div>
                <div className="settings-field__control">
                  <Input
                    value="行为对齐 AionUi：用户名固定 admin，密码首启随机生成，并通过状态接口返回给设置页展示。"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="settings-card" bordered={false}>
            <div className="settings-card__header">
              <h2>密码管理</h2>
            </div>
            <div className="settings-card__body">
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">新密码</div>
                </div>
                <div className="settings-field__control">
                  <Input.Password value={newPassword} onChange={setNewPassword} placeholder="至少 8 位" />
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">确认新密码</div>
                </div>
                <div className="settings-field__control">
                  <Input.Password value={confirmPassword} onChange={setConfirmPassword} placeholder="再次输入新密码" />
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field__meta">
                  <div className="settings-field__label">操作</div>
                </div>
                <div className="settings-field__control" style={{ display: 'flex', gap: 12 }}>
                  <Button type="primary" loading={changingPassword} onClick={() => void handleChangePassword()}>
                    设置新密码
                  </Button>
                  <Button loading={resettingPassword} onClick={() => void handleResetPassword()}>
                    重置随机密码
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__hero">
        <div>
          <p className="settings-page__eyebrow">{tab ? tab.label : 'Extension'}</p>
          <h1 className="settings-page__title">{tab ? tab.title : `扩展设置 · ${tabId}`}</h1>
          <p className="settings-page__subtitle">
            {tab ? tab.description : '扩展设置页已预留和内置页同级的视觉包裹层。'}
          </p>
        </div>
        <Tag color="blue">{tab ? 'Built-in Tab' : 'Extension Tab'}</Tag>
      </div>

      <div className="settings-page__grid">
        {sections.map((section) => (
          <Card key={section.title} className="settings-card" bordered={false}>
            <div className="settings-card__header">
              <h2>{section.title}</h2>
            </div>
            <div className="settings-card__body">
              {section.fields.map((field) => (
                <div key={field.label} className="settings-field">
                  <div className="settings-field__meta">
                    <div className="settings-field__label">{field.label}</div>
                  </div>
                  <div className="settings-field__control">{renderField(field)}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
