import { ConfigProvider } from '@arco-design/web-react';
import { useEffect, type PropsWithChildren } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { applyTheme } from '@/theme/theme';

const CUSTOM_CSS_KEY = 'aionx.customCss';
const CUSTOM_CSS_STYLE_ID = 'aionx-custom-css-theme';

function syncCustomCss() {
  const customCss = localStorage.getItem(CUSTOM_CSS_KEY) ?? '';
  let styleEl = document.getElementById(CUSTOM_CSS_STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = CUSTOM_CSS_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = customCss;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const { theme } = useThemeStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    syncCustomCss();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CUSTOM_CSS_KEY) {
        syncCustomCss();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return <ConfigProvider>{children}</ConfigProvider>;
}
