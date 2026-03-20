import { Calendar, Experiment, ListCheckbox, Plus, SettingTwo } from '@icon-park/react';
import classNames from 'classnames';
import { MoonStar, Sun } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLayoutContext } from '../../contexts/LayoutContext';
import { useThemeStore } from '../../stores/themeStore';
import { ChatHistory } from '../../features/chat/components/ChatHistory';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui';

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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeStore();
  const [batchMode, setBatchMode] = useState(false);

  const tooltipEnabled = collapsed && !isMobile;

  const quickLinks = useMemo(
    () => [
      { key: 'cron', label: 'Cron', path: '/cron', icon: Calendar },
      { key: 'components', label: 'Components', path: '/test/components', icon: Experiment },
    ],
    []
  );

  const handleSettingsClick = () => {
    navigate('/settings/gemini');
    onSessionClick?.();
  };

  return (
    <TooltipProvider delayDuration={120}>
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
          <div className="size-full flex flex-col">
            <div className="mb-8px shrink-0 flex items-center gap-8px">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                {tooltipEnabled ? <TooltipContent side="right">New Conversation</TooltipContent> : null}
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                {tooltipEnabled ? (
                  <TooltipContent side="right">{batchMode ? 'Exit batch mode' : 'Batch manage'}</TooltipContent>
                ) : null}
              </Tooltip>
            </div>

            <div className="mb-8px shrink-0 flex flex-col gap-2px">
              {quickLinks.map((item) => {
                const IconComponent = item.icon;
                const selected = pathname.startsWith(item.path);
                return (
                  <Tooltip key={item.key}>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    {tooltipEnabled ? <TooltipContent side="right">{item.label}</TooltipContent> : null}
                  </Tooltip>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatHistory />
            </div>
          </div>
        </div>

        <div className="shrink-0 sider-footer mt-auto pt-8px px-8px pb-8px">
          <div className="flex flex-col gap-8px">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={toggleTheme}
                  className={classNames(
                    'flex items-center justify-start gap-10px px-12px py-8px rd-0.5rem cursor-pointer transition-colors',
                    isMobile && 'sider-footer-btn-mobile',
                    'hover:bg-hover active:bg-active'
                  )}
                >
                  {mode === 'dark' ? (
                    <Sun className="shrink-0 text-primary" size={18} />
                  ) : (
                    <MoonStar className="shrink-0 text-primary" size={18} />
                  )}
                  <span className="collapsed-hidden text-t-primary">
                    Theme · {mode === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </div>
              </TooltipTrigger>
              {tooltipEnabled ? (
                <TooltipContent side="right">{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
              ) : null}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={handleSettingsClick}
                  className={classNames(
                    'flex items-center justify-start gap-10px px-12px py-8px rd-0.5rem cursor-pointer transition-colors hover:bg-hover hover:shadow-sm active:bg-active',
                    isMobile && 'sider-footer-btn-mobile'
                  )}
                >
                  <SettingTwo className="flex" theme="outline" size="24" fill="rgb(var(--primary-6))" />
                  <span className="collapsed-hidden text-t-primary">Settings</span>
                </div>
              </TooltipTrigger>
              {tooltipEnabled ? <TooltipContent side="right">Settings</TooltipContent> : null}
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
