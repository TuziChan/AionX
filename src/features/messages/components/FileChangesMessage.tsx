import type { Message } from '@/services/chat';

interface Props {
  message: Message;
}

export function FileChangesMessage({ message }: Props) {
  const extra = message.extra as Record<string, unknown>;
  const files = Array.isArray(extra.files) ? extra.files : [];

  return (
    <div className="flex justify-start">
      <div className="chat-tool-card">
        <div className="text-xs font-semibold text-success mb-2">File Changes</div>
        {files.length === 0 ? (
          <div className="text-sm text-t-secondary">{message.content || 'No file metadata provided.'}</div>
        ) : (
          <ul className="text-sm text-t-secondary space-y-1">
            {files.map((file, index) => (
              <li key={`${String(file)}-${index}`}>{String(file)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
