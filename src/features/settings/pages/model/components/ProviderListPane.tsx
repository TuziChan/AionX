import { Plus } from 'lucide-react';
import { getProviderToggleState } from '@/features/settings/api/model';
import { cn } from '@/shared/lib';
import { Button, Input } from '@/shared/ui';
import type { ModelProviderSummary } from '../types';

interface ProviderListPaneProps {
  providers: ModelProviderSummary[];
  searchValue: string;
  selectedProviderId: string | null;
  onAddProvider: () => void;
  onSearchChange: (value: string) => void;
  onSelectProvider: (providerId: string) => void;
}

export function ProviderListPane({
  providers,
  searchValue,
  selectedProviderId,
  onAddProvider,
  onSearchChange,
  onSelectProvider,
}: ProviderListPaneProps) {
  return (
    <section className="settings-group-card settings-split-view__list settings-model-page__list" data-testid="model-provider-list">
      <div className="settings-model-page__pane-header">
        <div>
          <div className="settings-group-card__title">模型平台</div>
          <div className="settings-model-page__pane-subtitle">按平台查看模型、协议和健康状态。</div>
        </div>
        <Button data-testid="model-add-provider" type="button" variant="outline" onClick={onAddProvider}>
          <Plus data-icon="inline-start" />
          添加平台
        </Button>
      </div>

      <div className="settings-model-page__toolbar">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索平台、Base URL 或模型"
        />
      </div>

      <div className="settings-model-page__list-body">
        {providers.length === 0 ? (
          <div className="settings-empty-state settings-model-page__empty">
            <div className="settings-empty-state__title">暂无已配置模型平台</div>
            <div className="settings-empty-state__desc">先添加一个平台，再继续配置模型、协议和启用状态。</div>
          </div>
        ) : (
          <div className="settings-model-page__provider-items">
            {providers.map((provider) => {
              const providerState = getProviderToggleState(provider);
              return (
                <button
                  key={provider.id}
                  type="button"
                  data-testid={`model-provider-item-${provider.id}`}
                  className={cn('settings-model-page__provider-item', {
                    'settings-model-page__provider-item--active': provider.id === selectedProviderId,
                  })}
                  onClick={() => onSelectProvider(provider.id)}
                >
                  <div className="settings-model-page__provider-main">
                    <div className="settings-model-page__provider-name">{provider.name}</div>
                    <div className="settings-model-page__provider-meta">
                      <span>{provider.platform}</span>
                      <span>{provider.model.length} 个模型</span>
                      <span>{provider.apiKeyCount} 个 Key</span>
                    </div>
                  </div>
                  <div className="settings-model-page__provider-side">
                    <span
                      className={cn('settings-model-page__provider-badge', {
                        'settings-model-page__provider-badge--muted': !providerState.checked,
                      })}
                    >
                      {providerState.indeterminate
                        ? `${provider.enabledModelCount}/${provider.model.length} 已启用`
                        : providerState.checked
                          ? '已启用'
                          : '已停用'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
