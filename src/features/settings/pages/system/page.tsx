import { Alert } from '@arco-design/web-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { SettingsPage } from '@/shared/ui';
import { RuntimeDirectoriesCard } from './components/RuntimeDirectoriesCard';
import { SystemBehaviorCard } from './components/SystemBehaviorCard';
import { useSystemSettings } from './hooks/useSystemSettings';

export function Component() {
  const {
    currentLanguage,
    error,
    loading,
    savingCloseToTray,
    savingCronNotification,
    savingLanguage,
    savingNotification,
    savingRuntimeInfo,
    settings,
    systemInfoLabel,
    updateCloseToTray,
    updateCronNotificationEnabled,
    updateLanguage,
    updateNotificationEnabled,
    updateRuntimeInfo,
  } = useSystemSettings();

  const runtimeInfo = settings?.runtimeInfo ?? {
    cacheDir: '',
    workDir: '',
    logDir: '',
  };

  const pickDirectory = async (field: 'cacheDir' | 'workDir') => {
    if (!settings) {
      return;
    }

    const picked = await openDialog({
      directory: true,
      multiple: false,
      defaultPath: settings.runtimeInfo[field],
    });

    if (!picked || Array.isArray(picked)) {
      return;
    }

    const confirmed = window.confirm('修改系统目录后需要重启应用，是否继续？');
    if (!confirmed) {
      return;
    }

    await updateRuntimeInfo({
      ...settings.runtimeInfo,
      [field]: picked,
    });
  };

  return (
    <SettingsPage className="settings-system-page">
      <section className="settings-group-card settings-system-page__card">
        <div className="settings-system-page__card-body">
          <SystemBehaviorCard
            closeToTray={settings?.closeToTray ?? false}
            cronNotificationEnabled={settings?.cronNotificationEnabled ?? false}
            currentLanguage={currentLanguage}
            notificationEnabled={settings?.notificationEnabled ?? true}
            savingCloseToTray={savingCloseToTray}
            savingCronNotification={savingCronNotification}
            savingLanguage={savingLanguage}
            savingNotification={savingNotification}
            systemInfoLabel={systemInfoLabel}
            onCloseToTrayChange={(checked) => void updateCloseToTray(checked)}
            onCronNotificationChange={(checked) => void updateCronNotificationEnabled(checked)}
            onLanguageChange={(language) => void updateLanguage(language)}
            onNotificationChange={(checked) => void updateNotificationEnabled(checked)}
          />

          <RuntimeDirectoriesCard
            runtimeInfo={runtimeInfo}
            saving={savingRuntimeInfo || !settings}
            onPickDirectory={(field) => void pickDirectory(field)}
          />
        </div>
      </section>

      {error ? <Alert type="error" content={error} /> : null}
      {loading ? <Alert type="info" content="正在加载系统设置..." /> : null}
    </SettingsPage>
  );
}

Component.displayName = 'SystemSettings';
