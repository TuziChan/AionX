import { invoke } from '@tauri-apps/api/core';

// --- Types matching Rust models ---

export interface Chat {
  id: string;
  user_id: string | null;
  type: string;
  name: string;
  agent_type: string;
  model: string;
  workspace_path: string;
  status: string;
  extra: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface CreateChat {
  name: string;
  agent_type: string;
  model?: string;
  workspace_path?: string;
  extra?: Record<string, unknown>;
}

export interface ChatUpdate {
  name?: string;
  model?: string;
  status?: string;
  extra?: Record<string, unknown>;
}

export interface Message {
  id: string;
  chat_id: string;
  msg_id: string;
  type: string;
  role: string;
  content: string;
  position: number;
  status: string;
  extra: Record<string, unknown>;
  created_at: number;
}

export interface CreateMessage {
  chat_id: string;
  msg_id?: string;
  type?: string;
  role: string;
  content: string;
  extra?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface GroupedHistory {
  today: Chat[];
  yesterday: Chat[];
  this_week: Chat[];
  this_month: Chat[];
  earlier: Chat[];
}

// --- Chat API ---

export const chatApi = {
  create: (input: CreateChat) => invoke<Chat>('create_chat', { input }),

  get: (id: string) => invoke<Chat | null>('get_chat', { id }),

  list: (page?: number, pageSize?: number) =>
    invoke<PaginatedResult<Chat>>('list_chats', { page, pageSize }),

  update: (id: string, updates: ChatUpdate) =>
    invoke<Chat>('update_chat', { id, updates }),

  delete: (id: string) => invoke<void>('delete_chat', { id }),

  getByWorkspace: (workspacePath: string) =>
    invoke<Chat[]>('get_workspace_chats', { workspacePath }),

  getGroupedHistory: () =>
    invoke<GroupedHistory>('get_grouped_history'),

  getAssociated: (chatId: string) =>
    invoke<Chat | null>('get_associated_chat', { chatId }),

  getMessages: (chatId: string) =>
    invoke<Message[]>('get_messages', { chatId }),

  addMessage: (input: CreateMessage) =>
    invoke<Message>('add_message', { input }),
};
