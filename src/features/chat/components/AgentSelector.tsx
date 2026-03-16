import { useEffect, useState } from 'react';
import { Select, Tag } from '@arco-design/web-react';
import { useAgentStore } from '../stores/agentStore';
import type { DetectedAgent } from '@/services/agent';

const AGENT_LABELS: Record<string, { label: string; color: string }> = {
  acp: { label: 'Claude Code', color: 'purple' },
  gemini: { label: 'Gemini', color: 'blue' },
  codex: { label: 'Codex', color: 'green' },
  nanobot: { label: 'Nanobot', color: 'orange' },
  openclaw: { label: 'OpenClaw', color: 'red' },
};

interface Props {
  value: string;
  onChange: (agentType: string) => void;
  disabled?: boolean;
}

export function AgentSelector({ value, onChange, disabled }: Props) {
  const detectAgents = useAgentStore((s) => s.detectAgents);
  const detectedAgents = useAgentStore((s) => s.detectedAgents);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      detectAgents().then(() => setLoaded(true));
    }
  }, [loaded, detectAgents]);

  // 去重：同一 agent_type 只保留第一个可用的
  const uniqueAgents = detectedAgents.reduce<DetectedAgent[]>((acc, agent) => {
    if (!acc.some((a) => a.agent_type === agent.agent_type)) {
      acc.push(agent);
    }
    return acc;
  }, []);

  return (
    <Select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{ width: 180 }}
      placeholder="Select Agent"
      renderFormat={(_option, val) => {
        const info = AGENT_LABELS[val as string];
        return info ? (
          <Tag color={info.color} size="small">{info.label}</Tag>
        ) : (
          <span>{String(val)}</span>
        );
      }}
    >
      {uniqueAgents.map((agent) => {
        const info = AGENT_LABELS[agent.agent_type] ?? {
          label: agent.name,
          color: 'gray',
        };
        return (
          <Select.Option
            key={agent.agent_type}
            value={agent.agent_type}
            disabled={!agent.available}
          >
            <div className="flex items-center justify-between w-full">
              <span>{info.label}</span>
              {agent.available ? (
                <Tag color={info.color} size="small">Available</Tag>
              ) : (
                <Tag color="gray" size="small">Not Found</Tag>
              )}
            </div>
          </Select.Option>
        );
      })}
    </Select>
  );
}
