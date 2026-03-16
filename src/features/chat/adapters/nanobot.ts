import type { AgentAdapter } from './types';

export const nanobotAdapter: AgentAdapter = {
  type: 'nanobot',
  label: 'Nanobot',
  supportedMessageTypes: ['text', 'status', 'tips', 'tool_call', 'plan'],
  supportsFileAttachment: false,
  supportsToolCalls: true,
  supportsPermissions: false,
  getDefaultConfig: (workingDir) => ({
    agent_type: 'nanobot',
    command: 'nanobot',
    args: [],
    working_dir: workingDir,
  }),
};
