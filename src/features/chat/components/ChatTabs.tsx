import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui';

const DEMO_TABS = [
  { value: 'demo', label: 'Landing page revamp', chatId: 'demo' },
  { value: 'demo-codex', label: 'Visual parity checklist', chatId: 'demo-codex' },
  { value: 'demo-gemini', label: 'Settings cleanup', chatId: 'demo-gemini' },
] as const;

interface ChatTabsProps {
  chatId: string;
  currentTitle: string;
}

export function ChatTabs({ chatId, currentTitle }: ChatTabsProps) {
  const navigate = useNavigate();
  const activeValue = DEMO_TABS.some((tab) => tab.chatId === chatId) ? chatId : 'current';

  return (
    <Tabs
      value={activeValue}
      onValueChange={(value) => {
        if (value === 'current') {
          return;
        }

        navigate(`/conversation/${value}`);
      }}
      className="conversation-tabs"
    >
      <TabsList className="h-auto justify-start gap-2 rounded-none bg-transparent p-0">
        <TabsTrigger value="current" className="conversation-tab">
          {currentTitle}
        </TabsTrigger>
        {DEMO_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="conversation-tab">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
