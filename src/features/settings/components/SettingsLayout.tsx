import { Outlet } from 'react-router-dom';

export function Component() {
  return (
    <div className="h-full flex flex-col bg-base">
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

Component.displayName = 'SettingsLayout';
