import { useCallback, useRef, useState } from 'react';
import { SendHorizontal, Square } from 'lucide-react';
import { Button, Textarea } from '@/shared/ui';
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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
      <div className="mx-auto max-w-3xl">
        <div className="chat-sendbox__inner">
          <Textarea
            ref={textareaRef}
            className="chat-sendbox__textarea min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            rows={1}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
          />
          {isRunning ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="chat-sendbox__button chat-sendbox__button--danger"
              onClick={handleStop}
              title="Stop"
            >
              <Square data-icon="inline-start" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              className="chat-sendbox__button"
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send"
            >
              <SendHorizontal data-icon="inline-start" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
