import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/shared/ui';
import type { SettingsRegistryItem } from '../registry/settingsRegistry';

interface SettingsNavProps {
  items: SettingsRegistryItem[];
}

export function SettingsNav({ items }: SettingsNavProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar variant="settings" className="gap-0 p-0" aria-label="Settings navigation" data-testid="settings-nav">
      <SidebarContent className="gap-0">
        <SidebarGroup className="gap-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      type="button"
                      visualVariant="settings"
                      isActive={active}
                      aria-current={active ? 'page' : undefined}
                      className="w-full"
                      onClick={() => navigate(item.path)}
                    >
                      <span className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground" aria-hidden="true">
                        <Icon theme="outline" size="16" />
                      </span>
                      <span className="min-w-0 truncate text-[13px] font-medium text-inherit">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
