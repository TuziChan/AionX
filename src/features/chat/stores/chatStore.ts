import { create } from 'zustand';
import { chatApi, type Chat, type GroupedHistory, type Message } from '@/services/chat';

interface ChatState {
  // 当前会话
  currentChatId: string | null;
  currentChat: Chat | null;

  // 消息列表
  messages: Message[];
  messagesLoading: boolean;

  // 历史会话（分组）
  history: GroupedHistory | null;
  historyLoading: boolean;

  // 流式消息缓冲
  streamingContent: string;
  streamingMsgId: string | null;

  // Actions
  setCurrentChat: (chatId: string | null) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  createChat: (name: string, agentType: string, model?: string) => Promise<Chat>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, name: string) => Promise<void>;

  // 流式消息
  appendStreamContent: (msgId: string, delta: string) => void;
  completeStream: (msgId: string) => void;
  clearStream: () => void;

  // 添加消息到本地列表
  addLocalMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentChatId: null,
  currentChat: null,
  messages: [],
  messagesLoading: false,
  history: null,
  historyLoading: false,
  streamingContent: '',
  streamingMsgId: null,

  setCurrentChat: async (chatId) => {
    set({ currentChatId: chatId, currentChat: null, messages: [] });
    if (chatId) {
      const chat = await chatApi.get(chatId);
      set({ currentChat: chat });
      await get().loadMessages(chatId);
    }
  },

  loadMessages: async (chatId) => {
    set({ messagesLoading: true });
    try {
      const messages = await chatApi.getMessages(chatId);
      set({ messages, messagesLoading: false });
    } catch {
      set({ messagesLoading: false });
    }
  },

  loadHistory: async () => {
    set({ historyLoading: true });
    try {
      const history = await chatApi.getGroupedHistory();
      set({ history, historyLoading: false });
    } catch {
      set({ historyLoading: false });
    }
  },

  createChat: async (name, agentType, model) => {
    const chat = await chatApi.create({ name, agent_type: agentType, model });
    await get().loadHistory();
    return chat;
  },

  deleteChat: async (id) => {
    await chatApi.delete(id);
    if (get().currentChatId === id) {
      set({ currentChatId: null, currentChat: null, messages: [] });
    }
    await get().loadHistory();
  },

  renameChat: async (id, name) => {
    await chatApi.update(id, { name });
    await get().loadHistory();
    if (get().currentChatId === id) {
      set((s) => ({
        currentChat: s.currentChat ? { ...s.currentChat, name } : null,
      }));
    }
  },

  appendStreamContent: (msgId, delta) => {
    set((s) => ({
      streamingMsgId: msgId,
      streamingContent: s.streamingMsgId === msgId
        ? s.streamingContent + delta
        : delta,
    }));
  },

  completeStream: (msgId) => {
    const { streamingContent, messages } = get();
    // 将流式内容转为正式消息
    const streamMsg: Message = {
      id: msgId || crypto.randomUUID(),
      chat_id: get().currentChatId || '',
      msg_id: msgId,
      type: 'text',
      role: 'assistant',
      content: streamingContent,
      position: messages.length,
      status: 'complete',
      extra: {},
      created_at: Date.now() / 1000,
    };
    set((s) => ({
      messages: [...s.messages, streamMsg],
      streamingContent: '',
      streamingMsgId: null,
    }));
  },

  clearStream: () => {
    set({ streamingContent: '', streamingMsgId: null });
  },

  addLocalMessage: (msg) => {
    set((s) => ({ messages: [...s.messages, msg] }));
  },
}));
