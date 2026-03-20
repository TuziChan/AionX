import {
  AlertCircle,
  FolderOpen,
  History,
  MonitorUp,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MessageItem } from '@/features/messages';
import type { Message } from '@/services/chat';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { cn } from '@/shared/lib';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';
import { ChatLayout } from './ChatLayout';
import { ChatSidebar } from './ChatSidebar';
import { AgentStatusBadge } from './AgentStatusBadge';
import { ChatTabs } from './ChatTabs';
import { useAgentStore } from '../stores/agentStore';
import { useChatStore } from '../stores/chatStore';
import { MessageList } from './MessageList';
import { PermissionDialog } from './PermissionDialog';
import { SendBox } from './SendBox';

const demoMessages: Message[] = [
  {
    id: 'demo-1',
    chat_id: 'demo',
    msg_id: 'demo-1',
    type: 'status',
    role: 'system',
    content: 'Workspace 已挂载，准备分析页面差异。',
    position: 0,
    status: 'complete',
    extra: {},
    created_at: Date.now() / 1000,
  },
  {
    id: 'demo-2',
    chat_id: 'demo',
    msg_id: 'demo-2',
    type: 'text',
    role: 'user',
    content: '请对齐 Conversation 页面结构，并保留 workspace / preview 面板。',
    position: 1,
    status: 'complete',
    extra: {},
    created_at: Date.now() / 1000,
  },
  {
    id: 'demo-3',
    chat_id: 'demo',
    msg_id: 'demo-3',
    type: 'tool_call',
    role: 'assistant',
    content: 'inspect layout',
    position: 2,
    status: 'complete',
    extra: {
      tool: 'read_layout',
      input: {
        target: 'conversation-shell',
      },
    },
    created_at: Date.now() / 1000,
  },
  {
    id: 'demo-4',
    chat_id: 'demo',
    msg_id: 'demo-4',
    type: 'text',
    role: 'assistant',
    content:
      '已经完成壳层重构。下一步建议先统一 Header / Tabs，再处理预览与工作区的折叠状态和拖拽宽度。',
    position: 3,
    status: 'complete',
    extra: {},
    created_at: Date.now() / 1000,
  },
];

const previewTabs = ['Overview', 'Diff', 'HTML'];
type PreviewTab = (typeof previewTabs)[number];
interface ConversationLocationState {
  seedPrompt?: string;
  seedAgent?: string;
  seedWorkspace?: string;
  seedModel?: string;
}

