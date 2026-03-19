import type { ReactNode } from 'react';

interface ConversationFrameProps {
  tabs: ReactNode;
  header: ReactNode;
  body: ReactNode;
  sidebar?: ReactNode;
  mobileOverlay?: ReactNode;
  mobilePanels?: ReactNode;
}

export function ConversationFrame({
  tabs,
  header,
  body,
  sidebar,
  mobileOverlay,
  mobilePanels,
}: ConversationFrameProps) {
  return (
    <div className="chat-page size-full">
      <div className="flex size-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 gap-3 p-3 md:gap-4 md:p-4">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card/78 shadow-sm backdrop-blur-md">
            {tabs}
            {header}
            {body}
          </div>
          {sidebar}
        </div>
      </div>
      {mobileOverlay}
      {mobilePanels}
    </div>
  );
}
