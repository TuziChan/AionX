import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useLayoutContext } from '@/contexts/LayoutContext';

interface SettingsFrameProps {
  sidebar?: ReactNode;
  mobileTopbar?: ReactNode;
  mobileTabs?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

export function SettingsFrame({
  sidebar,
  mobileTopbar,
  mobileTabs,
  header,
  children,
  contentClassName,
}: SettingsFrameProps) {
  const { isMobile } = useLayoutContext();

  return (
    <div className="settings-layout size-full">
      <div className="settings-layout__surface">
        {!isMobile ? <aside className="settings-layout__sidebar">{sidebar}</aside> : null}

        <main className="settings-layout__main">
          {isMobile ? mobileTopbar : null}
          {isMobile ? mobileTabs : null}
          <div className="settings-layout__body">
            {!isMobile ? header : null}
            <div className={cn('settings-layout__content', contentClassName)}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
