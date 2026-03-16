import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function PlanMessage({ message }: Props) {
  const lines = message.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="flex justify-start">
      <div className="chat-tool-card">
        <div className="text-xs font-semibold text-primary mb-2">Plan</div>
        <ul className="text-sm text-t-secondary list-disc pl-4 space-y-1">
          {lines.length > 0 ? lines.map((line) => <li key={line}>{line}</li>) : <li>{message.content}</li>}
        </ul>
      </div>
    </div>
  );
}
