import { SettingTwo, ArrowCircleLeft } from '@icon-park/react';
import { IconMoonFill, IconSunFill } from '@arco-design/web-react/icon';
import { Tooltip } from '@arco-design/web-react';
import classNames from 'classnames';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme';
import { useLayoutContext } from '../../contexts/LayoutContext';

interface SidebarProps {
  onSessionClick?: () => void;
  collapsed?: boolean;
}

export function Sidebar({ onSessionClick, collapsed = false }: SidebarProps) {
  const layout = useLayoutContext();
  const isMobile = layout?.isMobile ?? false;
  const location = useLocation();
  const { pathname, search, hash } = location;
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeStore();

  const isSettings = pathname.startsWith('/settings');
  const lastNonSettingsPathRef = useRef('/');

  useEffect(() => {
    if (!pathname.startsWith('/settings')) {
      lastNonSettingsPathRef.current = `${pathname}${search}${hash}`;
    }
  }, [pathname, search, hash]);

  const handleSettingsClick = () => {
    if (isSettings) {
      const target = lastNonSettingsPathRef.current || '/';
      navigate(target);
    } else {
      navigate('/settings');
    }
    if (onSessionClick) {
      onSessionClick();
    }
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const tooltipEnabled = collapsed && !isMobile;
  const iconColors = {
    primary: 'rgb(var(--primary-6))',
  };

  return (
    <div className="size-full flex flex-col">
      {/* Main content area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isSettings ? (
          <div className="h-full flex flex-col">
            {/* Settings Sider - 后续实现 */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 text-t-secondary">Settings Content</div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Workspace History - 后续实现 */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 text-t-secondary">Workspace History</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - settings button */}
      <div className="shrink-0 mt-auto pt-2">
        <div className="flex flex-col gap-2">
          {isSettings && (
            <Tooltip
              disabled={!tooltipEnabled}
              content={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              position="right"
            >
              <div
                onClick={handleToggleTheme}
                className={classNames(
                  'flex items-center justify-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-hover active:bg-active',
                  isMobile && 'py-3'
                )}
              >
                {mode === 'dark' ? (
                  <IconSunFill style={{ fontSize: 18, color: iconColors.primary }} />
                ) : (
                  <IconMoonFill style={{ fontSize: 18, color: iconColors.primary }} />
                )}
                <span className={classNames('text-t-primary', collapsed && 'hidden')}>
                  Theme · {mode === 'dark' ? 'Dark' : 'Light'}
                </span>
              </div>
            </Tooltip>
          )}

          <Tooltip
            disabled={!tooltipEnabled}
            content={isSettings ? 'Back' : 'Settings'}
            position="right"
          >
            <div
              onClick={handleSettingsClick}
              className={classNames(
                'flex items-center justify-start gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                isMobile && 'py-3',
                {
                  'bg-[rgba(var(--primary-6),0.12)] text-primary': isSettings,
                  'hover:bg-hover hover:shadow-sm active:bg-active': !isSettings,
                }
              )}
            >
              {isSettings ? (
                <ArrowCircleLeft className="flex" theme="outline" size="24" fill={iconColors.primary} />
              ) : (
                <SettingTwo className="flex" theme="outline" size="24" fill={iconColors.primary} />
              )}
              <span className={classNames('text-t-primary', collapsed && 'hidden')}>
                {isSettings ? 'Back' : 'Settings'}
              </span>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
