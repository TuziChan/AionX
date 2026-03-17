import { Select, Switch } from '@arco-design/web-react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
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
      <div className="settings-tools-page__section-header">
        <div>
          <div className="settings-group-card__title">图像生成</div>
          <div className="settings-tools-page__pane-subtitle">图像模型配置保持独立 card，不和 MCP server 列表交叉混排。</div>
        </div>
      </div>

      <div className="settings-group-card__body">
        <PreferenceRow label="启用图像生成">
          <Switch checked={settings.enabled} onChange={(value) => void onToggleEnabled(value)} disabled={!selectedValue} />
        </PreferenceRow>
        <PreferenceRow label="图像模型">
          <Select
            value={selectedValue}
            options={options}
            onChange={(value) => void onChangeSelection(typeof value === 'string' ? value : String(value))}
            allowClear
            placeholder={options.length ? '选择一个图像模型' : '暂无可用模型'}
          />
        </PreferenceRow>
      </div>

      <div className="settings-tools-page__image-footnote">
        {selectedValue ? `当前选择：${options.find((option) => option.value === selectedValue)?.label ?? selectedValue}` : '尚未选择图像模型'}
      </div>
    </section>
  );
}
