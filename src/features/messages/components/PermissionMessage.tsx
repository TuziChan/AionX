import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function PermissionMessage({ message }: Props) {
  const extra = message.extra as Record<string, unknown>;
  const description = String(extra.description ?? message.content ?? 'Permission request');

  return (
    <div className="flex justify-start">
      <div className="chat-tool-card border border-warning/40 bg-warning/8">
        <div className="text-xs font-semibold text-warning mb-1">Permission Request</div>
        <div className="text-sm text-t-secondary">{description}</div>
      </div>
    </div>
  );
}
