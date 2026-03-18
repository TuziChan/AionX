import type { SettingsRegistryItem } from '../registry/settingsRegistry';

interface SettingsHeaderProps {
  currentItem: SettingsRegistryItem;
}

export function SettingsHeader({ currentItem }: SettingsHeaderProps) {
  return (
    <header className="settings-layout__header">
      <p className="settings-layout__eyebrow">{currentItem.title}</p>
      <h1 className="settings-layout__title">{currentItem.label}</h1>
      <p className="settings-layout__description">{currentItem.description}</p>
    </header>
  );
}
