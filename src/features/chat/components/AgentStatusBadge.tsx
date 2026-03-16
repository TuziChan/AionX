import { useAgentStore } from '../stores/agentStore';
import type { AgentStatus } from '@/services/agent';

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  idle: { label: 'Idle', color: 'text-t-tertiary', dot: 'bg-[var(--color-bg-5)]' },
  starting: { label: 'Starting', color: 'text-warning', dot: 'bg-warning animate-pulse' },
  running: { label: 'Running', color: 'text-success', dot: 'bg-success animate-pulse' },
  stopping: { label: 'Stopping', color: 'text-warning', dot: 'bg-warning' },
  error: { label: 'Error', color: 'text-danger', dot: 'bg-danger' },
  disconnected: { label: 'Disconnected', color: 'text-t-disabled', dot: 'bg-[var(--color-bg-4)]' },
};

export function AgentStatusBadge() {
  const status = useAgentStore((s) => s.status);
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.idle;

  // idle 状态不显示
  if (status === 'idle') return null;

  return (
    <div className={`flex items-center gap-1.5 ${config.color}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className="text-xs">{config.label}</span>
    </div>
  );
}
