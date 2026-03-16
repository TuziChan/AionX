import type { Message } from '@/services/chat';
import { Tool } from '@icon-park/react';

interface Props {
  message: Message;
}

export function ToolCallMessage({ message }: Props) {
  const tool = (message.extra as Record<string, unknown>)?.tool as string ?? 'unknown';
  const input = (message.extra as Record<string, unknown>)?.input;

  return (
    <div className="flex justify-start">
      <div className="chat-tool-card">
        <div className="flex items-center gap-2 mb-2">
          <Tool theme="outline" size="16" className="text-brand" />
          <span className="text-sm font-medium text-t-secondary">{tool}</span>
        </div>
        {input != null && (
          <pre className="chat-tool-card__body text-xs overflow-x-auto text-t-tertiary">
            {String(typeof input === 'string' ? input : JSON.stringify(input, null, 2))}
          </pre>
        )}
      </div>
    </div>
  );
}
