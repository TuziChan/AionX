import { MoonStar, Plus, Settings2, SunMedium } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatHistory } from '@/features/chat/components/ChatHistory';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/shared/ui/sidebar';
import { useThemeStore } from '@/stores/themeStore';
import { AppLogoMark } from './AppLogoMark';
import { APP_SIDEBAR_LINKS } from './app-shell-meta';

interface AppSidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed = false, onNavigate }: AppSidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, toggleTheme } = useThemeStore();

  const navigateTo = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Sidebar collapsed={collapsed} variant="app">
      <SidebarHeader>
        <div
          className={cn(
            'flex items-center gap-3 rounded-[24px] border border-sidebar-border/80 bg-sidebar/80 px-3 py-3 shadow-sm backdrop-blur-xl',
            collapsed && 'justify-center px-0'
          )}
        >
          <AppLogoMark size={collapsed ? 'sm' : 'md'} />
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-sidebar-foreground">AionX</div>
              <div className="truncate text-xs text-muted-foreground">Unified Workbench</div>
            </div>
          ) : null}
        </div>

        <Button
          type="button"
          variant="primary"
          size={collapsed ? 'icon' : 'md'}
          className={cn(
            'rounded-[18px] shadow-sm',
            collapsed ? 'size-11' : 'h-11 w-full justify-start rounded-[18px] px-4 text-sm'
          )}
          onClick={() => navigateTo('/guid')}
          title="新建会话"
        >
          <Plus className="size-4" />
          {!collapsed ? <span>新建会话</span> : null}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {APP_SIDEBAR_LINKS.map((item) => {
                const active =
                  item.id === 'settings'
                    ? pathname.startsWith('/settings')
                    : pathname === item.path || pathname.startsWith(`${item.path}/`);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      type="button"
                      isActive={active}
                      onClick={() => navigateTo(item.path)}
                      title={collapsed ? item.label : item.description}
                    >
                      <Icon className="size-4 shrink-0" />
                      {!collapsed ? <span className="truncate text-sm font-medium text-inherit">{item.label}</span> : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel>Recent Conversations</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-hidden rounded-[24px] border border-border/70 bg-card/72 shadow-sm backdrop-blur-md">
            {collapsed ? (
              <div className="flex h-full items-center justify-center text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Rec
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                <div className="px-3 pb-2 pt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Recent Conversations
                </div>
                <div className="min-h-0 flex-1 px-2 pb-2">
                  <ChatHistory onItemSelect={onNavigate} />
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn(collapsed && 'justify-items-center')}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              className="border border-border/60 bg-card/72 text-foreground shadow-sm hover:bg-accent"
              onClick={toggleTheme}
              title={mode === 'dark' ? '切到亮色主题' : '切到暗色主题'}
            >
              {mode === 'dark' ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
              {!collapsed ? <span>{mode === 'dark' ? '亮色主题' : '暗色主题'}</span> : null}
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              className="border border-border/60 bg-card/72 text-foreground shadow-sm hover:bg-accent"
              onClick={() => navigateTo('/settings/gemini')}
              title="打开设置"
            >
              <Settings2 className="size-4" />
              {!collapsed ? <span>设置</span> : null}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
