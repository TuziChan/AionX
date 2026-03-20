import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Textarea } from '@/shared/ui';

interface CustomCssCardProps {
  customCss: string;
  saving: boolean;
  onChange: (customCss: string) => void;
  onSave: () => void;
}

export function CustomCssCard({ customCss, saving, onChange, onSave }: CustomCssCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="settings-group-card settings-display-page__css-card" data-testid="display-custom-css-card">
      <Accordion
        type="single"
        collapsible
        value={expanded ? 'custom-css' : undefined}
        onValueChange={(value) => setExpanded(value === 'custom-css')}
      >
        <AccordionItem value="custom-css" className="border-none">
          <AccordionTrigger className="settings-display-page__collapse-trigger py-0 font-normal hover:no-underline">
            <span className="settings-display-page__collapse-title">CSS 主题设置</span>
          </AccordionTrigger>
          <AccordionContent className="settings-display-page__collapse-body pb-0">
            <div className="settings-display-page__css-copy">
              输入界面样式覆盖规则，预览会立即生效，保存后会在下次启动继续保留。
            </div>
            <div className="settings-display-page__css-editor">
              <div className="settings-display-page__css-editor-label">自定义 CSS</div>
              <Textarea
                id="display-custom-css"
                className="min-h-48"
                value={customCss}
                placeholder="例如：:root { --brand-color: #2563eb; }"
                onChange={(event) => onChange(event.target.value)}
              />
              <div className="settings-display-page__css-actions">
                <Button data-testid="display-save-custom-css" disabled={saving} onClick={onSave}>
                  {saving ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                  保存 CSS
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
