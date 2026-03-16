import classNames from 'classnames';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { settingsTabs } from './settingsConfig';

export function Component() {
  const { isMobile } = useLayoutContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="settings-layout size-full overflow-hidden bg-base">
      <div className="settings-layout__inner">
        <aside className="settings-layout__sider">
          <div className="settings-layout__sider-title">Settings</div>
          <div className="settings-layout__sider-list">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={classNames('settings-layout__sider-item', pathname === tab.path && 'settings-layout__sider-item--active')}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="settings-layout__content">
          {isMobile && (
            <div className="settings-mobile-top-nav">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={classNames('settings-mobile-top-nav__item', pathname === tab.path && 'settings-mobile-top-nav__item--active')}
                  onClick={() => navigate(tab.path)}
                >
                  <span className="settings-mobile-top-nav__label">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

Component.displayName = 'SettingsLayout';
