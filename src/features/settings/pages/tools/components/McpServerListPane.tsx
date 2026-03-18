import { Button, Input, Popconfirm, Switch, Tag } from '@arco-design/web-react';
import { CheckOne, CloseOne, DeleteFour, Heartbeat, LoadingOne, Plus, Write } from '@icon-park/react';
import type { McpServer } from '@/bindings';
import classNames from 'classnames';
import { McpServerDetailPane } from './McpServerDetailPane';
import type { McpServerSummary } from '../types';

interface McpServerListPaneProps {
  searchValue: string;
  selectedServerId: string | null;
  server: McpServer | null;
  servers: McpServerSummary[];
  testingServerId: string | null;
  testMessage?: string;
  onAddServer: () => void;
  onDeleteServer: (serverId: string) => void;
  onEditServer: (server: McpServer) => void;
  onSearchChange: (value: string) => void;
  onSelectServer: (serverId: string) => void;
  onTestServer: (serverId: string) => void;
  onToggleServer: (server: McpServer, enabled: boolean) => void;
}

type ConnectionState = 'idle' | 'testing' | 'success' | 'error';

function getConnectionState(server: McpServerSummary, testingServerId: string | null): ConnectionState {
  if (testingServerId === server.id) {
    return 'testing';
  }

  const message = server.lastTestMessage?.trim();
  if (!message) {
    return 'idle';
  }

  if (/failed|error|invalid|missing|unsupported|non-success|not found|拒绝|失败|无效|缺少|不存在|错误/i.test(message)) {
    return 'error';
  }

  return 'success';
}

function getConnectionMeta(state: ConnectionState) {
  switch (state) {
    case 'testing':
      return {
        icon: <LoadingOne size="14" className="settings-tools-page__connection-icon settings-tools-page__connection-icon--spin" />,
        label: '测试中',
        tone: 'arcoblue' as const,
      };
    case 'success':
      return {
        icon: <CheckOne size="14" className="settings-tools-page__connection-icon settings-tools-page__connection-icon--success" />,
        label: '已连通',
        tone: 'green' as const,
      };
    case 'error':
      return {
        icon: <CloseOne size="14" className="settings-tools-page__connection-icon settings-tools-page__connection-icon--error" />,
        label: '连接异常',
        tone: 'red' as const,
      };
    default:
      return {
        icon: <span className="settings-tools-page__connection-dot" aria-hidden="true" />,
        label: '未测试',
        tone: 'gray' as const,
      };
  }
}

export function McpServerListPane({
  searchValue,
  selectedServerId,
  server,
  servers,
  testingServerId,
  testMessage,
  onAddServer,
  onDeleteServer,
  onEditServer,
  onSearchChange,
  onSelectServer,
  onTestServer,
  onToggleServer,
}: McpServerListPaneProps) {
  return (
    <section className="settings-group-card settings-tools-page__management-card" data-testid="tools-server-list">
      <div className="settings-tools-page__pane-header">
        <div>
          <div className="settings-group-card__title">MCP Server</div>
          <div className="settings-tools-page__pane-subtitle">集中管理可用工具节点、连接状态和接入方式，整体节奏对齐 AionUi 的单列管理卡。</div>
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
            <div className="settings-empty-state__desc">先创建一个 stdio、sse 或 http server，下方会继续展示当前选中节点的连接诊断和扩展位。</div>
          </div>
        ) : (
          <div className="settings-tools-page__server-items">
            {servers.map((server) => (
              (() => {
                const isActive = server.id === selectedServerId;
                const connectionState = getConnectionState(server, testingServerId);
                const connectionMeta = getConnectionMeta(connectionState);

                return (
                  <div
                    key={server.id}
                    className={classNames('settings-tools-page__server-card', {
                      'settings-tools-page__server-card--active': isActive,
                    })}
                  >
                    <div className="settings-tools-page__server-row">
                      <button
                        type="button"
                        data-testid={`tools-server-item-${server.id}`}
                        className={classNames('settings-tools-page__server-item', {
                          'settings-tools-page__server-item--active': isActive,
                        })}
                        onClick={() => onSelectServer(server.id)}
                      >
                        <div className="settings-tools-page__server-main">
                          <div className="settings-tools-page__server-title-row">
                            <span className="settings-tools-page__server-status" aria-hidden="true">
                              {connectionMeta.icon}
                            </span>
                            <span className="settings-tools-page__server-title">{server.name}</span>
                          </div>
                          <div className="settings-tools-page__server-meta">
                            <span>{server.type.toUpperCase()}</span>
                            <span>{server.endpointLabel}</span>
                          </div>
                        </div>
                        <div className="settings-tools-page__server-side">
                          <Tag color={connectionMeta.tone}>{connectionMeta.label}</Tag>
                          <Tag color={server.enabled ? 'green' : 'gray'}>{server.enabled ? '已启用' : '已停用'}</Tag>
                          {server.oauthReady ? <Tag color="arcoblue">OAuth</Tag> : null}
                        </div>
                      </button>

                      <div className="settings-tools-page__server-actions" onClick={(event) => event.stopPropagation()}>
                        <Button
                          size="mini"
                          type="text"
                          loading={testingServerId === server.id}
                          icon={<Heartbeat size="14" />}
                          onClick={() => onTestServer(server.id)}
                        />
                        <Button size="mini" type="text" icon={<Write size="14" />} onClick={() => onEditServer(server)} />
                        <Popconfirm title="确认删除该 MCP Server？" onOk={() => onDeleteServer(server.id)}>
                          <Button size="mini" type="text" status="danger" icon={<DeleteFour size="14" />} />
                        </Popconfirm>
                        <Switch checked={server.enabled} size="small" onChange={(value) => onToggleServer(server, value)} />
                      </div>
                    </div>

                    {isActive ? (
                      <div className="settings-tools-page__server-preview">
                        <div className="settings-tools-page__server-preview-grid">
                          <div className="settings-tools-page__preview-field">
                            <div className="settings-tools-page__preview-label">接入地址</div>
                            <div className="settings-tools-page__preview-value">{server.endpointLabel}</div>
                          </div>
                          <div className="settings-tools-page__preview-field">
                            <div className="settings-tools-page__preview-label">参数</div>
                            <div className="settings-tools-page__preview-value">{server.args?.trim() || '[]'}</div>
                          </div>
                          <div className="settings-tools-page__preview-field">
                            <div className="settings-tools-page__preview-label">环境变量</div>
                            <div className="settings-tools-page__preview-value">{server.env?.trim() || '{}'}</div>
                          </div>
                        </div>

                        <div className="settings-tools-page__server-note">
                          {server.lastTestMessage?.trim() || '尚未执行连接测试，点击右侧心跳按钮即可在下方详情区保留最近一次诊断结果。'}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()
            ))}
          </div>
        )}
      </div>

      <div className="settings-tools-page__detail-shell">
        <div className="settings-tools-page__section-header">
          <div>
            <div className="settings-group-card__title">Server 详情</div>
            <div className="settings-tools-page__pane-subtitle">保留连接诊断、接入参数和 OAuth 扩展位，但不再使用脱离主卡片的右侧常驻详情栏。</div>
          </div>
        </div>

        <McpServerDetailPane
          server={server}
          testingServerId={testingServerId}
          testMessage={testMessage}
          onDeleteServer={onDeleteServer}
          onEditServer={onEditServer}
          onTestServer={onTestServer}
          onToggleServer={onToggleServer}
        />
      </div>
    </section>
  );
}
