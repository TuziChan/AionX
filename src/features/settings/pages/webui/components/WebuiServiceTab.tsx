import { Button, Input, Message, Switch, Tag } from '@arco-design/web-react';
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
  };

  return (
    <div className="settings-webui-page__service" data-testid="webui-service-tab">
      <section className="settings-group-card settings-webui-page__hero-card">
        <div className="settings-webui-page__hero-header">
          <div>
            <div className="settings-group-card__title">WebUI 服务状态</div>
            <div className="settings-webui-page__hero-title">{status?.running ? 'WebUI 正在运行' : 'WebUI 当前未启动'}</div>
            <div className="settings-webui-page__section-subtitle">
              服务状态、远程访问和管理员密码都已经收敛到 WebUI 领域 API，不再直接读写分散的 store 键。
            </div>
          </div>

          <div className="settings-webui-page__hero-side">
            <Tag color={status?.running ? 'green' : 'gray'}>{status?.running ? '运行中' : '未启动'}</Tag>
            <Input id="webui-address" value={accessUrl} readOnly />
            <Button
              data-testid="webui-toggle-server"
              type={status?.running ? 'outline' : 'primary'}
              loading={starting || stopping}
              onClick={() => void onToggleRunning(!status?.running)}
            >
              {status?.running ? '停止服务' : '启动服务'}
            </Button>
          </div>
        </div>
      </section>

      <section className="settings-group-card">
        <div className="settings-webui-page__section-header">
          <div>
            <div className="settings-group-card__title">服务配置</div>
            <div className="settings-webui-page__section-subtitle">端口与远程访问先保存在设置层，启动服务时再把配置下发到运行时。</div>
          </div>
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
          <PreferenceRow label="运行状态" description="运行状态来自实时 WebUI 服务，不再由页面自行推断。">
            <Input value={loading ? '读取中' : status?.running ? '运行中' : '未启动'} readOnly />
          </PreferenceRow>
        </div>

        <div className="settings-webui-page__inline-actions">
          <Button data-testid="webui-save-settings" type="primary" loading={savingSettings} onClick={() => void onSaveSettings(settings)}>
            保存接入配置
          </Button>
          <Button onClick={() => void onReload()}>刷新状态</Button>
        </div>
      </section>

      <section className="settings-group-card">
        <div className="settings-webui-page__section-header">
          <div>
            <div className="settings-group-card__title">管理员凭证</div>
            <div className="settings-webui-page__section-subtitle">初始密码只在首次创建或重置后显示一次，后续不再回显旧密码。</div>
          </div>
        </div>

        <div className="settings-group-card__body">
          <PreferenceRow label="用户名">
            <Input value={status?.admin_username ?? 'admin'} readOnly />
          </PreferenceRow>
          <PreferenceRow label="初始密码" description={status?.initial_password ? '当前显示的是最近一次生成的密码。' : '没有可展示的随机密码。'}>
            <Input value={status?.initial_password ?? '******'} readOnly />
          </PreferenceRow>
          <PreferenceRow label="新密码">
            <Input.Password value={newPassword} onChange={setNewPassword} placeholder="至少 8 位" />
          </PreferenceRow>
          <PreferenceRow label="确认新密码">
            <Input.Password value={confirmPassword} onChange={setConfirmPassword} placeholder="再次输入新密码" />
          </PreferenceRow>
        </div>

        <div className="settings-webui-page__inline-actions">
          <Button loading={changingPassword} onClick={() => void handlePasswordSubmit()}>
            更新管理员密码
          </Button>
          <Button loading={resettingPassword} onClick={() => void onResetPassword()}>
            重置随机密码
          </Button>
        </div>
      </section>
    </div>
  );
}
