import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { AppSidebar, AppTitlebar } from '@/widgets/app-frame';

const DESKTOP_SIDEBAR_WIDTH = 280;
const DESKTOP_SIDEBAR_COLLAPSED_WIDTH = 72;

export function AppFrame() {
  const { isMobile, siderCollapsed, setSiderCollapsed, siderWidth } = useLayoutContext();
  const [, setDebugCount] = useState(0);

  const handleBrandClick = () => {
    setDebugCount((current) => {
      if (current >= 2) {
        console.log('Debug mode activated');
        return 0;
      }

      return current + 1;
    });

    window.setTimeout(() => setDebugCount(0), 1000);
  };

  const handleToggleSidebar = () => {
    setSiderCollapsed(!siderCollapsed);
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSiderCollapsed(true);
    }
  };

  return (
    <div className="relative flex size-full min-h-0 flex-col overflow-hidden bg-transparent">
      <AppTitlebar onToggleSidebar={handleToggleSidebar} onBrandClick={handleBrandClick} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isMobile && !siderCollapsed ? (
          <button
            type="button"
            className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={handleCloseSidebar}
            aria-label="关闭导航抽屉"
          />
        ) : null}

        <aside
          className="z-30 min-h-0 shrink-0 border-r border-sidebar-border/80 bg-sidebar/92 shadow-lg transition-[width,transform,opacity] duration-200 ease-out supports-[backdrop-filter]:backdrop-blur-2xl md:relative md:z-10 md:shadow-none"
          style={{
            width: isMobile ? `${siderWidth}px` : `${siderCollapsed ? DESKTOP_SIDEBAR_COLLAPSED_WIDTH : DESKTOP_SIDEBAR_WIDTH}px`,
            position: isMobile ? 'absolute' : 'relative',
            inset: isMobile ? '0 auto 0 0' : undefined,
            transform: isMobile && siderCollapsed ? 'translateX(-100%)' : 'translateX(0)',
            opacity: isMobile && siderCollapsed ? 0 : 1,
            pointerEvents: isMobile && siderCollapsed ? 'none' : 'auto',
          }}
        >
          <AppSidebar collapsed={!isMobile && siderCollapsed} onNavigate={handleCloseSidebar} />
        </aside>

        <main className="relative min-w-0 flex-1 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_22%)]"
            aria-hidden="true"
          />

          <div className="relative flex h-full min-h-0 flex-col px-3 pb-3 pt-3 md:px-[var(--page-gutter)] md:pb-[var(--page-gutter)] md:pt-4">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/80 shadow-[var(--shadow-md)] backdrop-blur-md">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
