import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMobileSettingsRegistry } from '../registry/settingsRegistry';

export function SettingsMobileTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items = getMobileSettingsRegistry();
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
  }, [pathname]);

  return (
    <div className="settings-mobile-tabs" role="tablist" aria-label="Settings sections">
      {items.map((item) => {
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            ref={active ? activeTabRef : null}
            className={classNames('settings-mobile-tabs__item', active && 'settings-mobile-tabs__item--active')}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
