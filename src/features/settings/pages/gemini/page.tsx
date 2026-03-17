import { Input, Select, Switch } from '@arco-design/web-react';
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
    <div className="settings-panel settings-panel--regular settings-gemini-page">
      <AccountStatusCard
        authPending={authPending}
        authStatus={authStatus}
        onConnectAccount={connectGoogleAccount}
        onDisconnectAccount={disconnectGoogleAccount}
      />

      <ProjectBindingCard
        authStatus={authStatus}
        cloudProject={draft.cloudProject}
        onProjectChange={(value) => queueDraftUpdate((current) => ({ ...current, cloudProject: value }))}
      />

      <section className="settings-group-card">
        <div className="settings-gemini-page__section-header">
          <div>
            <div className="settings-group-card__title">网络与认证</div>
            <div className="settings-gemini-page__section-subtitle">代理、基础地址和认证方式统一走 Gemini 领域 API，不再由页面直接写通用设置键。</div>
          </div>
        </div>

        <div className="settings-group-card__body">
          <PreferenceRow label="认证类型" description="决定当前会话优先使用 Google Account 还是 API Key 作为默认接入方式。">
            <Select
              value={draft.authType}
              options={[
                { label: 'Google Account', value: 'google-account' },
                { label: 'API Key', value: 'api-key' },
              ]}
              onChange={(value) =>
                queueDraftUpdate((current) => ({
                  ...current,
                  authType: value === 'api-key' ? 'api-key' : 'google-account',
                }))
              }
            />
          </PreferenceRow>

          <PreferenceRow label="代理配置" description="可选的 HTTP/HTTPS 代理，用于需要经过本地代理访问 Gemini 的场景。">
            <Input
              value={draft.proxy}
              onChange={(value) => queueDraftUpdate((current) => ({ ...current, proxy: value }))}
              placeholder="http://127.0.0.1:7890"
            />
          </PreferenceRow>

          <PreferenceRow label="GOOGLE_GEMINI_BASE_URL" description="保留给自定义 Gemini 网关或代理入口，未配置时使用默认服务地址。">
            <Input
              value={draft.baseUrl}
              onChange={(value) => queueDraftUpdate((current) => ({ ...current, baseUrl: value }))}
              placeholder="可选"
            />
          </PreferenceRow>
        </div>
      </section>

      <section className="settings-group-card">
        <div className="settings-gemini-page__section-header">
          <div>
            <div className="settings-group-card__title">默认行为</div>
            <div className="settings-gemini-page__section-subtitle">这些偏好会作为 Gemini 会话的默认草稿值保留，页面只维护临时编辑态。</div>
          </div>
        </div>

        <div className="settings-group-card__body">
          <PreferenceRow label="YOLO 模式" description="启用后会优先走更激进的自动化执行策略。">
            <Switch
              checked={draft.yoloMode}
              onChange={(value) => queueDraftUpdate((current) => ({ ...current, yoloMode: value }))}
            />
          </PreferenceRow>

          <PreferenceRow label="默认会话模式" description="控制 Gemini 会话默认进入的执行模式。">
            <Select
              value={draft.preferredMode}
              options={[
                { label: '默认', value: '' },
                { label: 'Auto', value: 'auto' },
                { label: 'Manual', value: 'manual' },
              ]}
              onChange={(value) => queueDraftUpdate((current) => ({ ...current, preferredMode: String(value) }))}
            />
          </PreferenceRow>
        </div>
      </section>

      {loading ? <div className="settings-status-inline">正在加载 Gemini 配置...</div> : null}
      {!loading && saving ? <div className="settings-status-inline">Gemini 配置已进入保存队列...</div> : null}
    </div>
  );
}

Component.displayName = 'GeminiSettings';
