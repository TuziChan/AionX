import { Activity, LoaderCircle, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { MODEL_PROTOCOL_OPTIONS, getModelProtocol, isModelEnabled } from '@/features/settings/api/model';
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
  Button,
  Switch,
} from '@/shared/ui';
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
  const [deleteProviderOpen, setDeleteProviderOpen] = useState(false);
  const [deletingModelName, setDeletingModelName] = useState<string | null>(null);

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
          <Switch checked={provider.enabled !== false} onCheckedChange={() => onToggleProviderEnabled(provider)} />
          <Button data-testid="model-add-model" type="button" variant="outline" onClick={() => onAddModel(provider.id)}>
            <Plus data-icon="inline-start" />
            添加模型
          </Button>
          <Button type="button" variant="outline" onClick={() => onEditProvider(provider)}>
            <PencilLine data-icon="inline-start" />
            编辑平台
          </Button>
          <AlertDialog open={deleteProviderOpen} onOpenChange={setDeleteProviderOpen}>
            <Button type="button" variant="destructive" onClick={() => setDeleteProviderOpen(true)}>
              <Trash2 data-icon="inline-start" />
              删除平台
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
                    setDeleteProviderOpen(false);
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
                        className="settings-model__protocol rounded-full"
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
                      open={deletingModelName === modelName}
                      onOpenChange={(open) => setDeletingModelName(open ? modelName : null)}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-full"
                        onClick={() => setDeletingModelName(modelName)}
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
                              setDeletingModelName(null);
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
    </section>
  );
}
