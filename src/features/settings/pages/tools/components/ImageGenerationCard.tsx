import { Select, Switch } from '@arco-design/web-react';
import type { ImageGenerationDraft, ImageGenerationOption } from '../types';

interface ImageGenerationCardProps {
  options: ImageGenerationOption[];
  settings: ImageGenerationDraft;
  onChangeSelection: (value: string | null) => Promise<void>;
  onToggleEnabled: (enabled: boolean) => Promise<void>;
}

export function ImageGenerationCard({
  options,
  settings,
  onChangeSelection,
  onToggleEnabled,
}: ImageGenerationCardProps) {
  const selectedValue =
    settings.providerId && settings.modelName ? `${settings.providerId}|${settings.modelName}` : undefined;

  return (
    <section className="settings-group-card settings-tools-page__image-card" data-testid="tools-image-card">
      <div className="settings-tools-page__image-header">
        <div>
          <div className="settings-group-card__title">图像生成</div>
          <div className="settings-tools-page__pane-subtitle">保持与 MCP 管理分离的独立卡片，节奏对齐 AionUi 的标题行开关布局。</div>
        </div>
        <Switch checked={settings.enabled} onChange={(value) => void onToggleEnabled(value)} disabled={!selectedValue} />
      </div>

      <div className="settings-tools-page__image-divider" />

      <div className="settings-tools-page__image-form">
        <div className="settings-tools-page__image-form-label">图像模型</div>
        <div className="settings-tools-page__image-form-control">
          <Select
            value={selectedValue}
            options={options}
            onChange={(value) => void onChangeSelection(typeof value === 'string' ? value : String(value))}
            allowClear
            placeholder={options.length ? '选择一个图像模型' : '暂无可用模型'}
          />
        </div>
      </div>

      <div className="settings-tools-page__image-footnote">
        {selectedValue ? `当前选择：${options.find((option) => option.value === selectedValue)?.label ?? selectedValue}` : '尚未选择图像模型'}
      </div>
    </section>
  );
}
