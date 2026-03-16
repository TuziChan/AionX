import { useState, useRef, useCallback } from 'react';
import { useAgentStore } from '../stores/agentStore';

interface Props {
  chatId: string;
  agentType: string;
}

export function SendBox({ chatId, agentType }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const status = useAgentStore((s) => s.status);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const stopAgent = useAgentStore((s) => s.stopAgent);
  const isRunning = status === 'running';

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isRunning) return;

    setInput('');
    await sendMessage(chatId, agentType, text, {
      agent_type: agentType,
    });
  }, [input, isRunning, chatId, agentType, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    stopAgent(chatId);
  };

  // 自动调整高度
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  return (
    <div className="border-t border-b-light px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-bg-1 rounded-xl px-3 py-2 border border-b-base focus-within:border-brand transition-colors">
          <textarea
            ref={textareaRef}
            className="flex-1 bg-transparent text-t-primary text-sm resize-none outline-none min-h-[24px] max-h-[200px] leading-normal"
            rows={1}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
          />
          {isRunning ? (
            <button
              className="shrink-0 w-8 h-8 rounded-lg bg-danger text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              onClick={handleStop}
              title="Stop"
            >
              <span className="i-icon-park-outline-pause text-sm" />
            </button>
          ) : (
            <button
              className="shrink-0 w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send"
            >
              <span className="i-icon-park-outline-send text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
