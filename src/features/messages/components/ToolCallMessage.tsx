import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function ToolCallMessage({ message }: Props) {
  const tool = (message.extra as Record<string, unknown>)?.tool as string ?? 'unknown';
  const input = (message.extra as Record<string, unknown>)?.input;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-xl px-4 py-3 bg-bg-2 border border-b-light">
        <div className="flex items-center gap-2 mb-2">
          <span className="i-icon-park-outline-tool text-brand text-base" />
          <span className="text-sm font-medium text-t-secondary">{tool}</span>
        </div>
        {input != null && (
          <pre className="text-xs bg-bg-3 rounded-lg p-2 overflow-x-auto text-t-tertiary">
            {String(typeof input === 'string' ? input : JSON.stringify(input, null, 2))}
          </pre>
        )}
      </div>
    </div>
  );
}
