// 主题系统 - 亮色/暗色主题
export type ThemeMode = 'light' | 'dark';
export type ColorScheme = 'default';

export interface Theme {
  mode: ThemeMode;
  colorScheme: ColorScheme;
}

export const lightTheme: Theme = {
  mode: 'light',
  colorScheme: 'default',
};

export const darkTheme: Theme = {
  mode: 'dark',
  colorScheme: 'default',
};

// 应用主题到 DOM
export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // 设置主题模式
  root.setAttribute('data-theme', theme.mode);
  root.setAttribute('data-color-scheme', theme.colorScheme);
  root.classList.toggle('dark', theme.mode === 'dark');
  root.classList.toggle('light', theme.mode === 'light');
  root.style.colorScheme = theme.mode;

}

