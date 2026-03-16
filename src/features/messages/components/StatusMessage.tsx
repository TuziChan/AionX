import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function StatusMessage({ message }: Props) {
  return (
    <div className="flex justify-center">
      <div className="chat-status-pill text-xs text-t-tertiary">
        {message.content}
      </div>
    </div>
  );
}
