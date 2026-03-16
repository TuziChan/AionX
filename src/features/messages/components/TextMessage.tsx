import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function TextMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
        {message.content}
      </div>
    </div>
  );
}
