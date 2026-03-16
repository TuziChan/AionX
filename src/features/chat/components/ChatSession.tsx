import { Button, Tag } from '@arco-design/web-react';
import {
  ExpandLeft,
  ExpandRight,
  FolderOpen,
  History,
  PreviewOpen,
  SettingTwo,
} from '@icon-park/react';
import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MessageItem } from '@/features/messages';
import type { Message } from '@/services/chat';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { ChatLayout } from './ChatLayout';
import { ChatSidebar } from './ChatSidebar';
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
  previewTab: string;
  onTabChange: (value: string) => void;
}) {
  return (
    <div className="chat-preview preview-panel">
      <div className="chat-preview__header">
        <div>
          <div className="chat-preview__title">Preview</div>
          <div className="chat-preview__meta">实时查看右侧产物与布局片段</div>
        </div>
      </div>
      <div className="chat-preview__tabs">
        {previewTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={classNames('chat-preview__tab', previewTab === tab && 'chat-preview__tab--active')}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="chat-preview__body">
        <div className="chat-preview__canvas">
          <div className="chat-preview__mini-title">{previewTab}</div>
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
      </div>
    </div>
  );
}

export function Component() {
  const { id } = useParams<{ id: string }>();
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
  const [previewTab, setPreviewTab] = useState(previewTabs[0]);

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

  const seedPrompt = (location.state as { seedPrompt?: string } | null)?.seedPrompt;
  const conversationTitle = currentChat?.name || seedPrompt || (id === 'demo' ? 'Landing page revamp' : `Conversation ${id}`);
  const agentType = currentChat?.agent_type || ((location.state as { seedAgent?: string } | null)?.seedAgent ?? 'acp');
  const showDemoConversation = id.startsWith('demo') && messages.length === 0;
  const statusTone =
    agentStatus === 'running'
      ? 'blue'
      : agentStatus === 'error'
        ? 'red'
        : agentStatus === 'starting'
          ? 'gold'
          : 'green';

  const headerTags = useMemo(
    () => [
      { label: `Agent · ${agentType}`, color: 'blue' as const },
      { label: previewOpen ? 'Preview On' : 'Preview Off', color: previewOpen ? ('green' as const) : ('gray' as const) },
      { label: workspaceOpen ? 'Workspace Open' : 'Workspace Closed', color: workspaceOpen ? ('purple' as const) : ('gray' as const) },
    ],
    [agentType, previewOpen, workspaceOpen]
  );

  return (
    <ChatLayout
      tabs={<ChatTabs currentTitle={conversationTitle} />}
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
                  <Tag key={item.label} color={item.color}>
                    {item.label}
                  </Tag>
                ))}
                <Tag color={statusTone}>Status · {agentStatus}</Tag>
              </div>
            </div>

            <div className="chat-layout-header__actions">
              <Button
                type={workspaceOpen ? 'primary' : 'outline'}
                size="small"
                icon={workspaceOpen ? <ExpandRight theme="outline" size="16" /> : <ExpandLeft theme="outline" size="16" />}
                onClick={() => setWorkspaceOpen((prev) => !prev)}
              >
                Workspace
              </Button>
              <Button
                type={previewOpen ? 'primary' : 'outline'}
                size="small"
                icon={<PreviewOpen theme="outline" size="16" />}
                onClick={() => setPreviewOpen((prev) => !prev)}
              >
                Preview
              </Button>
              <Button type="outline" size="small" icon={<SettingTwo theme="outline" size="16" />}>
                Settings
              </Button>
            </div>
          </div>
      }
      body={
        <>
          {error && (
            <div className="chat-error-banner">
              <span>{error}</span>
              <button type="button" onClick={clearError}>
                关闭
              </button>
            </div>
          )}

          <div className="chat-layout-body">
            <div className="chat-thread-panel">
              {showDemoConversation ? <DemoConversation /> : <MessageList />}
              <div className="chat-sendbox-toolbar">
                <button type="button" className="chat-sendbox-toolbar__chip">
                  <History theme="outline" size="16" />
                  最近上下文
                </button>
                <button type="button" className="chat-sendbox-toolbar__chip">
                  <FolderOpen theme="outline" size="16" />
                  Workspace
                </button>
                <button type="button" className="chat-sendbox-toolbar__chip">
                  <PreviewOpen theme="outline" size="16" />
                  Preview
                </button>
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
