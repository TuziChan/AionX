import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function StatusMessage({ message }: Props) {
  return (
    <div className="flex justify-center">
      <div className="text-xs text-t-tertiary bg-bg-1 px-3 py-1 rounded-full">
        {message.content}
      </div>
    </div>
  );
}
