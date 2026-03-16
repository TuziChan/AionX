import { useState, useRef, useCallback } from 'react';
import { PauseOne, Send } from '@icon-park/react';
import { useAgentStore } from '../stores/agentStore';
import { getAgentAdapter } from '../adapters';

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
    const adapter = getAgentAdapter(agentType);
    const text = (adapter.preprocessMessage?.(input) ?? input).trim();
    if (!text || isRunning) return;

    setInput('');
    await sendMessage(chatId, agentType, text, adapter.getDefaultConfig());
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
    <div className="chat-sendbox border-t border-b-base px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="chat-sendbox__inner">
          <textarea
            ref={textareaRef}
            className="chat-sendbox__textarea"
            rows={1}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
          />
          {isRunning ? (
            <button
              className="chat-sendbox__button chat-sendbox__button--danger"
              onClick={handleStop}
              title="Stop"
            >
              <PauseOne theme="filled" size="16" />
            </button>
          ) : (
            <button
              className="chat-sendbox__button"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send"
            >
              <Send theme="outline" size="16" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
