import { Button, Input } from '@arco-design/web-react';
import { useState } from 'react';

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
      <button
        type="button"
        className="settings-display-page__collapse-trigger"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="settings-display-page__collapse-title">CSS 主题设置</span>
        <span
          aria-hidden="true"
          className={`settings-display-page__collapse-chevron ${expanded ? 'settings-display-page__collapse-chevron--expanded' : ''}`}
        />
      </button>
      {expanded ? (
        <div className="settings-display-page__collapse-body">
          <div className="settings-display-page__css-copy">
            输入界面样式覆盖规则，预览会立即生效，保存后会在下次启动继续保留。
          </div>
          <div className="settings-display-page__css-editor">
            <div className="settings-display-page__css-editor-label">自定义 CSS</div>
            <Input.TextArea
              id="display-custom-css"
              autoSize={{ minRows: 8, maxRows: 16 }}
              value={customCss}
              placeholder="例如：:root { --brand-color: #2563eb; }"
              onChange={onChange}
            />
            <div className="settings-display-page__css-actions">
              <Button data-testid="display-save-custom-css" type="primary" loading={saving} onClick={onSave}>
                保存 CSS
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
