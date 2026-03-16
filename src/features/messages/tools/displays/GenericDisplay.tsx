import type { ToolDisplayProps } from '../registry';

export function GenericDisplay({ tool, input, output }: ToolDisplayProps) {
  return (
    <div className="chat-tool-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-brand" />
        <span className="text-sm font-medium text-t-secondary">{tool}</span>
      </div>
      {input != null && (
        <details className="mb-2">
          <summary className="text-xs text-t-tertiary cursor-pointer">Input</summary>
          <pre className="chat-tool-card__body text-xs mt-1 overflow-x-auto text-t-tertiary">
            {String(typeof input === 'string' ? input : JSON.stringify(input, null, 2))}
          </pre>
        </details>
      )}
      {output != null && (
        <details>
          <summary className="text-xs text-t-tertiary cursor-pointer">Output</summary>
          <pre className="chat-tool-card__body text-xs mt-1 overflow-x-auto text-t-tertiary">
            {String(typeof output === 'string' ? output : JSON.stringify(output, null, 2))}
          </pre>
        </details>
      )}
    </div>
  );
}
