import { useEffect, useMemo, useState } from 'react';
import { listExtensionSettingsTabs } from '../api/extension';
import { buildExtensionSettingsRegistryItems } from '../registry/extensionRegistry';
import { getSettingsRegistry, getSettingsRegistryItemByPath, getMobileSettingsRegistry, mergeSettingsRegistry, type SettingsRegistryItem } from '../registry/settingsRegistry';

export function useSettingsRegistryItems(pathname?: string) {
  const [extensionItems, setExtensionItems] = useState<SettingsRegistryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadExtensionItems = async () => {
      try {
        const tabs = await listExtensionSettingsTabs();
        if (!cancelled) {
          setExtensionItems(buildExtensionSettingsRegistryItems(tabs));
        }
      } catch (error) {
        if (!cancelled) {
          setExtensionItems([]);
        }

        console.warn('Failed to load extension settings registry items', error);
      }
    };

    void loadExtensionItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => mergeSettingsRegistry(extensionItems), [extensionItems]);
  const mobileItems = useMemo(() => getMobileSettingsRegistry(items), [items]);
  const currentItem = useMemo(
    () => (pathname ? getSettingsRegistryItemByPath(pathname, items) : null),
    [items, pathname],
  );

  return {
    currentItem,
    extensionItems,
    items: items.length > 0 ? items : getSettingsRegistry(),
    mobileItems,
  };
}
