import type { Message } from '@/services/chat';
import { getMessageRenderer } from './registry';

interface Props {
  message: Message;
}

export function MessageItem({ message }: Props) {
  const Renderer = getMessageRenderer(message);
  return <Renderer message={message} />;
}
