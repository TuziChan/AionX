interface ChatTabsProps {
  currentTitle: string;
}

export function ChatTabs({ currentTitle }: ChatTabsProps) {
  return (
    <div className="conversation-tabs">
      <div className="conversation-tab conversation-tab--active">{currentTitle}</div>
      <div className="conversation-tab">Visual parity checklist</div>
      <div className="conversation-tab">Settings cleanup</div>
    </div>
  );
}
