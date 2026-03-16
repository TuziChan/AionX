import type { ReactNode } from 'react';

interface ChatLayoutProps {
  tabs: ReactNode;
  header: ReactNode;
  body: ReactNode;
  sidebar?: ReactNode;
  mobileOverlay?: ReactNode;
  mobilePanels?: ReactNode;
}

export function ChatLayout({
  tabs,
  header,
  body,
  sidebar,
  mobileOverlay,
  mobilePanels,
}: ChatLayoutProps) {
  return (
    <div className="chat-page size-full">
      <div className="chat-layout-shell">
        <div className="chat-layout-main">
          {tabs}
          {header}
          {body}
        </div>
        {sidebar}
      </div>
      {mobileOverlay}
      {mobilePanels}
    </div>
  );
}
