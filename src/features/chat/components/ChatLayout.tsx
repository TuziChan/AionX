import type { ReactNode } from 'react';
import { ConversationFrame } from '@/app/layouts';

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
    <ConversationFrame
      tabs={tabs}
      header={header}
      body={body}
      sidebar={sidebar}
      mobileOverlay={mobileOverlay}
      mobilePanels={mobilePanels}
    />
  );
}
