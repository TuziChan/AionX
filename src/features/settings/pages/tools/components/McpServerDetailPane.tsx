import { Button, Popconfirm, Switch, Tag } from '@arco-design/web-react';
import { DeleteFour, Heartbeat, Write } from '@icon-park/react';
import type { McpServer } from '@/bindings';

interface McpServerDetailPaneProps {
  server: McpServer | null;
  testingServerId: string | null;
  testMessage?: string;
  onDeleteServer: (serverId: string) => void;
  onEditServer: (server: McpServer) => void;
  onTestServer: (serverId: string) => void;
  onToggleServer: (server: McpServer, enabled: boolean) => void;
}

function getMetaValue(value: string | null | undefined, fallback = '未配置') {
  const nextValue = value?.trim();
  return nextValue ? nextValue : fallback;
}

export function McpServerDetailPane({
  server,
  testingServerId,
  testMessage,
  onDeleteServer,
  onEditServer,
  onTestServer,
  onToggleServer,
}: McpServerDetailPaneProps) {
  if (!server) {
    return (
      <section className="settings-group-card settings-tools-page__detail" data-testid="tools-server-detail">
        <div className="settings-empty-state settings-tools-page__detail-empty">
          <div className="settings-empty-state__title">选择一个 MCP Server</div>
          <div className="settings-empty-state__desc">左侧会展示已接入的工具节点。选中后即可查看状态、测试连通性和维护参数。</div>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-group-card settings-tools-page__detail" data-testid="tools-server-detail">
      <div className="settings-tools-page__detail-hero">
        <div className="settings-tools-page__detail-meta">
          <div className="settings-tools-page__detail-title">{server.name}</div>
          <div className="settings-tools-page__detail-subtitle">
            <span>{server.type.toUpperCase()}</span>
            <span>{server.url?.trim() || server.command?.trim() || '未配置地址/命令'}</span>
          </div>
        </div>
        <div className="settings-tools-page__detail-actions">
          <Tag color={server.enabled ? 'green' : 'gray'}>{server.enabled ? '运行中' : '已停用'}</Tag>
          <Tag color={server.oauth_config && server.oauth_config !== '{}' ? 'arcoblue' : 'gray'}>
            {server.oauth_config && server.oauth_config !== '{}' ? 'OAuth 已配置' : 'OAuth 未配置'}
          </Tag>
          <Switch checked={server.enabled} onChange={(value) => onToggleServer(server, value)} />
          <Button
            data-testid="tools-test-server"
            loading={testingServerId === server.id}
            icon={<Heartbeat size="16" />}
            onClick={() => onTestServer(server.id)}
          >
            测试连接
          </Button>
          <Button icon={<Write size="16" />} onClick={() => onEditServer(server)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该 MCP Server？" onOk={() => onDeleteServer(server.id)}>
            <Button status="danger" icon={<DeleteFour size="16" />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      </div>

      <div className="settings-tools-page__detail-grid">
        <div className="settings-tools-page__meta-card">
          <div className="settings-tools-page__meta-label">接入地址</div>
          <div className="settings-tools-page__meta-value">{getMetaValue(server.url, getMetaValue(server.command))}</div>
        </div>
        <div className="settings-tools-page__meta-card">
          <div className="settings-tools-page__meta-label">参数</div>
          <div className="settings-tools-page__meta-value">{getMetaValue(server.args, '[]')}</div>
        </div>
        <div className="settings-tools-page__meta-card">
          <div className="settings-tools-page__meta-label">环境变量</div>
          <div className="settings-tools-page__meta-value">{getMetaValue(server.env, '{}')}</div>
        </div>
      </div>

      <div className="settings-tools-page__detail-section">
        <div className="settings-tools-page__section-header">
          <div>
            <div className="settings-group-card__title">连接诊断</div>
            <div className="settings-tools-page__pane-subtitle">测试结果会保留在当前页面，便于继续排查命令、URL 和环境变量。</div>
          </div>
        </div>

        <div className="settings-tools-page__status-card" data-testid="tools-last-test-status">
          {testMessage || '尚未执行连接测试。'}
        </div>
      </div>

      <div className="settings-tools-page__detail-section">
        <div className="settings-tools-page__section-header">
          <div>
            <div className="settings-group-card__title">OAuth / 扩展预留</div>
            <div className="settings-tools-page__pane-subtitle">这里保留给 OAuth 跳转、批量导入和只读扩展 server 的后续扩展位。</div>
          </div>
        </div>

        <div className="settings-tools-page__status-card settings-tools-page__status-card--muted">
          当前 server 已保存基础配置，后续能力会在这里继续扩展，而不再回到单页堆按钮模式。
        </div>
      </div>
    </section>
  );
}
