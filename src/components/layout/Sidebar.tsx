import { Tooltip } from '@arco-design/web-react';
import { IconMoonFill, IconSunFill } from '@arco-design/web-react/icon';
import { ArrowCircleLeft, Calendar, Experiment, ListCheckbox, Plus, SettingTwo } from '@icon-park/react';
import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayoutContext } from '../../contexts/LayoutContext';
import { useThemeStore } from '../../stores/themeStore';
import { ChatHistory } from '../../features/chat/components/ChatHistory';

interface SidebarProps {
  onSessionClick?: () => void;
  collapsed?: boolean;
}

const AppMark = () => (
  <div className="app-mark" aria-hidden="true">
    <svg viewBox="0 0 80 80" fill="none">
      <path d="M40 20Q38 22 25 40Q23 42 26 42H30Q32 40 40 30Q48 40 50 42H54Q57 42 55 40Q42 22 40 20Z" fill="currentColor" />
      <circle cx="40" cy="46" r="3" fill="currentColor" />
      <path d="M18 50Q40 70 62 50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
);

export function Sidebar({ onSessionClick, collapsed = false }: SidebarProps) {
  const { isMobile } = useLayoutContext();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeStore();
  const isSettings = pathname.startsWith('/settings');
  const [batchMode, setBatchMode] = useState(false);
  const lastNonSettingsPathRef = useRef('/guid');

  useEffect(() => {
    if (!pathname.startsWith('/settings')) {
      lastNonSettingsPathRef.current = `${pathname}${search}${hash}`;
    }
  }, [pathname, search, hash]);

  const tooltipEnabled = collapsed && !isMobile;

  const quickLinks = useMemo(
    () => [
      { key: 'cron', label: 'Cron', path: '/cron', icon: Calendar },
      { key: 'components', label: 'Components', path: '/test/components', icon: Experiment },
    ],
    []
  );

  const handleSettingsClick = () => {
    if (isSettings) {
      navigate(lastNonSettingsPathRef.current || '/guid');
    } else {
      navigate('/settings/gemini');
    }
    onSessionClick?.();
  };

  return (
    <div className={classNames('size-full flex flex-col', collapsed && 'collapsed')}>
      <div
        className={classNames(
          'layout-sider-header shrink-0 flex items-center justify-start py-10px px-16px pl-20px gap-12px',
          isMobile && 'layout-sider-header--mobile',
          collapsed && 'cursor-pointer'
        )}
      >
        <AppMark />
        <div className="collapsed-hidden text-20px font-bold text-t-primary">AionX</div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-8px pb-8px">
        {isSettings ? (
          <div className="size-full flex flex-col justify-end">
            <div className="px-12px py-8px">
              <div className="text-12px uppercase tracking-[0.24em] text-t-tertiary collapsed-hidden">
                Settings
              </div>
              <div className="mt-8px text-14px text-t-secondary collapsed-hidden leading-22px">
                设置页内部导航由内容区的 `SettingsLayout` 独立负责，主侧栏仅保留应用级返回入口。
              </div>
            </div>
          </div>
        ) : (
          <div className="size-full flex flex-col">
            <div className="mb-8px shrink-0 flex items-center gap-8px">
              <Tooltip disabled={!tooltipEnabled} content="New Conversation" position="right">
                <button
                  type="button"
                  className={classNames(
                    'h-40px flex-1 flex items-center justify-start gap-10px px-12px hover:bg-hover rd-0.5rem cursor-pointer group bg-transparent border-none',
                    isMobile && 'sider-action-btn-mobile'
                  )}
                  onClick={() => {
                    setBatchMode(false);
                    navigate('/guid');
                    onSessionClick?.();
                  }}
                >
                  <Plus theme="outline" size="24" fill="rgb(var(--primary-6))" className="block leading-none shrink-0" />
                  <span className="collapsed-hidden font-bold text-t-primary">New Conversation</span>
                </button>
              </Tooltip>
              <Tooltip disabled={!tooltipEnabled} content={batchMode ? 'Exit batch mode' : 'Batch manage'} position="right">
                <button
                  type="button"
                  className={classNames(
                    'h-40px w-40px rd-0.5rem flex items-center justify-center cursor-pointer shrink-0 transition-all border border-solid border-transparent bg-transparent',
                    isMobile && 'sider-action-icon-btn-mobile',
                    batchMode
                      ? 'bg-[rgba(var(--primary-6),0.12)] border-[rgba(var(--primary-6),0.24)] text-primary'
                      : 'hover:bg-hover hover:border-[var(--border-base)]'
                  )}
                  onClick={() => setBatchMode((prev) => !prev)}
                >
                  <ListCheckbox theme="outline" size="20" className="block leading-none shrink-0" />
                </button>
              </Tooltip>
            </div>

            <div className="mb-8px shrink-0 flex flex-col gap-2px">
              {quickLinks.map((item) => {
                const IconComponent = item.icon;
                const selected = pathname.startsWith(item.path);
                return (
                  <Tooltip
                    key={item.key}
                    disabled={!tooltipEnabled}
                    content={item.label}
                    position="right"
                  >
                    <button
                      type="button"
                      className={classNames(
                        'chat-history__item h-38px px-12px py-8px rd-8px flex items-center gap-10px cursor-pointer border-none bg-transparent text-left',
                        selected ? 'bg-[rgba(var(--primary-6),0.12)] text-primary' : 'hover:bg-hover'
                      )}
                      onClick={() => {
                        navigate(item.path);
                        onSessionClick?.();
                      }}
                    >
                      <IconComponent theme="outline" size="18" className="shrink-0" />
                      <span className="chat-history__item-name collapsed-hidden text-14px text-t-primary">
                        {item.label}
                      </span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatHistory />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 sider-footer mt-auto pt-8px px-8px pb-8px">
        <div className="flex flex-col gap-8px">
          {isSettings && (
            <Tooltip
              disabled={!tooltipEnabled}
              content={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              position="right"
            >
              <div
                onClick={toggleTheme}
                className={classNames(
                  'flex items-center justify-start gap-10px px-12px py-8px rd-0.5rem cursor-pointer transition-colors hover:bg-hover active:bg-active',
                  isMobile && 'sider-footer-btn-mobile'
                )}
              >
                {mode === 'dark' ? (
                  <IconSunFill style={{ fontSize: 18, color: 'rgb(var(--primary-6))' }} />
                ) : (
                  <IconMoonFill style={{ fontSize: 18, color: 'rgb(var(--primary-6))' }} />
                )}
                <span className="collapsed-hidden text-t-primary">
                  Theme · {mode === 'dark' ? 'Dark' : 'Light'}
                </span>
              </div>
            </Tooltip>
          )}

          <Tooltip disabled={!tooltipEnabled} content={isSettings ? 'Back' : 'Settings'} position="right">
            <div
              onClick={handleSettingsClick}
              className={classNames(
                'flex items-center justify-start gap-10px px-12px py-8px rd-0.5rem cursor-pointer transition-colors',
                isMobile && 'sider-footer-btn-mobile',
                isSettings
                  ? 'bg-[rgba(var(--primary-6),0.12)] text-primary'
                  : 'hover:bg-hover hover:shadow-sm active:bg-active'
              )}
            >
              {isSettings ? (
                <ArrowCircleLeft className="flex" theme="outline" size="24" fill="rgb(var(--primary-6))" />
              ) : (
                <SettingTwo className="flex" theme="outline" size="24" fill="rgb(var(--primary-6))" />
              )}
              <span className="collapsed-hidden text-t-primary">{isSettings ? 'Back' : 'Settings'}</span>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
