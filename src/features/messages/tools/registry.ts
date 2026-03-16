import type { ComponentType } from 'react';

export interface ToolDisplayProps {
  tool: string;
  input: unknown;
  output?: unknown;
}

type ToolRenderer = ComponentType<ToolDisplayProps>;

const toolRenderers = new Map<string, ToolRenderer>();

export function registerToolRenderer(toolName: string, renderer: ToolRenderer) {
  toolRenderers.set(toolName, renderer);
}

export function getToolRenderer(toolName: string): ToolRenderer | undefined {
  return toolRenderers.get(toolName);
}

export function getAllRegisteredTools(): string[] {
  return Array.from(toolRenderers.keys());
}
