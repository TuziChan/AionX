import type { AgentAdapter } from './types';

export const geminiAdapter: AgentAdapter = {
  type: 'gemini',
  label: 'Gemini',
  supportedMessageTypes: ['text', 'status', 'tips', 'tool_call'],
  supportsFileAttachment: true,
  supportsToolCalls: true,
  supportsPermissions: false,
  preprocessMessage: (content) => content.trim(),
  getDefaultConfig: () => ({
    agent_type: 'gemini',
    command: 'gemini-2.5-flash',
  }),
};
