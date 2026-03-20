import { useEffect, useState } from 'react';
import { useAgentStore } from '../stores/agentStore';
import type { DetectedAgent } from '@/services/agent';
import { cn } from '@/shared/lib';
import {
  Badge,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';

const AGENT_LABELS: Record<string, { label: string; className: string }> = {
  acp: { label: 'Claude Code', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  gemini: { label: 'Gemini', className: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  codex: { label: 'Codex', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  nanobot: { label: 'Nanobot', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  openclaw: { label: 'OpenClaw', className: 'border-rose-200 bg-rose-50 text-rose-700' },
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
  const selectedAgent = AGENT_LABELS[value];

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {uniqueAgents.map((agent) => {
              const info = AGENT_LABELS[agent.agent_type] ?? {
                label: agent.name,
                className: 'border-muted bg-muted text-muted-foreground',
              };

              return (
                <SelectItem key={agent.agent_type} value={agent.agent_type}>
                  <div className="flex w-full items-center justify-between gap-3">
                    <span>{info.label}</span>
                    <Badge
                      variant={agent.available ? 'outline' : 'outline'}
                      className={cn('shrink-0', agent.available ? info.className : 'border-muted bg-muted text-muted-foreground')}
                    >
                      {agent.available ? 'Available' : 'Not Found'}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedAgent ? (
        <Badge variant="outline" className={cn('whitespace-nowrap', selectedAgent.className)}>
          {selectedAgent.label}
        </Badge>
      ) : null}
    </div>
  );
}
