import type { ReactNode } from 'react';
import {
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from '@/shared/ui';

export interface SettingsOption {
  label: string;
  value: string;
}

export interface SettingsFieldDefinition {
  key: string;
  label: string;
  type: 'input' | 'select' | 'switch' | 'slider' | 'custom';
  value?: string | number | boolean;
  options?: SettingsOption[];
  render?: () => ReactNode;
}

export function SettingsField({ field }: { field: SettingsFieldDefinition }) {
  const sliderValue = Number(field.value ?? 0);

  return (
    <div className="settings-field">
      <div className="settings-field__meta">
        <div className="settings-field__label">{field.label}</div>
      </div>
      <div className="settings-field__control">
        {field.type === 'input' ? <Input value={String(field.value ?? '')} readOnly /> : null}
        {field.type === 'select' ? (
          <Select disabled value={String(field.value ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
        {field.type === 'switch' ? <Switch checked={Boolean(field.value)} disabled aria-label={field.label} /> : null}
        {field.type === 'slider' ? <Slider value={[sliderValue]} max={100} step={1} disabled aria-label={field.label} /> : null}
        {field.type === 'custom' ? field.render?.() ?? null : null}
      </div>
    </div>
  );
}
