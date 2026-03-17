import { Input, Select, Switch } from '@arco-design/web-react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import { LANGUAGE_OPTIONS } from '../types';

interface SystemBehaviorCardProps {
  closeToTray: boolean;
  currentLanguage: string;
  savingCloseToTray: boolean;
  savingLanguage: boolean;
  systemInfoLabel: string;
  onCloseToTrayChange: (checked: boolean) => void;
  onLanguageChange: (language: string) => void;
}

export function SystemBehaviorCard({
  closeToTray,
  currentLanguage,
  savingCloseToTray,
  savingLanguage,
  systemInfoLabel,
  onCloseToTrayChange,
  onLanguageChange,
}: SystemBehaviorCardProps) {
  return (
    <section className="settings-group-card" data-testid="system-behavior-card">
      <div className="settings-group-card__body">
        <PreferenceRow label="语言">
          <div data-testid="system-language-select">
            <Select
              disabled={savingLanguage}
              options={LANGUAGE_OPTIONS}
              value={currentLanguage}
              onChange={(value) => onLanguageChange(String(value))}
            />
          </div>
        </PreferenceRow>
        <PreferenceRow label="关闭窗口时最小化到托盘">
          <div data-testid="system-close-to-tray">
            <Switch checked={closeToTray} disabled={savingCloseToTray} onChange={onCloseToTrayChange} />
          </div>
        </PreferenceRow>
        <PreferenceRow label="运行环境">
          <Input id="system-info-label" readOnly value={systemInfoLabel} />
        </PreferenceRow>
      </div>
    </section>
  );
}
