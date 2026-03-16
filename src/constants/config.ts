export const APP_NAME = 'AionX';
export const APP_VERSION = '0.1.0';

export const AGENT_TYPES = ['acp', 'gemini', 'codex', 'nanobot', 'openclaw'] as const;
export type AgentTypeId = (typeof AGENT_TYPES)[number];

export const AGENT_LABELS: Record<AgentTypeId, string> = {
  acp: 'Claude Code',
  gemini: 'Gemini',
  codex: 'Codex',
  nanobot: 'Nanobot',
  openclaw: 'OpenClaw',
};

export const DEFAULT_AGENT_TYPE: AgentTypeId = 'acp';

export const GATEWAY_DEFAULTS = {
  OPENCLAW_PORT: 18789,
  WEBUI_PORT: 9527,
};
