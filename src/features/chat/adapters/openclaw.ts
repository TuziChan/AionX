import type { AgentAdapter } from './types';

export const openclawAdapter: AgentAdapter = {
  type: 'openclaw',
  label: 'OpenClaw',
  getDefaultConfig: () => ({
    agent_type: 'openclaw',
    command: 'openclaw',
    env: { OPENCLAW_GATEWAY_PORT: '18789' },
  }),
};
