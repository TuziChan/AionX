import { getToolRenderer, type ToolDisplayProps } from './registry';
import { GenericDisplay } from './displays/GenericDisplay';

export function ToolCallRenderer({ tool, input, output }: ToolDisplayProps) {
  const Renderer = getToolRenderer(tool);

  if (Renderer) {
    return <Renderer tool={tool} input={input} output={output} />;
  }

  return <GenericDisplay tool={tool} input={input} output={output} />;
}
