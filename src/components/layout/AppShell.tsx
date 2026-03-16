import { ReactNode } from 'react';

interface AppShellProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-base">
      {sidebar && (
        <aside className="flex-shrink-0">
          {sidebar}
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {header && (
          <header className="flex-shrink-0">
            {header}
          </header>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
