import { Input, Select, Slider, Switch } from '@arco-design/web-react';
import type { ReactNode } from 'react';

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
  return (
    <div className="settings-field">
      <div className="settings-field__meta">
        <div className="settings-field__label">{field.label}</div>
      </div>
      <div className="settings-field__control">
        {field.type === 'input' ? <Input value={String(field.value ?? '')} readOnly /> : null}
        {field.type === 'select' ? (
          <Select
            disabled
            value={String(field.value ?? '')}
            options={(field.options ?? []).map((option) => ({
              label: option.label,
              value: option.value,
            }))}
          />
        ) : null}
        {field.type === 'switch' ? <Switch checked={Boolean(field.value)} disabled /> : null}
        {field.type === 'slider' ? <Slider value={Number(field.value ?? 0)} disabled /> : null}
        {field.type === 'custom' ? field.render?.() ?? null : null}
      </div>
    </div>
  );
}
