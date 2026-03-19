import classNames from 'classnames';
import { Outlet, useLocation } from 'react-router-dom';
import { SettingsFrame } from '@/app/layouts';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useSettingsRegistryItems } from '../hooks/useSettingsRegistryItems';
import { getSettingsRegistryItemByPath } from '../registry/settingsRegistry';
import { SettingsBackLink } from './SettingsBackLink';
import { SettingsHeader } from './SettingsHeader';
import { SettingsMobileTabs } from './SettingsMobileTabs';
import { SettingsNav } from './SettingsNav';
import { SettingsTopbar } from './SettingsTopbar';

const FALLBACK_ITEM = {
  id: 'settings',
  path: '/settings',
  label: 'Settings',
  title: '设置工作区',
  description: '统一管理 AionX 的连接、显示、工具和系统配置。',
  icon: () => null,
  widthPreset: 'regular',
  layoutMode: 'form-stack',
  order: 0,
  mobileVisible: true,
} as const;

export function Component() {
  const { isMobile } = useLayoutContext();
  const { pathname } = useLocation();
  const { currentItem, items, mobileItems } = useSettingsRegistryItems(pathname);
  const resolvedItem = currentItem ?? getSettingsRegistryItemByPath(pathname, items) ?? FALLBACK_ITEM;

  return (
    <SettingsFrame
      sidebar={
        !isMobile ? (
          <>
            <div className="settings-layout__sidebar-back">
              <SettingsBackLink />
            </div>
            <SettingsNav items={items} />
          </>
        ) : null
      }
      mobileTopbar={isMobile ? <SettingsTopbar currentItem={resolvedItem} /> : null}
      mobileTabs={isMobile ? <SettingsMobileTabs items={mobileItems} /> : null}
      header={!isMobile ? <SettingsHeader currentItem={resolvedItem} /> : null}
      contentClassName={classNames(`settings-page--${resolvedItem.widthPreset}`)}
    >
      <Outlet />
    </SettingsFrame>
  );
}

Component.displayName = 'SettingsLayout';
