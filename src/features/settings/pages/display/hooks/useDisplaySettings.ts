import { Message } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import { applyDisplayCustomCss, getDisplaySettings, saveDisplaySettings } from '@/features/settings/api/display';
import { useThemeStore } from '@/stores/themeStore';
import {
  clampDisplayZoom,
  DISPLAY_ZOOM_DEFAULT,
  type DisplaySettingsSnapshot,
  type DisplayThemeMode,
} from '../types';

export function useDisplaySettings() {
  const { setTheme } = useThemeStore();
  const [settings, setSettings] = useState<DisplaySettingsSnapshot | null>(null);
  const [customCssDraft, setCustomCssDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingZoom, setSavingZoom] = useState(false);
  const [savingCustomCss, setSavingCustomCss] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const snapshot = await getDisplaySettings();
        if (cancelled) {
          return;
        }

        setSettings(snapshot);
        setCustomCssDraft(snapshot.customCss);
        setTheme(snapshot.theme);
        applyDisplayCustomCss(snapshot.customCss);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  async function updateTheme(nextTheme: DisplayThemeMode) {
    if (!settings || settings.theme === nextTheme) {
      return;
    }

    const previous = settings;
    const nextSettings = {
      ...settings,
      theme: nextTheme,
    };

    setTheme(nextTheme);
    setSettings(nextSettings);
    setSavingTheme(true);

    try {
      const saved = await saveDisplaySettings(nextSettings);
      setSettings(saved);
      setTheme(saved.theme);
      Message.success('主题已保存');
    } catch (caughtError) {
      setSettings(previous);
      setTheme(previous.theme);
      Message.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
    } finally {
      setSavingTheme(false);
    }
  }

  async function updateZoom(nextZoomFactor: number) {
    if (!settings) {
      return;
    }

    const previous = settings;
    const nextSettings = {
      ...settings,
      zoomFactor: clampDisplayZoom(nextZoomFactor),
    };

    setSettings(nextSettings);
    setSavingZoom(true);

    try {
      const saved = await saveDisplaySettings(nextSettings);
      setSettings(saved);
      Message.success('界面缩放已保存');
    } catch (caughtError) {
      setSettings(previous);
      Message.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
    } finally {
      setSavingZoom(false);
    }
  }

  function updateCustomCssDraft(nextCustomCss: string) {
    setCustomCssDraft(nextCustomCss);
    applyDisplayCustomCss(nextCustomCss);
  }

  async function saveCustomCssDraft() {
    if (!settings) {
      return;
    }

    const previous = settings;
    const nextSettings = {
      ...settings,
      customCss: customCssDraft,
    };

    setSettings(nextSettings);
    setSavingCustomCss(true);

    try {
      const saved = await saveDisplaySettings(nextSettings);
      setSettings(saved);
      setCustomCssDraft(saved.customCss);
      applyDisplayCustomCss(saved.customCss);
      Message.success('自定义 CSS 已保存');
    } catch (caughtError) {
      setSettings(previous);
      setCustomCssDraft(previous.customCss);
      applyDisplayCustomCss(previous.customCss);
      Message.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
    } finally {
      setSavingCustomCss(false);
    }
  }

  async function resetZoom() {
    await updateZoom(DISPLAY_ZOOM_DEFAULT);
  }

  return {
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
  };
}
