import type { AgentConfig } from '@/services/agent';

/// Agent 适配器接口 — 每种 Agent 类型提供不同的默认配置
export interface AgentAdapter {
  type: string;
  label: string;
  getDefaultConfig: (workingDir?: string) => AgentConfig;
}
