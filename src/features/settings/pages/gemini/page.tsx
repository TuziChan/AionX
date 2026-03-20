import { Input, SettingsCardBody, SettingsPage } from '@/shared/ui';
import { PreferenceRow } from '../../components/PreferenceRow';
import { AccountStatusCard } from './components/AccountStatusCard';
import { ProjectBindingCard } from './components/ProjectBindingCard';
import { useGeminiSettings } from './hooks/useGeminiSettings';

export function Component() {
  const {
    authPending,
    authStatus,
    draft,
    loading,
    saving,
    connectGoogleAccount,
    disconnectGoogleAccount,
    queueDraftUpdate,
  } = useGeminiSettings();

  return (
    <SettingsPage className="settings-gemini-page">
      <section className="settings-group-card settings-gemini-page__card" data-testid="gemini-account-card">
        <SettingsCardBody className="settings-group-card__body settings-group-card__body--padded">
          <AccountStatusCard
            authPending={authPending}
            authStatus={authStatus}
            onConnectAccount={connectGoogleAccount}
            onDisconnectAccount={disconnectGoogleAccount}
          />

          <PreferenceRow label="代理配置" description="可选的 HTTP/HTTPS 代理，用于需要经过本地代理访问 Gemini 的场景。">
            <Input
              value={draft.proxy}
              onChange={(event) => queueDraftUpdate((current) => ({ ...current, proxy: event.target.value }))}
              placeholder="http://127.0.0.1:7890"
            />
          </PreferenceRow>

          <ProjectBindingCard
            authStatus={authStatus}
            cloudProject={draft.cloudProject}
            onProjectChange={(value) => queueDraftUpdate((current) => ({ ...current, cloudProject: value }))}
          />
        </SettingsCardBody>
      </section>

      {loading ? <div className="settings-status-inline">正在加载 Gemini 配置...</div> : null}
      {!loading && saving ? <div className="settings-status-inline">Gemini 配置已进入保存队列...</div> : null}
    </SettingsPage>
  );
}

Component.displayName = 'GeminiSettings';
