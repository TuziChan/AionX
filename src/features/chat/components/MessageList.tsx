import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { MessageItem, StreamingMessage } from '@/features/messages';

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const streamingMsgId = useChatStore((s) => s.streamingMsgId);
  const loading = useChatStore((s) => s.messagesLoading);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingContent]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-t-tertiary">
        Loading...
      </div>
    );
  }

  if (messages.length === 0 && !streamingMsgId) {
    return (
      <div className="flex-1 flex items-center justify-center text-t-tertiary">
        <div className="text-center">
          <div className="text-lg mb-2">Start a conversation</div>
          <div className="text-sm">Send a message to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        {streamingMsgId && (
          <StreamingMessage content={streamingContent} />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
