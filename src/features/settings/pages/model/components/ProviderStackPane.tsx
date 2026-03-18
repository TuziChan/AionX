import { Button, Popconfirm, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour, Heartbeat, Plus, Write } from '@icon-park/react';
import classNames from 'classnames';
import {
  MODEL_PROTOCOL_OPTIONS,
  getModelProtocol,
  getProviderToggleState,
  isModelEnabled,
} from '@/features/settings/api/model';
import type { ModelProviderSummary } from '../types';

interface ProviderStackPaneProps {
  checkingModelKey: string | null;
  providers: ModelProviderSummary[];
  selectedProviderId: string | null;
  onAddModel: (providerId: string) => void;
  onAddProvider: () => void;
  onDeleteModel: (providerId: string, modelName: string) => void;
  onDeleteProvider: (providerId: string) => void;
  onEditModel: (providerId: string, modelName: string) => void;
  onEditProvider: (provider: ModelProviderSummary) => void;
  onRunHealthCheck: (providerId: string, modelName: string) => void;
  onSelectProvider: (providerId: string) => void;
  onToggleModel: (providerId: string, modelName: string, enabled: boolean) => void;
  onToggleProviderEnabled: (provider: ModelProviderSummary) => void;
  onToggleProtocol: (providerId: string, modelName: string) => void;
}

function formatHealth(provider: ModelProviderSummary, modelName: string): string {
  const health = provider.modelHealth?.[modelName];
  if (!health) {
    return '尚未检查';
  }

  if (health.status === 'healthy') {
    return `最近一次 ${health.latency ?? 0}ms`;
  }

  return health.error || '检查失败';
}

export function ProviderStackPane({
  checkingModelKey,
  providers,
  selectedProviderId,
  onAddModel,
  onAddProvider,
  onDeleteModel,
  onDeleteProvider,
  onEditModel,
  onEditProvider,
  onRunHealthCheck,
  onSelectProvider,
  onToggleModel,
  onToggleProviderEnabled,
  onToggleProtocol,
}: ProviderStackPaneProps) {
  return (
    <section className="settings-group-card settings-model-page__stack" data-testid="model-provider-list">
      <div className="settings-model-page__stack-header">
        <div>
          <div className="settings-group-card__title">模型平台</div>
          <div className="settings-model-page__pane-subtitle">按原项目的单列平台栈结构管理模型、协议、启用状态和健康检查。</div>
        </div>
        <Button data-testid="model-add-provider" type="outline" icon={<Plus size="16" />} onClick={onAddProvider}>
          添加平台
        </Button>
      </div>

      {providers.length === 0 ? (
        <div className="settings-empty-state settings-model-page__detail-empty" data-testid="model-provider-detail">
          <div className="settings-empty-state__title">选择或新建一个模型平台</div>
          <div className="settings-empty-state__desc">添加平台后，模型列表、协议切换和健康检查会直接在同一列里展开。</div>
        </div>
      ) : (
        <div className="settings-model-page__stack-items">
          {providers.map((provider) => {
            const expanded = provider.id === selectedProviderId;
            const providerState = getProviderToggleState(provider);

            return (
              <section
                key={provider.id}
                className={classNames('settings-model-page__provider-card', {
                  'settings-model-page__provider-card--active': expanded,
                })}
              >
                <div className="settings-model-page__provider-card-header">
                  <button
                    type="button"
                    data-testid={`model-provider-item-${provider.id}`}
                    className="settings-model-page__provider-summary"
                    onClick={() => onSelectProvider(provider.id)}
                  >
                    <div className="settings-model-page__provider-name">{provider.name}</div>
                    <div className="settings-model-page__provider-summary-meta">
                      <span>{provider.model.length} 个模型</span>
                      <span>{provider.apiKeyCount} 个 Key</span>
                      <span>{provider.platform}</span>
                    </div>
                  </button>

                  <div className="settings-model-page__provider-tools" onClick={(event) => event.stopPropagation()}>
                    <span
                      className={classNames('settings-model-page__provider-badge', {
                        'settings-model-page__provider-badge--muted': !providerState.checked,
                      })}
                    >
                      {providerState.indeterminate
                        ? `${provider.enabledModelCount}/${provider.model.length} 已启用`
                        : providerState.checked
                          ? '已启用'
                          : '已停用'}
                    </span>
                    <Switch checked={providerState.checked} onChange={() => onToggleProviderEnabled(provider)} />
                    <Button data-testid="model-add-model" size="mini" icon={<Plus size="14" />} onClick={() => onAddModel(provider.id)} />
                    <Button size="mini" icon={<Write size="14" />} onClick={() => onEditProvider(provider)} />
                    <Popconfirm title="确认删除该平台？" onOk={() => onDeleteProvider(provider.id)}>
                      <Button size="mini" status="danger" icon={<DeleteFour size="14" />} />
                    </Popconfirm>
                  </div>
                </div>

                {expanded ? (
                  <div className="settings-model-page__provider-body" data-testid="model-provider-detail">
                    <div className="settings-model-page__provider-body-meta">
                      <span>{provider.baseUrl || '未设置 Base URL'}</span>
                      <span>{provider.contextLimit ? `Context Limit ${provider.contextLimit}` : '未设置 Context Limit'}</span>
                      <span>{provider.apiKey ? '已配置 API Key' : '未配置 API Key'}</span>
                    </div>

                    {provider.model.length === 0 ? (
                      <div className="settings-empty-state settings-model-page__detail-empty">
                        <div className="settings-empty-state__title">这个平台还没有模型</div>
                        <div className="settings-empty-state__desc">点击右上角“添加模型”，把常用模型加入当前平台。</div>
                      </div>
                    ) : (
                      <div className="settings-model-page__model-list">
                        {provider.model.map((modelName) => {
                          const protocol = MODEL_PROTOCOL_OPTIONS.find(
                            (option) => option.value === getModelProtocol(provider, modelName),
                          );
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
                                  <Tag
                                    color={protocol.color}
                                    className="settings-model__protocol"
                                    onClick={() => onToggleProtocol(provider.id, modelName)}
                                  >
                                    {protocol.label}
                                  </Tag>
                                ) : null}
                                <Switch
                                  checked={isModelEnabled(provider, modelName)}
                                  onChange={(value) => onToggleModel(provider.id, modelName, value)}
                                />
                                <Button
                                  size="mini"
                                  data-testid={`model-health-check-${modelName}`}
                                  loading={checkingModelKey === modelKey}
                                  icon={<Heartbeat size="14" />}
                                  onClick={() => onRunHealthCheck(provider.id, modelName)}
                                />
                                <Button size="mini" icon={<Write size="14" />} onClick={() => onEditModel(provider.id, modelName)} />
                                <Popconfirm title="确认删除该模型？" onOk={() => onDeleteModel(provider.id, modelName)}>
                                  <Button size="mini" icon={<DeleteFour size="14" />} />
                                </Popconfirm>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
