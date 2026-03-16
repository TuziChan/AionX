// 主题 Provider 组件
import { useEffect, type ReactNode } from 'react';
import { ConfigProvider } from '@arco-design/web-react';
import { useThemeStore } from '../stores/theme';
import { applyTheme } from './theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, mode } = useThemeStore();

  useEffect(() => {
    // 初始化时应用主题
    applyTheme(theme);
  }, [theme]);

  return (
    <ConfigProvider
      theme={{
        // Arco Design 主题配置
        ...(mode === 'dark' && {
          // 暗色主题配置
        }),
      }}
    >
      {children}
    </ConfigProvider>
  );
}
