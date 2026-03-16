import { create } from 'zustand';
import {
  agentApi,
  listenAllAgentEvents,
  type AgentConfig,
  type AgentStatus,
  type DetectedAgent,
} from '@/services/agent';
import { useChatStore } from './chatStore';

interface PermissionRequest {
  id: string;
  description: string;
}

interface AgentState {
  // 状态
  status: AgentStatus;
  detectedAgents: DetectedAgent[];
  pendingPermission: PermissionRequest | null;
  error: string | null;

  // 清理函数
  _unlisten: (() => void) | null;

  // Actions
  sendMessage: (chatId: string, agentType: string, content: string, config: AgentConfig) => Promise<void>;
  stopAgent: (chatId: string) => Promise<void>;
  approvePermission: (chatId: string, requestId: string, approved: boolean) => Promise<void>;
  detectAgents: () => Promise<void>;
  subscribeToEvents: (chatId: string) => Promise<void>;
  unsubscribe: () => void;
  clearError: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  status: 'idle',
  detectedAgents: [],
  pendingPermission: null,
  error: null,
  _unlisten: null,

  sendMessage: async (chatId, agentType, content, config) => {
    set({ status: 'running', error: null });

    // 添加用户消息到本地
    const chatStore = useChatStore.getState();
    chatStore.addLocalMessage({
      id: crypto.randomUUID(),
      chat_id: chatId,
      msg_id: '',
      type: 'text',
      role: 'user',
      content,
      position: chatStore.messages.length,
      status: 'complete',
      extra: {},
      created_at: Date.now() / 1000,
    });

    // 确保事件监听已启动
    await get().subscribeToEvents(chatId);

    try {
      await agentApi.sendMessage(chatId, agentType, content, config);
    } catch (e) {
      set({ status: 'error', error: String(e) });
    }
  },

  stopAgent: async (chatId) => {
    try {
      await agentApi.stop(chatId);
      set({ status: 'idle' });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  approvePermission: async (chatId, requestId, approved) => {
    try {
      await agentApi.approvePermission(chatId, requestId, approved);
      set({ pendingPermission: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  detectAgents: async () => {
    try {
      const agents = await agentApi.detect();
      set({ detectedAgents: agents });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  subscribeToEvents: async (chatId) => {
    // 先取消旧监听
    get().unsubscribe();

    const chatStore = useChatStore.getState();

    const unlisten = await listenAllAgentEvents(chatId, {
      onMessageStart: (msgId) => {
        chatStore.clearStream();
        set({ status: 'running' });
      },
      onMessageDelta: (msgId, content) => {
        chatStore.appendStreamContent(msgId, content);
      },
      onMessageComplete: (msgId) => {
        chatStore.completeStream(msgId);
      },
      onToolCall: (tool, input) => {
        // 工具调用作为消息添加到列表
        chatStore.addLocalMessage({
          id: crypto.randomUUID(),
          chat_id: chatId,
          msg_id: '',
          type: 'tool_call',
          role: 'assistant',
          content: JSON.stringify({ tool, input }),
          position: chatStore.messages.length,
          status: 'complete',
          extra: { tool, input },
          created_at: Date.now() / 1000,
        });
      },
      onPermissionRequest: (id, description) => {
        set({ pendingPermission: { id, description } });
      },
      onStatusChange: (status) => {
        set({ status });
      },
      onError: (message) => {
        set({ status: 'error', error: message });
      },
    });

    set({ _unlisten: unlisten });
  },

  unsubscribe: () => {
    const { _unlisten } = get();
    _unlisten?.();
    set({ _unlisten: null });
  },

  clearError: () => set({ error: null }),
}));
