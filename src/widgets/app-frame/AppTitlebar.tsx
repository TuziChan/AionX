import type { CSSProperties } from 'react';
import { ArrowLeft, MoonStar, PanelLeft, Settings2, SunMedium } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useThemeStore } from '@/stores/themeStore';
import { AppLogoMark } from './AppLogoMark';
import { getAppShellMeta } from './app-shell-meta';

interface AppTitlebarProps {
  onToggleSidebar?: () => void;
  onBrandClick?: () => void;
}

const dragRegionStyle = { WebkitAppRegion: 'drag' } as CSSProperties;
const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties;

export function AppTitlebar({ onToggleSidebar, onBrandClick }: AppTitlebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isMobile } = useLayoutContext();
  const { mode, toggleTheme } = useThemeStore();
  const meta = getAppShellMeta(pathname);
  const inSettings = pathname.startsWith('/settings');

  return (
    <div
      className="relative z-20 flex h-14 items-center gap-2 border-b border-border/70 bg-background/78 px-2 backdrop-blur-xl md:h-[var(--titlebar-height)] md:px-3"
      style={dragRegionStyle}
      data-tauri-drag-region
    >
      <div className="flex shrink-0 items-center gap-1" style={noDragStyle}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl border border-transparent text-muted-foreground hover:border-border/70 hover:bg-card/80 hover:text-foreground"
          onClick={onToggleSidebar}
          aria-label="切换侧栏"
          title="切换侧栏"
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-2" style={noDragStyle}>
        <button
          type="button"
          className="min-w-0 max-w-[min(72vw,640px)] rounded-full border border-border/70 bg-card/82 px-3 py-1.5 text-left shadow-sm backdrop-blur-md transition-transform duration-200 hover:-translate-y-px"
          onClick={onBrandClick}
          title={meta.description}
        >
          <span className="flex min-w-0 items-center gap-3">
            <AppLogoMark size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                {meta.section}
              </span>
              <span className={cn('block truncate font-semibold text-foreground', isMobile ? 'text-[13px]' : 'text-sm')}>
                {meta.title}
              </span>
            </span>
          </span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1" style={noDragStyle}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl border border-transparent text-muted-foreground hover:border-border/70 hover:bg-card/80 hover:text-foreground"
          onClick={toggleTheme}
          aria-label={mode === 'dark' ? '切到亮色主题' : '切到暗色主题'}
          title={mode === 'dark' ? '切到亮色主题' : '切到暗色主题'}
        >
          {mode === 'dark' ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-xl border border-transparent text-muted-foreground hover:border-border/70 hover:bg-card/80 hover:text-foreground"
          onClick={() => navigate(inSettings ? '/guid' : '/settings/gemini')}
          aria-label={inSettings ? '返回工作台' : '打开设置'}
          title={inSettings ? '返回工作台' : '打开设置'}
        >
          {inSettings ? <ArrowLeft className="size-4" /> : <Settings2 className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
