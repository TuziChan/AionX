import { useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  SettingsPage,
} from '@/shared/ui';
import { RuntimeDirectoriesCard } from './components/RuntimeDirectoriesCard';
import { SystemBehaviorCard } from './components/SystemBehaviorCard';
import { useSystemSettings } from './hooks/useSystemSettings';

export function Component() {
  const [pendingDirectoryChange, setPendingDirectoryChange] = useState<{
    field: 'cacheDir' | 'workDir';
    value: string;
  } | null>(null);
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

    setPendingDirectoryChange({
      field,
      value: picked,
    });
  };

  const confirmDirectoryChange = async () => {
    if (!settings || !pendingDirectoryChange) {
      return;
    }

    await updateRuntimeInfo({
      ...settings.runtimeInfo,
      [pendingDirectoryChange.field]: pendingDirectoryChange.value,
    });
    setPendingDirectoryChange(null);
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {loading ? (
        <Alert>
          <AlertDescription>正在加载系统设置...</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog
        open={pendingDirectoryChange !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDirectoryChange(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认修改系统目录</AlertDialogTitle>
            <AlertDialogDescription>
              修改系统目录后需要重启应用才能完全生效。
              {pendingDirectoryChange ? ` 新路径：${pendingDirectoryChange.value}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingRuntimeInfo}>取消</AlertDialogCancel>
            <AlertDialogAction disabled={savingRuntimeInfo} onClick={() => void confirmDirectoryChange()}>
              继续修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPage>
  );
}

Component.displayName = 'SystemSettings';
