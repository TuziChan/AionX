import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import type { Chat } from '@/services/chat';
import classNames from 'classnames';

export function ChatHistory() {
  const history = useChatStore((s) => s.history);
  const loading = useChatStore((s) => s.historyLoading);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const { id: currentChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClick = (chat: Chat) => {
    navigate(`/chat/${chat.id}`);
  };

  if (loading && !history) {
    return <div className="p-4 text-sm text-t-tertiary">Loading...</div>;
  }

  if (!history) return null;

  const groups = [
    { label: 'Today', items: history.today },
    { label: 'Yesterday', items: history.yesterday },
    { label: 'This Week', items: history.this_week },
    { label: 'This Month', items: history.this_month },
    { label: 'Earlier', items: history.earlier },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="p-4 text-sm text-t-tertiary text-center">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-2 py-1.5 text-xs font-medium text-t-tertiary uppercase tracking-wide">
            {group.label}
          </div>
          {group.items.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleClick(chat)}
              className={classNames(
                'px-3 py-2 rounded-lg cursor-pointer text-sm truncate transition-colors',
                chat.id === currentChatId
                  ? 'bg-brand/12 text-brand font-medium'
                  : 'text-t-primary hover:bg-hover'
              )}
            >
              {chat.name || 'Untitled'}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
