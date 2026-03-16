import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from './stores/chatStore';
import { useAgentStore } from './stores/agentStore';
import { MessageList } from './components/MessageList';
import { SendBox } from './components/SendBox';
import { PermissionDialog } from './components/PermissionDialog';
import { AgentStatusBadge } from './components/AgentStatusBadge';
import { Tag } from '@arco-design/web-react';

const AGENT_COLORS: Record<string, string> = {
  acp: 'purple',
  gemini: 'blue',
  codex: 'green',
  nanobot: 'orange',
  openclaw: 'red',
};

export function Component() {
  const { id } = useParams<{ id: string }>();
  const setCurrentChat = useChatStore((s) => s.setCurrentChat);
  const currentChat = useChatStore((s) => s.currentChat);
  const unsubscribe = useAgentStore((s) => s.unsubscribe);
  const error = useAgentStore((s) => s.error);
  const clearError = useAgentStore((s) => s.clearError);

  useEffect(() => {
    if (id) {
      setCurrentChat(id);
    }
    return () => {
      unsubscribe();
    };
  }, [id, setCurrentChat, unsubscribe]);

  if (!id) {
    return (
      <div className="flex-1 flex items-center justify-center text-t-tertiary">
        No chat selected
      </div>
    );
  }

  const agentType = currentChat?.agent_type || 'acp';

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-b-light">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-medium text-t-primary truncate">
            {currentChat?.name || 'Loading...'}
          </h2>
          <Tag color={AGENT_COLORS[agentType] ?? 'gray'} size="small">
            {agentType}
          </Tag>
        </div>
        <AgentStatusBadge />
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 bg-danger/10 text-danger text-sm px-4 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button className="text-xs underline" onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* Message list */}
      <MessageList />

      {/* Send box */}
      <SendBox chatId={id} agentType={agentType} />

      {/* Permission dialog */}
      <PermissionDialog chatId={id} />
    </div>
  );
}

Component.displayName = 'ChatPage';
