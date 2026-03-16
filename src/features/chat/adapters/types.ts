import type { AgentConfig } from '@/services/agent';

export type ChatMessageType =
  | 'text'
  | 'status'
  | 'tips'
  | 'tool_call'
  | 'permission'
  | 'plan'
  | 'file_changes';

/// Agent 适配器接口 — 每种 Agent 类型声明能力边界与默认行为
export interface AgentAdapter {
  type: string;
  label: string;

  supportedMessageTypes: ChatMessageType[];
  supportsFileAttachment: boolean;
  supportsToolCalls: boolean;
  supportsPermissions: boolean;

  preprocessMessage?: (content: string) => string;

  getDefaultConfig: (workingDir?: string) => AgentConfig;
}
