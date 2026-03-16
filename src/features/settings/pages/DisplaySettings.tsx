import { Input, Message, Select, Slider, Switch } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import { commands } from '@/bindings';
import { getSetting, updateSetting } from '@/services/settings';
import { useThemeStore } from '@/stores/themeStore';
import { PreferenceRow } from '../components/PreferenceRow';

const CUSTOM_CSS_STYLE_ID = 'aionx-custom-css-theme';

export function Component() {
  const { mode, setTheme } = useThemeStore();
  const [zoom, setZoom] = useState(1);
  const [immersiveTitlebar, setImmersiveTitlebar] = useState(true);
  const [customCss, setCustomCss] = useState('');

  useEffect(() => {
    void getSetting<string>('customCss', '').then((value) => {
      setCustomCss(value);
      localStorage.setItem('aionx.customCss', value);
    });
  }, []);

  useEffect(() => {
    let styleEl = document.getElementById(CUSTOM_CSS_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = CUSTOM_CSS_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = customCss;
  }, [customCss]);

  return (
    <div className="settings-panel">
      <div className="settings-group-card">
        <div className="settings-group-card__body">
          <PreferenceRow label="主题模式">
            <Select
              value={mode}
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ]}
              onChange={(value) => setTheme(String(value) as 'light' | 'dark')}
            />
          </PreferenceRow>
          <PreferenceRow label="字体缩放" description={`${Math.round(zoom * 100)}%`}>
            <Slider
              min={0.8}
              max={1.4}
              step={0.05}
              value={zoom}
              onChange={(value) => setZoom(Number(value))}
              onAfterChange={async (value) => {
                const result = await commands.setZoomFactor(Number(value));
                if (result.status !== 'ok') {
                  Message.error(`缩放设置失败: ${String(result.error)}`);
                }
              }}
            />
          </PreferenceRow>
          <PreferenceRow label="启用沉浸标题栏">
            <Switch checked={immersiveTitlebar} onChange={setImmersiveTitlebar} />
          </PreferenceRow>
        </div>
      </div>

      <div className="settings-group-card">
        <div className="settings-group-card__title">CSS 主题设置</div>
        <div className="settings-group-card__body">
          <PreferenceRow label="自定义 CSS" description="与 AionUi 一样保留自定义样式入口，用于后续做主题皮肤收口。">
            <Input.TextArea
              value={customCss}
              onChange={(value) => setCustomCss(value)}
              autoSize={{ minRows: 8, maxRows: 16 }}
              placeholder="在这里输入自定义 CSS"
              onBlur={() => {
                localStorage.setItem('aionx.customCss', customCss);
                void updateSetting('customCss', customCss);
              }}
            />
          </PreferenceRow>
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'DisplaySettings';
