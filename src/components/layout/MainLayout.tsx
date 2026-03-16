import { Layout as ArcoLayout } from '@arco-design/web-react';
import classNames from 'classnames';
import { cloneElement, isValidElement, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayoutContext } from '../../contexts/LayoutContext';
import { Titlebar } from './Titlebar';

interface MainLayoutProps {
  sider: React.ReactNode;
}

export function MainLayout({ sider }: MainLayoutProps) {
  const layout = useLayoutContext();
  const { isMobile, siderCollapsed, setSiderCollapsed, siderWidth } = layout;

  const [debugCount, setDebugCount] = useState(0);

  const handleDebugClick = () => {
    setDebugCount((prev) => {
      if (prev >= 3) {
        console.log('Debug mode activated');
        return 0;
      }
      return prev + 1;
    });

    setTimeout(() => setDebugCount(0), 1000);
  };

  const handleToggleSider = () => {
    setSiderCollapsed(!siderCollapsed);
  };

  return (
    <div className="app-shell flex flex-col size-full min-h-0">
      <Titlebar onDebugClick={handleDebugClick} onToggleSidebar={handleToggleSider} />
      {isMobile && !siderCollapsed && (
        <div
          className="fixed inset-0 bg-black/30"
          style={{ zIndex: 90 }}
          onClick={() => setSiderCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <ArcoLayout className="layout flex-1 min-h-0">
        <ArcoLayout.Sider
          className={classNames('!bg-2 layout-sider', {
            collapsed: siderCollapsed,
          })}
          collapsed={siderCollapsed}
          collapsible
          trigger={null}
          width={siderWidth}
          collapsedWidth={isMobile ? 0 : 64}
          style={{
            position: isMobile ? 'fixed' : 'relative',
            left: 0,
            zIndex: isMobile ? 100 : 1,
            transform: isMobile && siderCollapsed ? 'translateX(-100%)' : 'translateX(0)',
            transition: 'none',
            pointerEvents: isMobile && siderCollapsed ? 'none' : 'auto',
          }}
        >
          <ArcoLayout.Content className="layout-sider-content bg-2">
            {isValidElement(sider)
              ? cloneElement(sider, {
                  onSessionClick: () => {
                    if (isMobile) setSiderCollapsed(true);
                  },
                  collapsed: siderCollapsed,
                } as any)
              : sider}
          </ArcoLayout.Content>
        </ArcoLayout.Sider>
        <ArcoLayout.Content
          className="layout-content bg-1 flex flex-col min-h-0"
          onClick={() => {
            if (isMobile && !siderCollapsed) setSiderCollapsed(true);
          }}
          style={
            isMobile
              ? {
                  width: '100%',
                }
              : undefined
          }
        >
          <Outlet />
        </ArcoLayout.Content>
      </ArcoLayout>
    </div>
  );
}