function DemoConversation() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="max-w-3xl mx-auto space-y-4">
        {demoMessages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({
  previewTab,
  onTabChange,
}: {
  previewTab: PreviewTab;
  onTabChange: (value: string) => void;
}) {
  return (
    <Tabs value={previewTab} onValueChange={onTabChange} className="chat-preview">
      <div className="chat-preview__header">
        <div>
          <div className="chat-preview__title">Preview</div>
          <div className="chat-preview__meta">实时查看右侧产物与布局片段</div>
        </div>
      </div>
      <TabsList className="chat-preview__tabs h-auto justify-start rounded-none bg-transparent p-0">
        {previewTabs.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="chat-preview__tab">
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
      {previewTabs.map((tab) => (
        <TabsContent key={tab} value={tab} className="chat-preview__body mt-0 flex-1">
          <div className="chat-preview__canvas">
            <div className="chat-preview__mini-title">{tab}</div>
            <div className="chat-preview__mini-window">
              <div className="chat-preview__mini-toolbar" />
              <div className="chat-preview__mini-content">
                <div className="chat-preview__mini-card" />
                <div className="chat-preview__mini-card chat-preview__mini-card--wide" />
                <div className="chat-preview__mini-grid">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function Component() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useLayoutContext();
  const setCurrentChat = useChatStore((state) => state.setCurrentChat);
  const currentChat = useChatStore((state) => state.currentChat);
  const messages = useChatStore((state) => state.messages);
  const unsubscribe = useAgentStore((state) => state.unsubscribe);
  const error = useAgentStore((state) => state.error);
  const clearError = useAgentStore((state) => state.clearError);
  const agentStatus = useAgentStore((state) => state.status);

  const [workspaceOpen, setWorkspaceOpen] = useState(!isMobile);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>(previewTabs[0]);

  useEffect(() => {
    if (id?.startsWith('demo')) {
      void setCurrentChat(null);
    } else if (id) {
      void setCurrentChat(id);
    }

    return () => {
      unsubscribe();
    };
  }, [id, setCurrentChat, unsubscribe]);

  useEffect(() => {
    if (isMobile) {
      setWorkspaceOpen(false);
    }
  }, [isMobile, id]);

  if (!id) {
    return (
      <div className="flex-1 flex items-center justify-center text-t-tertiary">
        No conversation selected
      </div>
    );
  }

  const locationState = location.state as ConversationLocationState | null;
  const seedPrompt = locationState?.seedPrompt;
  const conversationTitle = currentChat?.name || seedPrompt || (id === 'demo' ? 'Landing page revamp' : `Conversation ${id}`);
  const agentType = currentChat?.agent_type || (locationState?.seedAgent ?? 'acp');
  const showDemoConversation = id.startsWith('demo') && messages.length === 0;

  const headerTags = useMemo(
    () => [
      {
        label: `Agent · ${agentType}`,
        className: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-200',
      },
      {
        label: previewOpen ? 'Preview On' : 'Preview Off',
        className: previewOpen
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200'
          : 'border-border bg-muted text-muted-foreground',
      },
      {
        label: workspaceOpen ? 'Workspace Open' : 'Workspace Closed',
        className: workspaceOpen
          ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-200'
          : 'border-border bg-muted text-muted-foreground',
      },
    ],
    [agentType, previewOpen, workspaceOpen]
  );

  const statusBadgeClass = cn(
    'border-border bg-muted text-muted-foreground',
    agentStatus === 'running' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200',
    agentStatus === 'starting' && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200',
    agentStatus === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive'
  );

  return (
    <ChatLayout
      tabs={<ChatTabs chatId={id} currentTitle={conversationTitle} />}
      header={
        <div className="chat-layout-header">
          <div className="chat-layout-header__main">
            <div>
              <h2 className="chat-layout-header__title">{conversationTitle}</h2>
              <p className="chat-layout-header__subtitle">
                统一 Header / Tabs / Workspace / Preview 的会话页骨架，兼容桌面与移动端。
              </p>
            </div>
            <div className="chat-layout-header__tags">
              {headerTags.map((item) => (
                <Badge key={item.label} variant="outline" className={item.className}>
                  {item.label}
                </Badge>
              ))}
              <Badge variant="outline" className={statusBadgeClass}>
                Status · {agentStatus}
              </Badge>
              <AgentStatusBadge />
            </div>
          </div>

          <div className="chat-layout-header__actions">
            <Button
              variant={workspaceOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setWorkspaceOpen((prev) => !prev)}
            >
              {workspaceOpen ? <PanelLeftClose data-icon="inline-start" /> : <PanelLeftOpen data-icon="inline-start" />}
              Workspace
            </Button>
            <Button
              variant={previewOpen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewOpen((prev) => !prev)}
            >
              <MonitorUp data-icon="inline-start" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings/agent')}>
              <Settings2 data-icon="inline-start" />
              Settings
            </Button>
          </div>
        </div>
      }
      body={
        <>
          {error && (
            <div className="px-3 pt-3 md:px-4">
              <Alert variant="destructive" className="chat-error-banner">
                <AlertCircle />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <AlertTitle>Agent error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="chat-error-banner__dismiss" onClick={clearError}>
                    关闭
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          <div className="chat-layout-body">
            <div className="chat-thread-panel">
              {showDemoConversation ? <DemoConversation /> : <MessageList />}
              <div className="chat-sendbox-toolbar">
                <Button type="button" variant="ghost" size="sm" className="chat-sendbox-toolbar__chip">
                  <History data-icon="inline-start" />
                  最近上下文
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="chat-sendbox-toolbar__chip"
                  onClick={() => setWorkspaceOpen((prev) => !prev)}
                >
                  <FolderOpen data-icon="inline-start" />
                  Workspace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="chat-sendbox-toolbar__chip"
                  onClick={() => setPreviewOpen((prev) => !prev)}
                >
                  <Sparkles data-icon="inline-start" />
                  Preview
                </Button>
              </div>
              <SendBox chatId={id} agentType={agentType} />
            </div>

            {previewOpen && !isMobile && (
              <div className="chat-preview-panel">
                <PreviewPanel previewTab={previewTab} onTabChange={setPreviewTab} />
              </div>
            )}
          </div>
          <PermissionDialog chatId={id} />
        </>
      }
      sidebar={
        workspaceOpen && !isMobile ? (
          <aside className="chat-workspace-panel">
            <ChatSidebar />
          </aside>
        ) : undefined
      }
      mobileOverlay={
        isMobile && (workspaceOpen || previewOpen) ? (
          <div
            className="chat-mobile-overlay"
            onClick={() => {
              setWorkspaceOpen(false);
              setPreviewOpen(false);
            }}
          />
        ) : undefined
      }
      mobilePanels={
        <>
          {isMobile && workspaceOpen && (
            <aside className="chat-workspace-panel chat-workspace-panel--mobile">
              <ChatSidebar />
            </aside>
          )}
          {isMobile && previewOpen && (
            <div className="chat-preview-panel chat-preview-panel--mobile">
              <PreviewPanel previewTab={previewTab} onTabChange={setPreviewTab} />
            </div>
          )}
        </>
      }
    />
  );
}

Component.displayName = 'ChatSession';
