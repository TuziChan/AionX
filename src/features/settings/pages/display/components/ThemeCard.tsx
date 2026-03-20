import { Moon, Sun } from 'lucide-react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import { Button, Slider, ToggleGroup, ToggleGroupItem } from '@/shared/ui';
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
    icon: Sun,
  },
  {
    value: 'dark' as const,
    label: '深色',
    icon: Moon,
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
          <ToggleGroup
            type="single"
            value={theme}
            className="settings-display-page__theme-switcher"
            aria-label="界面主题"
            onValueChange={(value) => {
              if (value) {
                onThemeChange(value as DisplayThemeMode);
              }
            }}
            disabled={savingTheme}
          >
            <span
              aria-hidden="true"
              className={`settings-display-page__theme-indicator settings-display-page__theme-indicator--${theme}`}
            />
            {THEME_OPTIONS.map((option) => {
              const isActive = option.value === theme;
              const Icon = option.icon;

              return (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  data-testid={`display-theme-${option.value}`}
                  className={`settings-display-page__theme-option ${isActive ? 'settings-display-page__theme-option--active' : ''}`}
                >
                  <span className="settings-display-page__theme-option-icon">
                    <Icon className="settings-display-page__theme-icon settings-display-page__theme-icon--visible" />
                  </span>
                  <span>{option.label}</span>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
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
              type="button"
              size="icon"
              variant="outline"
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
              value={[zoomFactor]}
              disabled={savingZoom}
              className="settings-display-page__zoom-slider"
              onValueChange={(value) => onZoomChange(clampDisplayZoom(value[0] ?? DISPLAY_ZOOM_DEFAULT))}
            />
            <div className="settings-display-page__zoom-meta">
              <Button
                id="display-zoom-increase"
                type="button"
                size="icon"
                variant="outline"
                className="settings-display-page__zoom-step"
                disabled={savingZoom || zoomFactor >= DISPLAY_ZOOM_MAX}
                onClick={() => onZoomChange(clampDisplayZoom(zoomFactor + DISPLAY_ZOOM_STEP))}
              >
                +
              </Button>
              <Button
                id="display-zoom-reset"
                type="button"
                variant="link"
                size="sm"
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
