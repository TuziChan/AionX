import type { DetectedAgent } from '@/bindings';

export type AssistantSource = 'builtin' | 'custom';

export interface BuiltinAssistant {
  id: string;
  name: string;
  description: string;
  avatar: string;
  mainAgent: string;
  enabled: boolean;
  prompt: string;
}

export interface BuiltinAssistantPreferences {
  mainAgent: string;
  enabled: boolean;
}

export interface AssistantPluginConfig {
  description?: string;
  avatar?: string;
  mainAgent?: string;
  prompt?: string;
}

export interface AssistantEntry {
  id: string;
  source: AssistantSource;
  name: string;
  description: string;
  avatar: string;
  mainAgent: string;
  enabled: boolean;
  prompt: string;
  status: string;
  pluginId?: string;
}

export interface AssistantEditorValues {
  id: string;
  source: AssistantSource;
  name: string;
  description: string;
  avatar: string;
  mainAgent: string;
  enabled: boolean;
  prompt: string;
}

export interface AgentOption {
  label: string;
  value: string;
  available: boolean;
}

export function createAgentOptions(detectedAgents: DetectedAgent[]): AgentOption[] {
  const seen = new Set<string>();
  const options = detectedAgents
    .filter((agent) => {
      if (seen.has(agent.agent_type)) {
        return false;
      }
      seen.add(agent.agent_type);
      return true;
    })
    .map((agent) => ({
      label: `${agent.name}${agent.version ? ` (${agent.version})` : ''}${agent.available ? '' : ' - 未检测到'}`,
      value: agent.agent_type,
      available: agent.available,
    }));

  if (!options.some((option) => option.value === 'gemini')) {
    options.unshift({
      label: 'Gemini',
      value: 'gemini',
      available: true,
    });
  }

  return options;
}

export function getDefaultAssistantValues(defaultAgent = 'gemini'): AssistantEditorValues {
  return {
    id: '',
    source: 'custom',
    name: '',
    description: '',
    avatar: '🤖',
    mainAgent: defaultAgent,
    enabled: true,
    prompt: '',
  };
}
