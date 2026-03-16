import { ReactNode } from 'react';

interface HeaderProps {
  height?: number;
  children: ReactNode;
}

export function Header({ height = 56, children }: HeaderProps) {
  return (
    <div
      className="w-full bg-1 border-b border-b-base flex items-center px-4"
      style={{ height: `${height}px` }}
    >
      {children}
    </div>
  );
}

interface HeaderLeftProps {
  children: ReactNode;
}

export function HeaderLeft({ children }: HeaderLeftProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  );
}

interface HeaderCenterProps {
  children: ReactNode;
}

export function HeaderCenter({ children }: HeaderCenterProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      {children}
    </div>
  );
}

interface HeaderRightProps {
  children: ReactNode;
}

export function HeaderRight({ children }: HeaderRightProps) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  );
}
