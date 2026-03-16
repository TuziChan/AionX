import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function TextMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[var(--color-message-user-bg)] text-t-primary'
            : 'bg-bg-2 text-t-primary'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
