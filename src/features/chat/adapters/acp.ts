import type { AgentAdapter } from './types';

export const acpAdapter: AgentAdapter = {
  type: 'acp',
  label: 'Claude Code',
  supportedMessageTypes: ['text', 'status', 'tips', 'tool_call', 'permission', 'plan', 'file_changes'],
  supportsFileAttachment: true,
  supportsToolCalls: true,
  supportsPermissions: true,
  getDefaultConfig: (workingDir) => ({
    agent_type: 'acp',
    command: 'claude',
    args: [],
    working_dir: workingDir,
  }),
};
