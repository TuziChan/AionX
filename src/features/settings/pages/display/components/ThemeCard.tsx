import { Button, Slider } from '@arco-design/web-react';
import { IconMoon, IconMoonFill, IconSun, IconSunFill } from '@arco-design/web-react/icon';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import {
  clampDisplayZoom,
  DISPLAY_ZOOM_DEFAULT,
  DISPLAY_ZOOM_MAX,
  DISPLAY_ZOOM_MIN,
  DISPLAY_ZOOM_STEP,
  formatDisplayZoom,
  type DisplayThemeMode,
} from '../types';

interface ThemeCardProps {
  savingTheme: boolean;
  savingZoom: boolean;
  theme: DisplayThemeMode;
  zoomFactor: number;
  onThemeChange: (theme: DisplayThemeMode) => void;
  onZoomChange: (zoomFactor: number) => void;
  onZoomReset: () => void;
}

const THEME_OPTIONS = [
  {
    value: 'light' as const,
    label: '浅色',
    icon: IconSun,
    activeIcon: IconSunFill,
  },
  {
    value: 'dark' as const,
    label: '深色',
    icon: IconMoon,
    activeIcon: IconMoonFill,
  },
];

export function ThemeCard({
  savingTheme,
  savingZoom,
  theme,
  zoomFactor,
  onThemeChange,
  onZoomChange,
  onZoomReset,
}: ThemeCardProps) {
  return (
    <section className="settings-group-card" data-testid="display-theme-card">
      <div className="settings-group-card__body settings-group-card__body--padded">
        <PreferenceRow label="界面主题">
          <div className="settings-display-page__theme-switcher" role="radiogroup" aria-label="界面主题">
            <span
              aria-hidden="true"
              className={`settings-display-page__theme-indicator settings-display-page__theme-indicator--${theme}`}
            />
            {THEME_OPTIONS.map((option) => {
              const isActive = option.value === theme;
              const Icon = isActive ? option.activeIcon : option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  data-testid={`display-theme-${option.value}`}
                  className={`settings-display-page__theme-option ${isActive ? 'settings-display-page__theme-option--active' : ''}`}
                  onClick={() => onThemeChange(option.value)}
                  disabled={savingTheme}
                >
                  <span className="settings-display-page__theme-option-icon">
                    <option.icon
                      className={`settings-display-page__theme-icon ${isActive ? 'settings-display-page__theme-icon--inactive' : ''}`}
                    />
                    <Icon
                      className={`settings-display-page__theme-icon settings-display-page__theme-icon--active ${isActive ? 'settings-display-page__theme-icon--visible' : ''}`}
                    />
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </PreferenceRow>

        <PreferenceRow
          label="界面缩放"
          extra={
            <span className="settings-display-page__zoom-value" data-testid="display-zoom-value">
              {formatDisplayZoom(zoomFactor)}
            </span>
          }
        >
          <div className="settings-display-page__zoom-control">
            <Button
              id="display-zoom-decrease"
              size="mini"
              type="secondary"
              shape="circle"
              className="settings-display-page__zoom-step"
              disabled={savingZoom || zoomFactor <= DISPLAY_ZOOM_MIN}
              onClick={() => onZoomChange(clampDisplayZoom(zoomFactor - DISPLAY_ZOOM_STEP))}
            >
              -
            </Button>
            <Slider
              min={DISPLAY_ZOOM_MIN}
              max={DISPLAY_ZOOM_MAX}
              step={DISPLAY_ZOOM_STEP}
              value={zoomFactor}
              disabled={savingZoom}
              className="settings-display-page__zoom-slider"
              showTicks
              onChange={(value) => onZoomChange(clampDisplayZoom(Number(value)))}
            />
            <div className="settings-display-page__zoom-meta">
              <Button
                id="display-zoom-increase"
                size="mini"
                type="secondary"
                shape="circle"
                className="settings-display-page__zoom-step"
                disabled={savingZoom || zoomFactor >= DISPLAY_ZOOM_MAX}
                onClick={() => onZoomChange(clampDisplayZoom(zoomFactor + DISPLAY_ZOOM_STEP))}
              >
                +
              </Button>
              <Button
                id="display-zoom-reset"
                size="small"
                type="text"
                className="settings-display-page__zoom-reset"
                disabled={savingZoom || zoomFactor === DISPLAY_ZOOM_DEFAULT}
                onClick={onZoomReset}
              >
                重置
              </Button>
            </div>
          </div>
        </PreferenceRow>
      </div>
    </section>
  );
}
