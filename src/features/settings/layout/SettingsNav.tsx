import classNames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSettingsRegistry } from '../registry/settingsRegistry';

export function SettingsNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items = getSettingsRegistry();

  return (
    <nav className="settings-nav" aria-label="Settings navigation">
      <div className="settings-nav__list">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <button
              key={item.id}
              type="button"
              className={classNames('settings-nav__item', active && 'settings-nav__item--active')}
              onClick={() => navigate(item.path)}
            >
              <span className="settings-nav__icon" aria-hidden="true">
                <Icon theme="outline" size="18" />
              </span>
              <span className="settings-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
