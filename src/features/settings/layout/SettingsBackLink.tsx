import { ArrowCircleLeft } from '@icon-park/react';
import { useNavigate } from 'react-router-dom';
import { SidebarMenuButton } from '@/shared/ui';

export function SettingsBackLink() {
  const navigate = useNavigate();

  return (
    <SidebarMenuButton
      type="button"
      visualVariant="settings"
      data-testid="settings-back-link"
      className="settings-back-link min-h-[24px] justify-start rounded-xl border-transparent bg-transparent px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      onClick={() => navigate('/guid')}
    >
      <ArrowCircleLeft theme="outline" size="18" className="shrink-0" />
      <span className="text-[13px] font-medium">返回应用</span>
    </SidebarMenuButton>
  );
}
