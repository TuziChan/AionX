import { Activity, LoaderCircle, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  MODEL_PROTOCOL_OPTIONS,
  getModelProtocol,
  getProviderToggleState,
  isModelEnabled,
} from '@/features/settings/api/model';
import { cn } from '@/shared/lib';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Switch,
} from '@/shared/ui';
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
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(null);
  const [deletingModel, setDeletingModel] = useState<{ providerId: string; modelName: string } | null>(null);

  return (
    <section className="settings-group-card settings-model-page__stack" data-testid="model-provider-list">
      <div className="settings-model-page__stack-header">
        <div>
          <div className="settings-group-card__title">模型平台</div>
          <div className="settings-model-page__pane-subtitle">按原项目的单列平台栈结构管理模型、协议、启用状态和健康检查。</div>
        </div>
        <Button data-testid="model-add-provider" type="button" variant="outline" onClick={onAddProvider}>
          <Plus data-icon="inline-start" />
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
                className={cn('settings-model-page__provider-card', {
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
                    <Badge
                      variant={providerState.indeterminate ? 'info' : providerState.checked ? 'default' : 'outline'}
                      className={cn('settings-model-page__provider-badge', {
                        'settings-model-page__provider-badge--muted': !providerState.checked,
                      })}
                    >
                      {providerState.indeterminate
                        ? `${provider.enabledModelCount}/${provider.model.length} 已启用`
                        : providerState.checked
                          ? '已启用'
                          : '已停用'}
                    </Badge>
                    <Switch checked={providerState.checked} onCheckedChange={() => onToggleProviderEnabled(provider)} />
                    <Button
                      data-testid="model-add-model"
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full"
                      onClick={() => onAddModel(provider.id)}
                    >
                      <Plus />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-full"
                      onClick={() => onEditProvider(provider)}
                    >
                      <PencilLine />
                    </Button>
                    <AlertDialog
                      open={deletingProviderId === provider.id}
                      onOpenChange={(open) => setDeletingProviderId(open ? provider.id : null)}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-full"
                        onClick={() => setDeletingProviderId(provider.id)}
                      >
                        <Trash2 />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除该平台？</AlertDialogTitle>
                          <AlertDialogDescription>删除后会同时移除该平台下的模型配置与健康检查记录。</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              setDeletingProviderId(null);
                              onDeleteProvider(provider.id);
                            }}
                          >
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                                  className={cn('settings-model__health', {
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
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="settings-model__protocol"
                                    onClick={() => onToggleProtocol(provider.id, modelName)}
                                  >
                                    {protocol.label}
                                  </Button>
                                ) : null}
                                <Switch
                                  checked={isModelEnabled(provider, modelName)}
                                  onCheckedChange={(value) => onToggleModel(provider.id, modelName, value)}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-full"
                                  data-testid={`model-health-check-${modelName}`}
                                  disabled={checkingModelKey === modelKey}
                                  onClick={() => onRunHealthCheck(provider.id, modelName)}
                                >
                                  {checkingModelKey === modelKey ? <LoaderCircle className="animate-spin" /> : <Activity />}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-full"
                                  onClick={() => onEditModel(provider.id, modelName)}
                                >
                                  <PencilLine />
                                </Button>
                                <AlertDialog
                                  open={deletingModel?.providerId === provider.id && deletingModel.modelName === modelName}
                                  onOpenChange={(open) =>
                                    setDeletingModel(open ? { providerId: provider.id, modelName } : null)
                                  }
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 rounded-full"
                                    onClick={() => setDeletingModel({ providerId: provider.id, modelName })}
                                  >
                                    <Trash2 />
                                  </Button>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>确认删除该模型？</AlertDialogTitle>
                                      <AlertDialogDescription>删除后该模型将从当前平台移除，健康检查状态也会一并清空。</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>取消</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setDeletingModel(null);
                                          onDeleteModel(provider.id, modelName);
                                        }}
                                      >
                                        确认删除
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
