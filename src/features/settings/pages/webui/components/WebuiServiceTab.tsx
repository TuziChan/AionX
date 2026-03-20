import { Copy, ExternalLink, LoaderCircle, PencilLine, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { WebUiStatus } from '@/bindings';
import { getWebuiAccessUrl } from '@/features/settings/api/webui';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import { notify } from '@/shared/lib';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Switch,
} from '@/shared/ui';
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
      notify.error('请输入新密码');
      return;
    }
    if (newPassword.length < 8) {
      notify.error('新密码至少 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify.error('两次输入的密码不一致');
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
      notify.success('已复制到剪贴板');
    } catch (error) {
      notify.error(`复制失败: ${error instanceof Error ? error.message : String(error)}`);
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
              onChange={(event) =>
                onSettingsChange((current) => ({
                  ...current,
                  port: Number(event.target.value.replace(/[^\d]/g, '')) || 9527,
                }))
              }
            />
          </PreferenceRow>
          <PreferenceRow label="启用 WebUI" description="服务状态由运行时实时返回，启动/停止不会再依赖页面本地推断。">
            <div className="settings-webui-page__row-action">
              <Badge variant={status?.running ? 'default' : 'outline'}>{status?.running ? '运行中' : '未启动'}</Badge>
              <Switch
                checked={Boolean(status?.running)}
                disabled={starting || stopping}
                data-testid="webui-toggle-server"
                onCheckedChange={(value) => void onToggleRunning(value)}
              />
            </div>
          </PreferenceRow>
          <PreferenceRow label="允许远程访问" description="启用后会绑定到 0.0.0.0，并允许局域网访问当前 WebUI。">
            <Switch
              checked={settings.remote}
              disabled={Boolean(status?.running)}
              onCheckedChange={(value) =>
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
              <Button type="button" variant="outline" onClick={() => void handleCopy(accessUrl)}>
                <Copy data-icon="inline-start" />
                复制
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!status?.running}
                onClick={() => {
                  if (status?.running) {
                    window.open(accessUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
              >
                <ExternalLink data-icon="inline-start" />
                打开
              </Button>
            </div>
          </PreferenceRow>
          <PreferenceRow label="当前状态" description="点击刷新可以重新读取运行时状态与最新的管理员口令显示。">
            <div className="settings-webui-page__status-inline">
              <span>{loading ? '读取中' : status?.running ? '运行中' : '未启动'}</span>
              <Button type="button" variant="outline" onClick={() => void onReload()}>
                <RefreshCw data-icon="inline-start" />
                刷新
              </Button>
            </div>
          </PreferenceRow>
        </div>

        <div className="settings-webui-page__inline-actions">
          <Button data-testid="webui-save-settings" type="button" disabled={savingSettings} onClick={() => void onSaveSettings(settings)}>
            {savingSettings ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full"
                onClick={() => void handleCopy(status?.admin_username ?? 'admin')}
              >
                <Copy />
              </Button>
            </div>
          </div>

          <div className="settings-webui-page__credential-row">
            <span className="settings-webui-page__credential-label">密码</span>
            <div className="settings-webui-page__credential-pill">
              <span>{status?.initial_password ?? '******'}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full"
                disabled={!status?.initial_password}
                onClick={() => void handleCopy(status?.initial_password ?? '')}
              >
                <Copy />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 rounded-full"
                onClick={() => setPasswordModalVisible(true)}
              >
                <PencilLine />
              </Button>
            </div>
          </div>
        </div>

        <div className="settings-webui-page__inline-actions">
          <Button type="button" disabled={changingPassword} onClick={() => setPasswordModalVisible(true)}>
            {changingPassword ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            设置新密码
          </Button>
          <Button type="button" variant="outline" disabled={resettingPassword} onClick={() => void onResetPassword()}>
            {resettingPassword ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            重置随机密码
          </Button>
        </div>
      </section>

      <Dialog
        open={passwordModalVisible}
        onOpenChange={(open) => {
          setPasswordModalVisible(open);
          if (!open) {
            setNewPassword('');
            setConfirmPassword('');
          }
        }}
      >
        <DialogContent className="settings-webui-page__password-modal">
          <DialogHeader>
            <DialogTitle>设置新的管理员密码</DialogTitle>
            <DialogDescription>保存后当前随机密码会失效，之后请使用新密码登录 WebUI。</DialogDescription>
          </DialogHeader>
          <div className="settings-webui-page__password-form">
            <label className="settings-webui-page__channel-field">
              <span className="settings-webui-page__channel-field-label">新密码</span>
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="至少 8 位" />
            </label>
            <label className="settings-webui-page__channel-field">
              <span className="settings-webui-page__channel-field-label">确认密码</span>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次输入新密码"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPasswordModalVisible(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              取消
            </Button>
            <Button type="button" disabled={changingPassword} onClick={() => void handlePasswordSubmit()}>
              {changingPassword ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              保存密码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
