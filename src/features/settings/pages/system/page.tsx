import { Alert } from '@arco-design/web-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { RuntimeDirectoriesCard } from './components/RuntimeDirectoriesCard';
import { SystemBehaviorCard } from './components/SystemBehaviorCard';
import { useSystemSettings } from './hooks/useSystemSettings';

export function Component() {
  const {
    currentLanguage,
    error,
    loading,
    savingCloseToTray,
    savingLanguage,
    savingRuntimeInfo,
    settings,
    systemInfoLabel,
    updateCloseToTray,
    updateLanguage,
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
    <div className="settings-panel settings-panel--regular settings-system-page">
      <SystemBehaviorCard
        closeToTray={settings?.closeToTray ?? false}
        currentLanguage={currentLanguage}
        savingCloseToTray={savingCloseToTray}
        savingLanguage={savingLanguage}
        systemInfoLabel={systemInfoLabel}
        onCloseToTrayChange={(checked) => void updateCloseToTray(checked)}
        onLanguageChange={(language) => void updateLanguage(language)}
      />

      <RuntimeDirectoriesCard
        runtimeInfo={runtimeInfo}
        saving={savingRuntimeInfo || !settings}
        onPickDirectory={(field) => void pickDirectory(field)}
      />

      {error ? <Alert type="error" content={error} /> : null}
      {loading ? <Alert type="info" content="正在加载系统设置..." /> : null}
    </div>
  );
}

Component.displayName = 'SystemSettings';
