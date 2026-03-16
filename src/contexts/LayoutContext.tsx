import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface LayoutContextValue {
  isMobile: boolean;
  siderCollapsed: boolean;
  setSiderCollapsed: (collapsed: boolean) => void;
  siderWidth: number;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutProvider');
  }
  return context;
}

const DEFAULT_SIDER_WIDTH = 250;
const MOBILE_SIDER_WIDTH_RATIO = 0.67;
const MOBILE_SIDER_MIN_WIDTH = 260;
const MOBILE_SIDER_MAX_WIDTH = 420;

const detectMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  const byWidth = width < 768;
  const smallScreen = width < 1024;
  const byMedia = window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
  const byTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  return byWidth || (smallScreen && (byMedia || byTouchPoints));
};

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [isMobile, setIsMobile] = useState(detectMobileViewport);
  const [siderCollapsed, setSiderCollapsed] = useState(() => detectMobileViewport());

  const siderWidth = useMemo(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SIDER_WIDTH;
    }
    return isMobile
      ? Math.min(
          MOBILE_SIDER_MAX_WIDTH,
          Math.max(MOBILE_SIDER_MIN_WIDTH, window.innerWidth * MOBILE_SIDER_WIDTH_RATIO)
        )
      : DEFAULT_SIDER_WIDTH;
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = detectMobileViewport();
      setIsMobile(mobile);
      if (mobile) {
        setSiderCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value: LayoutContextValue = {
    isMobile,
    siderCollapsed,
    setSiderCollapsed,
    siderWidth,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}
