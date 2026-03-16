import type { AgentAdapter } from './types';

export const nanobotAdapter: AgentAdapter = {
  type: 'nanobot',
  label: 'Nanobot',
  getDefaultConfig: (workingDir) => ({
    agent_type: 'nanobot',
    command: 'nanobot',
    args: [],
    working_dir: workingDir,
  }),
};
