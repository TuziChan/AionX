import type { Message } from '@/services/chat';

export type { Message };

export type MessageType = 'text' | 'tool_call' | 'plan' | 'permission' | 'file_changes' | 'status' | 'tips';
export type MessageRole = 'user' | 'assistant' | 'system';
