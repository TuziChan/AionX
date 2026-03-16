import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import type { Chat, GroupedHistory } from '@/services/chat';
import classNames from 'classnames';

type HistoryChat = Pick<Chat, 'id' | 'name'>;
type HistoryGroup = {
  label: string;
  items: HistoryChat[];
};

const FALLBACK_HISTORY: GroupedHistory = {
  today: [
    { id: 'demo', name: 'Landing page revamp' },
    { id: 'demo-codex', name: 'Codex review session' },
  ] as Chat[],
  yesterday: [{ id: 'demo-gemini', name: 'Gemini settings cleanup' }] as Chat[],
  this_week: [],
  this_month: [],
  earlier: [],
};

export function ChatHistory() {
  const history = useChatStore((s) => s.history);
  const loading = useChatStore((s) => s.historyLoading);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const { id: currentChatId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClick = (chat: HistoryChat) => {
    navigate(`/conversation/${chat.id}`);
  };

  if (loading && !history) {
    return <div className="p-4 text-sm text-t-tertiary">Loading...</div>;
  }

  const normalizedHistory: GroupedHistory = history ?? FALLBACK_HISTORY;

  const groups: HistoryGroup[] = [
    { label: 'Today', items: normalizedHistory.today },
    { label: 'Yesterday', items: normalizedHistory.yesterday },
    { label: 'This Week', items: normalizedHistory.this_week },
    { label: 'This Month', items: normalizedHistory.this_month },
    { label: 'Earlier', items: normalizedHistory.earlier },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="p-4 text-sm text-t-tertiary text-center">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="chat-history flex h-full flex-col gap-1 overflow-y-auto pr-2">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="chat-history__section px-2 py-1.5 text-xs font-medium text-t-tertiary uppercase tracking-wide">
            {group.label}
          </div>
          {group.items.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleClick(chat)}
              className={classNames(
                'chat-history__item px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors flex flex-col',
                chat.id === currentChatId
                  ? 'bg-brand/12 text-brand font-medium'
                  : 'text-t-primary hover:bg-hover'
              )}
            >
              <span className="chat-history__item-name truncate">{chat.name || 'Untitled'}</span>
              <span className="chat-history__item-editor text-xs text-t-secondary">
                {chat.id.startsWith('demo') ? 'Mock conversation' : 'Workspace ready'}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
