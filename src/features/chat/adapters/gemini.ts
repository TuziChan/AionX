import type { AgentAdapter } from './types';

export const geminiAdapter: AgentAdapter = {
  type: 'gemini',
  label: 'Gemini',
  getDefaultConfig: () => ({
    agent_type: 'gemini',
    command: 'gemini-2.5-flash',
  }),
};
