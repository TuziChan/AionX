import { Alert, AlertDescription, SettingsPage } from '@/shared/ui';
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
    <SettingsPage className="settings-display-page">
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <Alert>
          <AlertDescription>正在加载显示设置...</AlertDescription>
        </Alert>
      ) : null}
    </SettingsPage>
  );
}

Component.displayName = 'DisplaySettings';
