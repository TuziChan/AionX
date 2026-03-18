import { Button, Popconfirm, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour, Heartbeat, Plus, Write } from '@icon-park/react';
import classNames from 'classnames';
import { MODEL_PROTOCOL_OPTIONS, getModelProtocol, isModelEnabled } from '@/features/settings/api/model';
import type { ModelProvider } from '@/features/settings/types';

interface ProviderDetailPaneProps {
  checkingModelKey: string | null;
  provider: ModelProvider | null;
  onAddModel: (providerId: string) => void;
  onDeleteModel: (providerId: string, modelName: string) => void;
  onDeleteProvider: (providerId: string) => void;
  onEditModel: (providerId: string, modelName: string) => void;
  onEditProvider: (provider: ModelProvider) => void;
  onRunHealthCheck: (providerId: string, modelName: string) => void;
  onToggleModel: (providerId: string, modelName: string, enabled: boolean) => void;
  onToggleProviderEnabled: (provider: ModelProvider) => void;
  onToggleProtocol: (providerId: string, modelName: string) => void;
}

function formatHealth(provider: ModelProvider, modelName: string): string {
  const health = provider.modelHealth?.[modelName];
  if (!health) {
    return '尚未检查';
  }
  if (health.status === 'healthy') {
    return `最近一次 ${health.latency ?? 0}ms`;
  }
  return health.error || '检查失败';
}

export function ProviderDetailPane({
  checkingModelKey,
  provider,
  onAddModel,
  onDeleteModel,
  onDeleteProvider,
  onEditModel,
  onEditProvider,
  onRunHealthCheck,
  onToggleModel,
  onToggleProviderEnabled,
  onToggleProtocol,
}: ProviderDetailPaneProps) {
  if (!provider) {
    return (
      <section className="settings-group-card settings-split-view__detail settings-model-page__detail" data-testid="model-provider-detail">
        <div className="settings-empty-state settings-model-page__detail-empty">
          <div className="settings-empty-state__title">选择或新建一个模型平台</div>
          <div className="settings-empty-state__desc">左侧平台列表会显示你的模型平台。选中后即可继续配置模型协议和健康检查。</div>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-group-card settings-split-view__detail settings-model-page__detail" data-testid="model-provider-detail">
      <div className="settings-model-page__detail-hero">
        <div className="settings-model-page__detail-meta">
          <div className="settings-model-page__detail-title">{provider.name}</div>
          <div className="settings-model-page__detail-subtitle">
            <span>{provider.platform}</span>
            <span>{provider.baseUrl || '未设置 Base URL'}</span>
          </div>
        </div>
        <div className="settings-model-page__detail-actions">
          <Switch checked={provider.enabled !== false} onChange={() => onToggleProviderEnabled(provider)} />
          <Button data-testid="model-add-model" icon={<Plus size="16" />} onClick={() => onAddModel(provider.id)}>
            添加模型
          </Button>
          <Button icon={<Write size="16" />} onClick={() => onEditProvider(provider)}>
            编辑平台
          </Button>
          <Popconfirm title="确认删除该平台？" onOk={() => onDeleteProvider(provider.id)}>
            <Button status="danger" icon={<DeleteFour size="16" />}>
              删除平台
            </Button>
          </Popconfirm>
        </div>
      </div>

      <div className="settings-model-page__detail-grid">
        <div className="settings-model-page__meta-card">
          <div className="settings-model-page__meta-label">Base URL</div>
          <div className="settings-model-page__meta-value">{provider.baseUrl || '未设置'}</div>
        </div>
        <div className="settings-model-page__meta-card">
          <div className="settings-model-page__meta-label">Context Limit</div>
          <div className="settings-model-page__meta-value">{provider.contextLimit ?? '未设置'}</div>
        </div>
        <div className="settings-model-page__meta-card">
          <div className="settings-model-page__meta-label">API Key</div>
          <div className="settings-model-page__meta-value">{provider.apiKey ? '已配置' : '未配置'}</div>
        </div>
      </div>

      <div className="settings-model-page__detail-section">
        <div className="settings-model-page__section-header">
          <div>
            <div className="settings-group-card__title">模型列表</div>
            <div className="settings-model-page__pane-subtitle">协议、启用状态和健康检查都在这里维护。</div>
          </div>
        </div>

        {provider.model.length === 0 ? (
          <div className="settings-empty-state settings-model-page__detail-empty">
            <div className="settings-empty-state__title">这个平台还没有模型</div>
            <div className="settings-empty-state__desc">点击右上角“添加模型”，把常用模型加入到当前平台。</div>
          </div>
        ) : (
          <div className="settings-model-page__model-list">
            {provider.model.map((modelName) => {
              const protocol = MODEL_PROTOCOL_OPTIONS.find((option) => option.value === getModelProtocol(provider, modelName));
              const health = provider.modelHealth?.[modelName];
              const modelKey = `${provider.id}:${modelName}`;
              return (
                <div key={modelName} className="settings-model-page__model-row">
                  <div className="settings-model-page__model-main">
                    <span
                      className={classNames('settings-model__health', {
                        'settings-model__health--healthy': health?.status === 'healthy',
                        'settings-model__health--unhealthy': health?.status === 'unhealthy',
                      })}
                    />
                    <div className="settings-model-page__model-text">
                      <div className="settings-model-page__model-name">{modelName}</div>
                      <div className="settings-model-page__model-desc">{formatHealth(provider, modelName)}</div>
                    </div>
                  </div>

                  <div className="settings-model-page__model-actions">
                    {protocol ? (
                      <Tag color={protocol.color} className="settings-model__protocol" onClick={() => onToggleProtocol(provider.id, modelName)}>
                        {protocol.label}
                      </Tag>
                    ) : null}
                    <Switch checked={isModelEnabled(provider, modelName)} onChange={(value) => onToggleModel(provider.id, modelName, value)} />
                    <Button
                      size="mini"
                      data-testid={`model-health-check-${modelName}`}
                      loading={checkingModelKey === modelKey}
                      icon={<Heartbeat size="16" />}
                      onClick={() => onRunHealthCheck(provider.id, modelName)}
                    />
                    <Button size="mini" icon={<Write size="16" />} onClick={() => onEditModel(provider.id, modelName)} />
                    <Popconfirm title="确认删除该模型？" onOk={() => onDeleteModel(provider.id, modelName)}>
                      <Button size="mini" icon={<DeleteFour size="16" />} />
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
