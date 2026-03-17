import classNames from 'classnames';
import { Outlet, useLocation } from 'react-router-dom';
import { useLayoutContext } from '@/contexts/LayoutContext';
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
  const currentItem = getSettingsRegistryItemByPath(pathname) ?? FALLBACK_ITEM;

  return (
    <div className="settings-layout">
      <div className="settings-layout__surface">
        {!isMobile ? (
          <aside className="settings-layout__sidebar">
            <div className="settings-layout__sidebar-back">
              <SettingsBackLink />
            </div>
            <SettingsNav />
          </aside>
        ) : null}

        <main className="settings-layout__main">
          {isMobile ? <SettingsTopbar currentItem={currentItem} /> : null}
          {isMobile ? <SettingsMobileTabs /> : null}
          <div className="settings-layout__body">
            <SettingsHeader currentItem={currentItem} />
            <div className={classNames('settings-layout__content', `settings-page--${currentItem.widthPreset}`)}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

Component.displayName = 'SettingsLayout';
