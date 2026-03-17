import type { SettingsRegistryItem } from '../registry/settingsRegistry';

interface SettingsHeaderProps {
  currentItem: SettingsRegistryItem;
}

export function SettingsHeader({ currentItem }: SettingsHeaderProps) {
  return (
    <header className="settings-layout__header">
      <p className="settings-layout__eyebrow">Settings workspace</p>
      <h1 className="settings-layout__title">{currentItem.title}</h1>
      <p className="settings-layout__description">{currentItem.description}</p>
    </header>
  );
}
