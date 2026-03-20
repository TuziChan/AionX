import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage, getSystemInfo, getSystemSettings, saveSystemSettings } from '@/features/settings/api/system';
import { notify } from '@/shared/lib';
import { buildSystemInfoLabel, type RuntimeDirectoryDraft, type SystemSettingsSnapshot } from '../types';

export function useSystemSettings() {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState<SystemSettingsSnapshot | null>(null);
  const [systemInfoLabel, setSystemInfoLabel] = useState('读取中');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCloseToTray, setSavingCloseToTray] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);
  const [savingCronNotification, setSavingCronNotification] = useState(false);
  const [savingRuntimeInfo, setSavingRuntimeInfo] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [systemSettings, systemInfo] = await Promise.all([getSystemSettings(), getSystemInfo()]);
      setSettings(systemSettings);
      setSystemInfoLabel(buildSystemInfoLabel(systemInfo));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  const updateCloseToTray = useCallback(
    async (checked: boolean) => {
      if (!settings) {
        return;
      }

      const previous = settings;
      const nextSettings = {
        ...settings,
        closeToTray: checked,
      };

      setSettings(nextSettings);
      setSavingCloseToTray(true);

      try {
        const saved = await saveSystemSettings(nextSettings);
        setSettings(saved);
        notify.success('系统行为已保存');
      } catch (caughtError) {
        setSettings(previous);
        notify.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
      } finally {
        setSavingCloseToTray(false);
      }
    },
    [settings],
  );

  const updateRuntimeInfo = useCallback(
    async (runtimeInfo: RuntimeDirectoryDraft) => {
      if (!settings) {
        return null;
      }

      const nextSettings = {
        ...settings,
        runtimeInfo,
      };

      setSavingRuntimeInfo(true);
      try {
        const saved = await saveSystemSettings(nextSettings);
        setSettings(saved);
        notify.success('目录配置已保存，重启后生效');
        return saved;
      } catch (caughtError) {
        notify.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
        throw caughtError;
      } finally {
        setSavingRuntimeInfo(false);
      }
    },
    [settings],
  );

  const updateNotificationEnabled = useCallback(
    async (enabled: boolean) => {
      if (!settings) {
        return;
      }

      const previous = settings;
      const nextSettings = {
        ...settings,
        notificationEnabled: enabled,
      };

      setSettings(nextSettings);
      setSavingNotification(true);

      try {
        const saved = await saveSystemSettings(nextSettings);
        setSettings(saved);
        notify.success('通知设置已保存');
      } catch (caughtError) {
        setSettings(previous);
        notify.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
      } finally {
        setSavingNotification(false);
      }
    },
    [settings],
  );

  const updateCronNotificationEnabled = useCallback(
    async (enabled: boolean) => {
      if (!settings) {
        return;
      }

      const previous = settings;
      const nextSettings = {
        ...settings,
        cronNotificationEnabled: enabled,
      };

      setSettings(nextSettings);
      setSavingCronNotification(true);

      try {
        const saved = await saveSystemSettings(nextSettings);
        setSettings(saved);
        notify.success('任务通知设置已保存');
      } catch (caughtError) {
        setSettings(previous);
        notify.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
      } finally {
        setSavingCronNotification(false);
      }
    },
    [settings],
  );

  const updateLanguage = useCallback(
    async (language: string) => {
      setSavingLanguage(true);
      try {
        await changeAppLanguage(language);
        await i18n.changeLanguage(language);
        notify.success('语言已切换');
      } catch (caughtError) {
        notify.error(`语言切换失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
      } finally {
        setSavingLanguage(false);
      }
    },
    [i18n],
  );

  return {
    currentLanguage,
    error,
    loading,
    savingCloseToTray,
    savingNotification,
    savingCronNotification,
    savingLanguage,
    savingRuntimeInfo,
    settings,
    systemInfoLabel,
    loadSettings,
    updateCloseToTray,
    updateNotificationEnabled,
    updateCronNotificationEnabled,
    updateLanguage,
    updateRuntimeInfo,
  };
}
