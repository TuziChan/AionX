import { defineConfig, presetAttributify, presetUno, transformerDirectives, transformerVariantGroup } from 'unocss';

// 语义化文字颜色
const textColors = {
  't-primary': 'var(--text-primary)',
  't-secondary': 'var(--text-secondary)',
  't-tertiary': 'var(--bg-6)',
  't-disabled': 'var(--text-disabled)',
};

// 语义状态色
const semanticColors = {
  primary: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
};

// 背景色系统
const backgroundColors = {
  base: 'var(--bg-base)',
  1: 'var(--bg-1)',
  2: 'var(--bg-2)',
  3: 'var(--bg-3)',
  4: 'var(--bg-4)',
  5: 'var(--bg-5)',
  6: 'var(--bg-6)',
  8: 'var(--bg-8)',
  9: 'var(--bg-9)',
  10: 'var(--bg-10)',
  hover: 'var(--bg-hover)',
  active: 'var(--bg-active)',
};

// 边框颜色
const borderColors = {
  'b-base': 'var(--border-base)',
  'b-light': 'var(--border-light)',
  'b-1': 'var(--bg-3)',
  'b-2': 'var(--bg-4)',
  'b-3': 'var(--bg-5)',
};

// 品牌色
const brandColors = {
  brand: 'var(--brand)',
  'brand-light': 'var(--brand-light)',
  'brand-hover': 'var(--brand-hover)',
};

// AOU 品牌色系
const aouColors = {
  aou: {
    1: 'var(--aou-1)',
    2: 'var(--aou-2)',
    3: 'var(--aou-3)',
    4: 'var(--aou-4)',
    5: 'var(--aou-5)',
    6: 'var(--aou-6)',
    7: 'var(--aou-7)',
    8: 'var(--aou-8)',
    9: 'var(--aou-9)',
    10: 'var(--aou-10)',
  },
};

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
  },
  theme: {
    colors: {
      ...textColors,
      ...semanticColors,
      ...backgroundColors,
      ...borderColors,
      ...brandColors,
      ...aouColors,
    },
  },
  preflights: [
    {
      getCSS: () => `
        * {
          color: inherit;
        }
      `,
    },
  ],
});
