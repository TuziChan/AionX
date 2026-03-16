// import { useState, useEffect } from 'react';

interface TitlebarProps {
  onDebugClick?: () => void;
}

export function Titlebar({ onDebugClick }: TitlebarProps) {
  // const [isMaximized, setIsMaximized] = useState(false);

  // useEffect(() => {
  //   // TODO: 监听窗口最大化状态变化
  // }, []);

  return (
    <div
      className="h-[var(--titlebar-height)] bg-base border-b border-b-base flex items-center justify-between px-3 select-none"
      style={{ WebkitAppRegion: 'drag' } as any}
      data-tauri-drag-region
    >
      <div className="flex items-center gap-2" onClick={onDebugClick}>
        <span className="text-t-primary text-sm font-medium">AionX</span>
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* 窗口控制按钮 - 后续实现 */}
      </div>
    </div>
  );
}
