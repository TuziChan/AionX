import type { Message } from '@/services/chat';
import { TextMessage } from './TextMessage';
import { ToolCallMessage } from './ToolCallMessage';
import { StatusMessage } from './StatusMessage';

interface Props {
  message: Message;
}

export function MessageItem({ message }: Props) {
  switch (message.type) {
    case 'tool_call':
      return <ToolCallMessage message={message} />;
    case 'status':
    case 'tips':
      return <StatusMessage message={message} />;
    case 'text':
    default:
      return <TextMessage message={message} />;
  }
}
