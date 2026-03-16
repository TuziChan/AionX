import type { AgentAdapter } from './types';

export const openclawAdapter: AgentAdapter = {
  type: 'openclaw',
  label: 'OpenClaw',
  supportedMessageTypes: ['text', 'status', 'tips', 'tool_call', 'permission'],
  supportsFileAttachment: true,
  supportsToolCalls: true,
  supportsPermissions: true,
  getDefaultConfig: () => ({
    agent_type: 'openclaw',
    command: 'openclaw',
    env: { OPENCLAW_GATEWAY_PORT: '18789' },
  }),
};
