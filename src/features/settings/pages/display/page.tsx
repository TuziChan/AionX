import { Alert } from '@arco-design/web-react';
import { CustomCssCard } from './components/CustomCssCard';
import { ThemeCard } from './components/ThemeCard';
import { useDisplaySettings } from './hooks/useDisplaySettings';

export function Component() {
  const {
    customCssDraft,
    error,
    loading,
    savingCustomCss,
    savingTheme,
    savingZoom,
    settings,
    resetZoom,
    saveCustomCssDraft,
    updateCustomCssDraft,
    updateTheme,
    updateZoom,
  } = useDisplaySettings();

  return (
    <div className="settings-panel settings-panel--regular settings-display-page">
      <ThemeCard
        savingTheme={savingTheme}
        savingZoom={savingZoom}
        theme={settings?.theme ?? 'light'}
        zoomFactor={settings?.zoomFactor ?? 1}
        onThemeChange={(theme) => void updateTheme(theme)}
        onZoomChange={(zoomFactor) => void updateZoom(zoomFactor)}
        onZoomReset={() => void resetZoom()}
      />

      <CustomCssCard
        customCss={customCssDraft}
        saving={savingCustomCss}
        onChange={updateCustomCssDraft}
        onSave={() => void saveCustomCssDraft()}
      />

      {error ? <Alert type="error" content={error} /> : null}
      {loading ? <Alert type="info" content="正在加载显示设置..." /> : null}
    </div>
  );
}

Component.displayName = 'DisplaySettings';
