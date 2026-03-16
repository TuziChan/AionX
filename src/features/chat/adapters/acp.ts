import type { AgentAdapter } from './types';

export const acpAdapter: AgentAdapter = {
  type: 'acp',
  label: 'Claude Code',
  getDefaultConfig: (workingDir) => ({
    agent_type: 'acp',
    command: 'claude',
    args: [],
    working_dir: workingDir,
  }),
};
