import { acpAdapter } from './acp';
import { codexAdapter } from './codex';
import { geminiAdapter } from './gemini';
import { nanobotAdapter } from './nanobot';
import { openclawAdapter } from './openclaw';
import type { AgentAdapter } from './types';

const adapters: Record<string, AgentAdapter> = {
  acp: acpAdapter,
  codex: codexAdapter,
  gemini: geminiAdapter,
  nanobot: nanobotAdapter,
  openclaw: openclawAdapter,
};

export function getAgentAdapter(agentType: string): AgentAdapter {
  return adapters[agentType] ?? acpAdapter;
}

export function getAgentAdapters(): AgentAdapter[] {
  return Object.values(adapters);
}
