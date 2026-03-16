import { Tooltip } from '@arco-design/web-react';
import { HamburgerButton, MenuFold, SettingTwo } from '@icon-park/react';
import classNames from 'classnames';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayoutContext } from '../../contexts/LayoutContext';

interface TitlebarProps {
  onDebugClick?: () => void;
  onToggleSidebar?: () => void;
}

const AppMark = ({ compact = false }: { compact?: boolean }) => (
  <div className={classNames('app-mark', compact && 'app-mark--compact')} aria-hidden="true">
    <svg viewBox="0 0 80 80" fill="none">
      <path d="M40 20Q38 22 25 40Q23 42 26 42H30Q32 40 40 30Q48 40 50 42H54Q57 42 55 40Q42 22 40 20Z" fill="currentColor" />
      <circle cx="40" cy="46" r="3" fill="currentColor" />
      <path d="M18 50Q40 70 62 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
);

export function Titlebar({ onDebugClick, onToggleSidebar }: TitlebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useLayoutContext();
  const isSettings = location.pathname.startsWith('/settings');

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/conversation/')) return 'Conversation';
    if (location.pathname.startsWith('/cron')) return 'Cron';
    if (location.pathname.startsWith('/test/components')) return 'Components';
    if (isSettings) return 'Settings';
    return 'Guide';
  }, [isSettings, location.pathname]);

  return (
    <div
      className={classNames('app-titlebar border-b border-b-base bg-1', {
        'app-titlebar--desktop': !isMobile,
        'app-titlebar--mobile': isMobile,
        'app-titlebar--mobile-conversation': isMobile && location.pathname.startsWith('/conversation/'),
      })}
      style={{ WebkitAppRegion: 'drag' } as any}
      data-tauri-drag-region
    >
      <div className="app-titlebar__menu">
        <button
          type="button"
          className={classNames('app-titlebar__button', isMobile && 'app-titlebar__button--mobile')}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          {isMobile ? <HamburgerButton theme="outline" size="22" /> : <MenuFold theme="outline" size="18" />}
        </button>
      </div>

      <div className="app-titlebar__brand" onClick={onDebugClick}>
        <span className="app-titlebar__brand-mobile">
          <AppMark compact={isMobile} />
          <span className="app-titlebar__brand-text">{isMobile ? pageTitle : 'AionX'}</span>
        </span>
      </div>

      <div className="app-titlebar__toolbar" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <Tooltip content={isSettings ? 'Back to Guide' : 'Open Settings'} position="bottom">
          <button
            type="button"
            className={classNames('app-titlebar__button', isMobile && 'app-titlebar__button--mobile')}
            onClick={() => navigate(isSettings ? '/guid' : '/settings/gemini')}
            aria-label={isSettings ? 'Back to Guide' : 'Open Settings'}
          >
            <SettingTwo theme="outline" size={isMobile ? '22' : '18'} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
