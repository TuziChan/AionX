import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// --- Types matching Rust agent types ---

export type AgentStatus = 'idle' | 'starting' | 'running' | 'stopping' | 'error' | 'disconnected';

export interface AgentConfig {
  agent_type: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  working_dir?: string;
}

export interface DetectedAgent {
  agent_type: string;
  name: string;
  command: string;
  version: string | null;
  available: boolean;
}

export interface FileAttachment {
  path: string;
  name: string;
  mime_type?: string;
}

export interface AgentEvent {
  type: string;
  msg_id?: string;
  content?: string;
  tool?: string;
  input?: unknown;
  output?: unknown;
  id?: string;
  description?: string;
  status?: AgentStatus;
  message?: string;
}

export interface AgentEventPayload {
  chat_id: string;
  event: AgentEvent;
}

// --- Agent API ---

export const agentApi = {
  sendMessage: (
    chatId: string,
    agentType: string,
    content: string,
    config: AgentConfig,
    files?: FileAttachment[],
  ) =>
    invoke<void>('send_message', {
      chatId,
      agentType,
      content,
      config,
      files: files ?? null,
    }),

  stop: (chatId: string) => invoke<void>('stop_agent', { chatId }),

  getStatus: (chatId: string) =>
    invoke<AgentStatus>('get_agent_status', { chatId }),

  approvePermission: (chatId: string, requestId: string, approved: boolean) =>
    invoke<void>('approve_permission', { chatId, requestId, approved }),

  detect: () => invoke<DetectedAgent[]>('detect_agents'),
};

// --- Event Listeners ---

export function onAgentEvent(
  eventName: string,
  callback: (payload: AgentEventPayload) => void,
): Promise<UnlistenFn> {
  return listen<AgentEventPayload>(eventName, (e) => callback(e.payload));
}

/** 监听所有 Agent 事件，返回取消监听函数数组 */
export async function listenAllAgentEvents(
  chatId: string,
  handlers: {
    onMessageStart?: (msgId: string) => void;
    onMessageDelta?: (msgId: string, content: string) => void;
    onMessageComplete?: (msgId: string) => void;
    onToolCall?: (tool: string, input: unknown) => void;
    onToolResult?: (tool: string, output: unknown) => void;
    onPermissionRequest?: (id: string, description: string) => void;
    onStatusChange?: (status: AgentStatus) => void;
    onError?: (message: string) => void;
  },
): Promise<() => void> {
  const unlisteners: UnlistenFn[] = [];

  const eventNames = [
    'agent:message-start',
    'agent:message-delta',
    'agent:message-complete',
    'agent:tool-call',
    'agent:tool-result',
    'agent:permission-request',
    'agent:status-change',
    'agent:error',
  ];

  for (const name of eventNames) {
    const unlisten = await listen<AgentEventPayload>(name, (e) => {
      const { chat_id, event } = e.payload;
      if (chat_id !== chatId) return;

      switch (event.type) {
        case 'message_start':
          handlers.onMessageStart?.(event.msg_id ?? '');
          break;
        case 'message_delta':
          handlers.onMessageDelta?.(event.msg_id ?? '', event.content ?? '');
          break;
        case 'message_complete':
          handlers.onMessageComplete?.(event.msg_id ?? '');
          break;
        case 'tool_call_start':
          handlers.onToolCall?.(event.tool ?? '', event.input);
          break;
        case 'tool_call_result':
          handlers.onToolResult?.(event.tool ?? '', event.output);
          break;
        case 'permission_request':
          handlers.onPermissionRequest?.(event.id ?? '', event.description ?? '');
          break;
        case 'status_change':
          handlers.onStatusChange?.(event.status ?? 'idle');
          break;
        case 'error':
          handlers.onError?.(event.message ?? 'Unknown error');
          break;
      }
    });
    unlisteners.push(unlisten);
  }

  return () => unlisteners.forEach((fn) => fn());
}
