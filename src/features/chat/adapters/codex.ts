import type { AgentAdapter } from './types';

export const codexAdapter: AgentAdapter = {
  type: 'codex',
  label: 'Codex',
  supportedMessageTypes: ['text', 'status', 'tips', 'tool_call', 'permission', 'plan', 'file_changes'],
  supportsFileAttachment: true,
  supportsToolCalls: true,
  supportsPermissions: true,
  getDefaultConfig: (workingDir) => ({
    agent_type: 'codex',
    command: 'codex',
    args: [],
    working_dir: workingDir,
  }),
};
