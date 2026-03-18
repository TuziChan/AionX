import { useEffect, useMemo, useState } from 'react';
import { getExtensionSettingsTab, listExtensionSettingsTabs } from '../api/extension';
import { buildExtensionSettingsRegistryItems } from '../registry/extensionRegistry';
import { getSettingsRegistry, getSettingsRegistryItemByPath, getMobileSettingsRegistry, mergeSettingsRegistry, type SettingsRegistryItem } from '../registry/settingsRegistry';

export function useSettingsRegistryItems(pathname?: string) {
  const [extensionItems, setExtensionItems] = useState<SettingsRegistryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadExtensionItems = async () => {
      const routeExtensionTabId =
        pathname && pathname.startsWith('/settings/ext/')
          ? pathname.replace('/settings/ext/', '').split('/')[0] || ''
          : '';

      try {
        const tabs = await listExtensionSettingsTabs();
        const nextTabs = [...tabs];

        if (routeExtensionTabId && !nextTabs.some((tab) => tab.tabId === routeExtensionTabId)) {
          try {
            const currentTab = await getExtensionSettingsTab(routeExtensionTabId);
            nextTabs.push(currentTab);
          } catch (error) {
            console.warn(`Failed to load extension settings tab ${routeExtensionTabId}`, error);
          }
        }

        const uniqueTabs = Array.from(new Map(nextTabs.map((tab) => [tab.tabId, tab])).values());
        if (!cancelled) {
          setExtensionItems(buildExtensionSettingsRegistryItems(uniqueTabs));
        }
      } catch (error) {
        if (routeExtensionTabId) {
          try {
            const currentTab = await getExtensionSettingsTab(routeExtensionTabId);
            if (!cancelled) {
              setExtensionItems(buildExtensionSettingsRegistryItems([currentTab]));
            }
            return;
          } catch (tabError) {
            console.warn(`Failed to recover extension settings tab ${routeExtensionTabId}`, tabError);
          }
        }

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
  }, [pathname]);

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
