import { Layout as ArcoLayout } from '@arco-design/web-react';
import { MenuFold, MenuUnfold } from '@icon-park/react';
import classNames from 'classnames';
import { useState, cloneElement, isValidElement } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayoutContext } from '../../contexts/LayoutContext';
import { Titlebar } from './Titlebar';

interface AppLayoutProps {
  sider: React.ReactNode;
}

export function AppLayout({ sider }: AppLayoutProps) {
  const layout = useLayoutContext();
  const { isMobile, collapsed, setCollapsed, siderWidth } = layout;

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
    setCollapsed(!collapsed);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-base">
      {/* Titlebar */}
      <Titlebar onDebugClick={handleDebugClick} />

      {/* Main Layout */}
      <ArcoLayout className="flex-1 min-h-0">
        {/* Sider */}
        <ArcoLayout.Sider
          className={classNames('relative transition-all duration-300 border-r border-b-base', {
            'shadow-lg': isMobile && !collapsed,
          })}
          collapsed={collapsed}
          collapsible
          trigger={null}
          width={siderWidth}
          collapsedWidth={isMobile ? 0 : 48}
          style={{
            position: isMobile ? 'fixed' : 'relative',
            left: 0,
            top: 'var(--titlebar-height)',
            bottom: 0,
            zIndex: isMobile ? 100 : 1,
            height: isMobile ? 'calc(100vh - var(--titlebar-height))' : '100%',
            transform: isMobile && collapsed ? `translateX(-${siderWidth}px)` : 'translateX(0)',
          }}
        >
          {/* Toggle Button */}
          <div
            className={classNames(
              'absolute top-3 bg-1 border border-b-base rounded-lg p-1.5 cursor-pointer hover:bg-hover transition-colors z-10',
              collapsed ? 'right-[-40px]' : 'right-3'
            )}
            onClick={handleToggleSider}
            style={{
              display: isMobile && collapsed ? 'none' : 'block',
            }}
          >
            {collapsed ? (
              <MenuUnfold theme="outline" size="20" fill="var(--text-primary)" />
            ) : (
              <MenuFold theme="outline" size="20" fill="var(--text-primary)" />
            )}
          </div>

          {/* Sider Content */}
          <ArcoLayout.Content className="h-full overflow-hidden bg-1">
            {isValidElement(sider)
              ? cloneElement(sider, {
                  onSessionClick: () => {
                    if (isMobile) setCollapsed(true);
                  },
                  collapsed,
                } as any)
              : sider}
          </ArcoLayout.Content>
        </ArcoLayout.Sider>

        {/* Main Content */}
        <ArcoLayout.Content
          className="bg-1 flex flex-col min-h-0"
          onClick={() => {
            if (isMobile && !collapsed) setCollapsed(true);
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

      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-50"
          style={{ top: 'var(--titlebar-height)' }}
          onClick={() => setCollapsed(true)}
        />
      )}
    </div>
  );
}
