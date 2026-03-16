import type { AgentAdapter } from './types';

export const codexAdapter: AgentAdapter = {
  type: 'codex',
  label: 'Codex',
  getDefaultConfig: (workingDir) => ({
    agent_type: 'codex',
    command: 'codex',
    args: [],
    working_dir: workingDir,
  }),
};
