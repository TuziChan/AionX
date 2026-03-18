import { Button, Input, Message, Modal, Switch, Tag } from '@arco-design/web-react';
import { Copy, EditTwo, LinkThree, Refresh } from '@icon-park/react';
import { useMemo, useState } from 'react';
import type { WebUiStatus } from '@/bindings';
import { getWebuiAccessUrl } from '@/features/settings/api/webui';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import type { WebuiSettingsDraft } from '../types';

interface WebuiServiceTabProps {
  changingPassword: boolean;
  loading: boolean;
  resettingPassword: boolean;
  savingSettings: boolean;
  settings: WebuiSettingsDraft;
  starting: boolean;
  status: WebUiStatus | null;
  stopping: boolean;
  onChangePassword: (newPassword: string) => Promise<void>;
  onReload: () => Promise<void>;
  onResetPassword: () => Promise<void>;
  onSaveSettings: (settings: WebuiSettingsDraft) => Promise<void>;
  onSettingsChange: (updater: WebuiSettingsDraft | ((current: WebuiSettingsDraft) => WebuiSettingsDraft)) => void;
  onToggleRunning: (enabled: boolean) => Promise<void>;
}

export function WebuiServiceTab({
  changingPassword,
  loading,
  resettingPassword,
  savingSettings,
  settings,
  starting,
  status,
  stopping,
  onChangePassword,
  onReload,
  onResetPassword,
  onSaveSettings,
  onSettingsChange,
  onToggleRunning,
}: WebuiServiceTabProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const accessUrl = useMemo(() => getWebuiAccessUrl(status, settings), [settings, status]);

  const handlePasswordSubmit = async () => {
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

    await onChangePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(false);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      Message.success('已复制到剪贴板');
    } catch (error) {
      Message.error(`复制失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="settings-webui-page__service" data-testid="webui-service-tab">
      <div className="settings-webui-page__intro">
        <div className="settings-webui-page__panel-title">WebUI</div>
        <div className="settings-webui-page__panel-description">
          让本地 AionX 以独立 Web 界面对外提供访问入口。这里保留 AionUi 的服务引导节奏，同时继续通过当前 typed API 管理端口、远程访问和管理员凭证。
        </div>
        <div className="settings-webui-page__guide">
          <span className="settings-webui-page__guide-step">1. 保存端口与远程访问配置。</span>
          <span className="settings-webui-page__guide-step">2. 启动 WebUI 并复制访问地址。</span>
          <span className="settings-webui-page__guide-step">3. 使用管理员凭证登录外部页面。</span>
        </div>
      </div>

      <section className="settings-group-card settings-webui-page__hero-card">
        <div className="settings-webui-page__service-hint">
          远程访问开启后，WebUI 会绑定到 `0.0.0.0`。如果只在本机浏览器使用，保持关闭可以减少暴露面。
        </div>

        <div className="settings-group-card__body">
          <PreferenceRow label="监听端口" description="默认端口为 9527，修改后会在下次启动时生效。">
            <Input
              id="webui-port"
              value={String(settings.port)}
              onChange={(value) =>
                onSettingsChange((current) => ({
                  ...current,
                  port: Number(value.replace(/[^\d]/g, '')) || 9527,
                }))
              }
            />
          </PreferenceRow>
          <PreferenceRow label="启用 WebUI" description="服务状态由运行时实时返回，启动/停止不会再依赖页面本地推断。">
            <div className="settings-webui-page__row-action">
              <Tag color={status?.running ? 'green' : 'gray'}>{status?.running ? '运行中' : '未启动'}</Tag>
              <Switch
                checked={Boolean(status?.running)}
                loading={starting || stopping}
                data-testid="webui-toggle-server"
                onChange={(value) => void onToggleRunning(value)}
              />
            </div>
          </PreferenceRow>
          <PreferenceRow label="允许远程访问" description="启用后会绑定到 0.0.0.0，并允许局域网访问当前 WebUI。">
            <Switch
              checked={settings.remote}
              disabled={Boolean(status?.running)}
              onChange={(value) =>
                onSettingsChange((current) => ({
                  ...current,
                  remote: value,
                }))
              }
            />
          </PreferenceRow>
          <PreferenceRow
            label="访问地址"
            description={
              status?.running
                ? '当前服务已启动，可以直接复制地址或在系统浏览器中打开。'
                : '地址会根据已保存的端口与远程访问配置即时预览。'
            }
          >
            <div className="settings-webui-page__url-field">
              <Input id="webui-address" value={accessUrl} readOnly />
              <Button icon={<Copy size="14" />} onClick={() => void handleCopy(accessUrl)}>
                复制
              </Button>
              <Button
                icon={<LinkThree size="14" />}
                disabled={!status?.running}
                onClick={() => {
                  if (status?.running) {
                    window.open(accessUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                打开
              </Button>
            </div>
          </PreferenceRow>
          <PreferenceRow label="当前状态" description="点击刷新可以重新读取运行时状态与最新的管理员口令显示。">
            <div className="settings-webui-page__status-inline">
              <span>{loading ? '读取中' : status?.running ? '运行中' : '未启动'}</span>
              <Button icon={<Refresh size="14" />} onClick={() => void onReload()}>
                刷新
              </Button>
            </div>
          </PreferenceRow>
        </div>

        <div className="settings-webui-page__inline-actions">
          <Button data-testid="webui-save-settings" type="primary" loading={savingSettings} onClick={() => void onSaveSettings(settings)}>
            保存接入配置
          </Button>
        </div>
      </section>

      <section className="settings-group-card settings-webui-page__login-card">
        <div className="settings-webui-page__section-header">
          <div>
            <div className="settings-group-card__title">登录信息</div>
            <div className="settings-webui-page__section-subtitle">
              管理员用户名当前固定为内置账号，随机密码只会在首次生成或重置后短暂展示。
            </div>
          </div>
        </div>

        <div className="settings-webui-page__credential-list">
          <div className="settings-webui-page__credential-row">
            <span className="settings-webui-page__credential-label">用户名</span>
            <div className="settings-webui-page__credential-pill">
              <span>{status?.admin_username ?? 'admin'}</span>
              <Button type="text" icon={<Copy size="14" />} onClick={() => void handleCopy(status?.admin_username ?? 'admin')} />
            </div>
          </div>

          <div className="settings-webui-page__credential-row">
            <span className="settings-webui-page__credential-label">密码</span>
            <div className="settings-webui-page__credential-pill">
              <span>{status?.initial_password ?? '******'}</span>
              <Button type="text" icon={<Copy size="14" />} disabled={!status?.initial_password} onClick={() => void handleCopy(status?.initial_password ?? '')} />
              <Button type="text" icon={<EditTwo size="14" />} onClick={() => setPasswordModalVisible(true)} />
            </div>
          </div>
        </div>

        <div className="settings-webui-page__inline-actions">
          <Button loading={changingPassword} onClick={() => setPasswordModalVisible(true)}>
            设置新密码
          </Button>
          <Button loading={resettingPassword} onClick={() => void onResetPassword()}>
            重置随机密码
          </Button>
        </div>
      </section>

      <Modal
        visible={passwordModalVisible}
        title="设置新的管理员密码"
        okText="保存密码"
        okButtonProps={{ loading: changingPassword }}
        className="settings-webui-page__password-modal"
        onCancel={() => {
          setPasswordModalVisible(false);
          setNewPassword('');
          setConfirmPassword('');
        }}
        onOk={() => void handlePasswordSubmit()}
        unmountOnExit
      >
        <div className="settings-webui-page__password-form">
          <label className="settings-webui-page__channel-field">
            <span className="settings-webui-page__channel-field-label">新密码</span>
            <Input.Password value={newPassword} onChange={setNewPassword} placeholder="至少 8 位" />
          </label>
          <label className="settings-webui-page__channel-field">
            <span className="settings-webui-page__channel-field-label">确认密码</span>
            <Input.Password value={confirmPassword} onChange={setConfirmPassword} placeholder="再次输入新密码" />
          </label>
        </div>
      </Modal>
    </div>
  );
}
