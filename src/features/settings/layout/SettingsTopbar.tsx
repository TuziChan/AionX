import type { SettingsRegistryItem } from '../registry/settingsRegistry';
import { SettingsBackLink } from './SettingsBackLink';

interface SettingsTopbarProps {
  currentItem: SettingsRegistryItem;
}

export function SettingsTopbar({ currentItem }: SettingsTopbarProps) {
  return (
    <div className="settings-layout__topbar">
      <SettingsBackLink />
      <div className="settings-layout__topbar-meta">
        <div className="settings-layout__topbar-title">{currentItem.label}</div>
        <div className="settings-layout__topbar-subtitle">{currentItem.title}</div>
      </div>
    </div>
  );
}
