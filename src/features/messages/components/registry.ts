import type { ComponentType } from 'react';
import type { Message } from '@/services/chat';
import { FileChangesMessage } from './FileChangesMessage';
import { PermissionMessage } from './PermissionMessage';
import { PlanMessage } from './PlanMessage';
import { StatusMessage } from './StatusMessage';
import { TextMessage } from './TextMessage';
import { ToolCallMessage } from './ToolCallMessage';

export type MessageRenderer = ComponentType<{ message: Message }>;

const renderers = new Map<string, MessageRenderer>();

export function registerMessageRenderer(type: string, renderer: MessageRenderer) {
  renderers.set(type, renderer);
}

export function getMessageRenderer(message: Message): MessageRenderer {
  return renderers.get(message.type) ?? TextMessage;
}

registerMessageRenderer('text', TextMessage);
registerMessageRenderer('tool_call', ToolCallMessage);
registerMessageRenderer('status', StatusMessage);
registerMessageRenderer('tips', StatusMessage);
registerMessageRenderer('permission', PermissionMessage);
registerMessageRenderer('plan', PlanMessage);
registerMessageRenderer('file_changes', FileChangesMessage);
