import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '@/shared/lib/cn';

type SidebarVisualVariant = 'app' | 'settings';

interface SidebarContextValue {
  collapsed: boolean;
  isMobile: boolean;
  variant: SidebarVisualVariant;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  isMobile: false,
  variant: 'app',
});

export function useSidebar() {
  return React.useContext(SidebarContext);
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  isMobile?: boolean;
  variant?: SidebarVisualVariant;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsed = false, isMobile = false, variant = 'app', ...props }, ref) => (
    <SidebarContext.Provider value={{ collapsed, isMobile, variant }}>
      <div
        ref={ref}
        data-slot="sidebar"
        data-collapsed={collapsed ? 'true' : 'false'}
        data-mobile={isMobile ? 'true' : 'false'}
        data-variant={variant}
        className={cn(
          'flex h-full min-h-0 flex-col gap-3',
          variant === 'app' ? (collapsed ? 'items-center px-2 py-3' : 'p-3') : null,
          variant === 'settings' ? 'gap-1 px-0 py-0' : null,
          className
        )}
        {...props}
      />
    </SidebarContext.Provider>
  )
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-header" className={cn('flex flex-col gap-3', className)} {...props} />
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-content" className={cn('flex min-h-0 flex-1 flex-col gap-3', className)} {...props} />
);
SidebarContent.displayName = 'SidebarContent';

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-footer" className={cn('grid gap-2', className)} {...props} />
);
SidebarFooter.displayName = 'SidebarFooter';

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-group" className={cn('flex flex-col gap-2', className)} {...props} />
);
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { collapsed, variant } = useSidebar();

    return (
      <div
        ref={ref}
        data-slot="sidebar-group-label"
        className={cn(
          'text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground',
          variant === 'app' ? 'px-3' : 'px-4 pb-2 pt-2 text-[10px] tracking-[0.18em] text-slate-400 dark:text-slate-500',
          collapsed && variant === 'app' ? 'hidden' : null,
          className
        )}
        {...props}
      />
    );
  }
);
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-group-content" className={cn('min-h-0', className)} {...props} />
);
SidebarGroupContent.displayName = 'SidebarGroupContent';

const SidebarMenu = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-menu" className={cn('flex flex-col gap-1', className)} {...props} />
);
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} data-slot="sidebar-menu-item" className={cn('flex', className)} {...props} />
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  visualVariant?: SidebarVisualVariant;
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ asChild = false, className, isActive = false, visualVariant, children, ...props }, ref) => {
    const { collapsed, variant } = useSidebar();
    const resolvedVariant = visualVariant ?? variant;
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        data-slot="sidebar-menu-button"
        data-active={isActive ? 'true' : 'false'}
        className={cn(
          'group flex items-center border text-left transition-all duration-200',
          collapsed && resolvedVariant === 'app' ? 'size-11 justify-center rounded-[18px] px-0' : 'gap-3',
          resolvedVariant === 'app'
            ? isActive
              ? 'min-h-10 rounded-[18px] border-sidebar-border bg-sidebar-accent px-3 py-2 text-sidebar-foreground shadow-sm'
              : 'min-h-10 rounded-[18px] border-transparent px-3 py-2 text-muted-foreground hover:border-sidebar-border/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
            : isActive
              ? 'min-h-8 rounded-xl border border-slate-200/75 bg-white/82 px-3 py-1.5 text-slate-950 shadow-none dark:border-white/8 dark:bg-white/10 dark:text-white'
              : 'min-h-8 rounded-xl border border-transparent bg-transparent px-3 py-1.5 text-slate-600 shadow-none hover:bg-slate-200/26 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/6 dark:hover:text-white',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarRail = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-rail"
      className={cn('absolute inset-y-0 right-0 hidden w-px bg-border/50 md:block', className)}
      {...props}
    />
  )
);
SidebarRail.displayName = 'SidebarRail';

export {
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
  SidebarRail,
};
