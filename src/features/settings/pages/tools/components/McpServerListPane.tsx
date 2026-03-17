import { Button, Input, Tag } from '@arco-design/web-react';
import { Plus } from '@icon-park/react';
import classNames from 'classnames';
import type { McpServerSummary } from '../types';

interface McpServerListPaneProps {
  searchValue: string;
  selectedServerId: string | null;
  servers: McpServerSummary[];
  onAddServer: () => void;
  onSearchChange: (value: string) => void;
  onSelectServer: (serverId: string) => void;
}

export function McpServerListPane({
  searchValue,
  selectedServerId,
  servers,
  onAddServer,
  onSearchChange,
  onSelectServer,
}: McpServerListPaneProps) {
  return (
    <section className="settings-group-card settings-split-view__list settings-tools-page__list" data-testid="tools-server-list">
      <div className="settings-tools-page__pane-header">
        <div>
          <div className="settings-group-card__title">MCP Server</div>
          <div className="settings-tools-page__pane-subtitle">集中管理可用工具节点、连接状态和接入方式。</div>
        </div>
        <Button data-testid="tools-add-server" type="outline" icon={<Plus size="16" />} onClick={onAddServer}>
          添加 Server
        </Button>
      </div>

      <div className="settings-tools-page__toolbar">
        <Input value={searchValue} onChange={onSearchChange} placeholder="搜索名称、类型、地址或命令" allowClear />
      </div>

      <div className="settings-tools-page__list-body">
        {servers.length === 0 ? (
          <div className="settings-empty-state settings-tools-page__empty">
            <div className="settings-empty-state__title">暂无 MCP Server</div>
            <div className="settings-empty-state__desc">先创建一个 stdio、sse 或 http server，右侧详情区会继续展示连接测试和扩展位。</div>
          </div>
        ) : (
          <div className="settings-tools-page__server-items">
            {servers.map((server) => (
              <button
                key={server.id}
                type="button"
                data-testid={`tools-server-item-${server.id}`}
                className={classNames('settings-tools-page__server-item', {
                  'settings-tools-page__server-item--active': server.id === selectedServerId,
                })}
                onClick={() => onSelectServer(server.id)}
              >
                <div className="settings-tools-page__server-main">
                  <div className="settings-tools-page__server-title">{server.name}</div>
                  <div className="settings-tools-page__server-meta">
                    <span>{server.type.toUpperCase()}</span>
                    <span>{server.endpointLabel}</span>
                  </div>
                </div>
                <div className="settings-tools-page__server-side">
                  <Tag color={server.enabled ? 'green' : 'gray'}>{server.enabled ? '已启用' : '已停用'}</Tag>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
