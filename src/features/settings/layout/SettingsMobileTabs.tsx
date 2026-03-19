import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui';
import type { SettingsRegistryItem } from '../registry/settingsRegistry';

interface SettingsMobileTabsProps {
  items: SettingsRegistryItem[];
}

export function SettingsMobileTabs({ items }: SettingsMobileTabsProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
  }, [pathname]);

  return (
    <Sidebar
      variant="settings"
      isMobile
      className="settings-mobile-tabs h-auto min-h-0 flex-none gap-0 p-0"
      role="tablist"
      aria-label="Settings sections"
      data-testid="settings-mobile-tabs"
    >
      <SidebarContent className="flex-none gap-0">
        <SidebarGroup className="flex-none gap-0">
          <SidebarGroupContent>
            <SidebarMenu className="flex-row gap-2 overflow-x-auto pb-1">
              {items.map((item) => {
                const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <SidebarMenuItem key={item.id} className="shrink-0">
                    <SidebarMenuButton
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-current={active ? 'page' : undefined}
                      ref={active ? activeTabRef : null}
                      visualVariant="settings"
                      isActive={active}
                      className="min-h-[28px] gap-1 rounded-full px-2.5 py-0 whitespace-nowrap text-[12px]"
                      onClick={() => navigate(item.path)}
                    >
                      {item.label}
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
