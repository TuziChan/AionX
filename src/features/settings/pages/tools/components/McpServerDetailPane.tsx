import { Activity, PencilLine, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { McpServer } from '@/bindings';
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

function getConnectionState(testMessage: string | undefined, testing: boolean) {
  if (testing) {
    return { color: 'arcoblue' as const, label: '测试中' };
  }

  if (!testMessage?.trim()) {
    return { color: 'gray' as const, label: '未测试' };
  }

  if (/failed|error|invalid|missing|unsupported|non-success|not found|拒绝|失败|无效|缺少|不存在|错误/i.test(testMessage)) {
    return { color: 'red' as const, label: '连接异常' };
  }

  return { color: 'green' as const, label: '已连通' };
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!server) {
    return (
      <div className="settings-empty-state settings-tools-page__detail-empty" data-testid="tools-server-detail">
        <div className="settings-empty-state__title">选择一个 MCP Server</div>
        <div className="settings-empty-state__desc">上方会展示已接入的工具节点。选中后即可查看状态、测试连通性和维护参数。</div>
      </div>
    );
  }

  const connectionState = getConnectionState(testMessage, testingServerId === server.id);

  return (
    <div className="settings-tools-page__detail" data-testid="tools-server-detail">
      <div className="settings-tools-page__detail-hero">
        <div className="settings-tools-page__detail-meta">
          <div className="settings-tools-page__detail-title">{server.name}</div>
          <div className="settings-tools-page__detail-subtitle">
            <span>{server.type.toUpperCase()}</span>
            <span>{server.url?.trim() || server.command?.trim() || '未配置地址/命令'}</span>
          </div>
          <div className="settings-tools-page__detail-statuses">
            <Badge variant={connectionState.label === '已连通' ? 'default' : connectionState.label === '测试中' ? 'info' : 'outline'}>
              {connectionState.label}
            </Badge>
            <Badge variant={server.enabled ? 'default' : 'outline'}>{server.enabled ? '运行中' : '已停用'}</Badge>
            <Badge variant={server.oauth_config && server.oauth_config !== '{}' ? 'info' : 'outline'}>
              {server.oauth_config && server.oauth_config !== '{}' ? 'OAuth 已配置' : 'OAuth 未配置'}
            </Badge>
          </div>
        </div>
        <div className="settings-tools-page__detail-actions">
          <Switch checked={server.enabled} onCheckedChange={(value) => onToggleServer(server, value)} />
          <Button
            data-testid="tools-test-server"
            type="button"
            disabled={testingServerId === server.id}
            onClick={() => onTestServer(server.id)}
          >
            <Activity data-icon="inline-start" />
            测试连接
          </Button>
          <Button type="button" variant="outline" onClick={() => onEditServer(server)}>
            <PencilLine data-icon="inline-start" />
            编辑
          </Button>
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <Button type="button" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 data-icon="inline-start" />
              删除
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除该 MCP Server？</AlertDialogTitle>
                <AlertDialogDescription>删除后将移除该工具节点配置，并清空最近一次连接诊断结果。</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    onDeleteServer(server.id);
                  }}
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
    </div>
  );
}
