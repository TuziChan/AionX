import { Button, Popconfirm, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour, Plus, Write } from '@icon-park/react';
import type { ChannelPlugin } from '@/bindings';
import { CHANNEL_PRESETS, getChannelSummary } from '@/features/settings/api/webui';
import type { ChannelPluginType } from '../types';

interface ChannelsTabProps {
  deletingPluginId: string | null;
  plugins: ChannelPlugin[];
  togglingPluginId: string | null;
  onCreatePlugin: (type?: ChannelPluginType) => void;
  onDeletePlugin: (pluginId: string) => Promise<void>;
  onEditPlugin: (plugin: ChannelPlugin) => void;
  onTogglePlugin: (plugin: ChannelPlugin, enabled: boolean) => Promise<void>;
}

export function ChannelsTab({
  deletingPluginId,
  plugins,
  togglingPluginId,
  onCreatePlugin,
  onDeletePlugin,
  onEditPlugin,
  onTogglePlugin,
}: ChannelsTabProps) {
  return (
    <div className="settings-webui-page__channels" data-testid="webui-channels-tab">
      {CHANNEL_PRESETS.map((preset) => {
        const plugin = plugins.find((item) => item.type === preset.type) ?? null;
        const summary = plugin ? getChannelSummary(plugin) : [];

        return (
          <section key={preset.type} className="settings-group-card settings-webui-page__channel-card">
            <div className="settings-webui-page__channel-header">
              <div>
                <div className="settings-group-card__title">{preset.label}</div>
                <div className="settings-webui-page__section-subtitle">{preset.description}</div>
              </div>

              {plugin ? (
                <Tag color={plugin.enabled ? 'green' : 'gray'}>{plugin.enabled ? '已启用' : '已停用'}</Tag>
              ) : (
                <Tag color="gray">未创建</Tag>
              )}
            </div>

            <div className="settings-webui-page__channel-body">
              <div className="settings-webui-page__channel-main">
                <div className="settings-webui-page__channel-name">{plugin?.name ?? `${preset.label} 通道尚未创建`}</div>
                <div className="settings-webui-page__channel-meta">
                  {plugin ? (
                    <>
                      <span>{plugin.status}</span>
                      {summary.length > 0 ? <span>{summary.join(' / ')}</span> : <span>已保存基础配置</span>}
                    </>
                  ) : (
                    <span>先创建一个插件，再继续配置默认模型和频道凭证。</span>
                  )}
                </div>
              </div>

              <div className="settings-webui-page__channel-actions">
                <Switch
                  checked={Boolean(plugin?.enabled)}
                  disabled={!plugin}
                  loading={togglingPluginId === plugin?.id}
                  onChange={(value) => {
                    if (plugin) {
                      void onTogglePlugin(plugin, value);
                    }
                  }}
                />
                <Button
                  data-testid={`webui-channel-edit-${preset.type}`}
                  icon={plugin ? <Write size="16" /> : <Plus size="16" />}
                  onClick={() => (plugin ? onEditPlugin(plugin) : onCreatePlugin(preset.type))}
                >
                  {plugin ? '编辑' : '创建'}
                </Button>
                {plugin ? (
                  <Popconfirm title="确认删除这个频道插件？" onOk={() => void onDeletePlugin(plugin.id)}>
                    <Button
                      status="danger"
                      loading={deletingPluginId === plugin.id}
                      icon={<DeleteFour size="16" />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
