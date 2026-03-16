import { Alert, Button, Input, Message, Switch } from '@arco-design/web-react';
import { useCallback, useEffect, useState } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { commands, type SystemDirectories } from '@/bindings';
import { getSystemInfo, updateSetting } from '@/services/settings';
import { PreferenceRow } from '../components/PreferenceRow';

interface RuntimeInfo {
  cacheDir: string;
  workDir: string;
  logDir: string;
}

export function Component() {
  const [closeToTray, setCloseToTray] = useState(false);
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [systemInfoLabel, setSystemInfoLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [closeToTrayResult, runtimeInfoResult, systemInfoResult, systemDirectoriesResult] = await Promise.all([
        commands.getSettings('system.closeToTray'),
        commands.getSettings('system.runtimeInfo'),
        getSystemInfo(),
        commands.getSystemDirectories(),
      ]);

      setCloseToTray(closeToTrayResult.status === 'ok' ? Boolean(closeToTrayResult.data) : false);
      setSystemInfoLabel(`${systemInfoResult.os} / ${systemInfoResult.arch} / v${systemInfoResult.version}`);

      if (systemDirectoriesResult.status === 'ok') {
        const dirs = systemDirectoriesResult.data as SystemDirectories;
        const runtime = (
          runtimeInfoResult.status === 'ok' && runtimeInfoResult.data && typeof runtimeInfoResult.data === 'object'
            ? runtimeInfoResult.data
            : null
        ) as Partial<RuntimeInfo> | null;
        setRuntimeInfo({
          cacheDir: runtime?.cacheDir ?? dirs.cache_dir,
          workDir: runtime?.workDir ?? dirs.data_dir,
          logDir: runtime?.logDir ?? dirs.log_dir,
        });
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCloseToTrayChange = async (checked: boolean) => {
    setCloseToTray(checked);
    try {
      await updateSetting('system.closeToTray', checked);
    } catch (caughtError) {
      setCloseToTray(!checked);
      Message.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
    }
  };

  const pickDirectory = async (field: 'cacheDir' | 'workDir') => {
    if (!runtimeInfo) return;
    const picked = await openDialog({
      directory: true,
      multiple: false,
      defaultPath: runtimeInfo[field],
    });

    if (!picked || Array.isArray(picked)) return;

    const next = {
      ...runtimeInfo,
      [field]: picked,
    };

    const confirmed = window.confirm('修改系统目录后需要重启应用，是否继续？');
    if (!confirmed) {
      return;
    }

    setRuntimeInfo(next);
    try {
      await updateSetting('system.runtimeInfo', next);
      Message.success('目录配置已保存，重启后生效');
    } catch (caughtError) {
      Message.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
      void load();
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-group-card">
        <div className="settings-group-card__body">
          <PreferenceRow label="语言">
            <LanguageSwitcher />
          </PreferenceRow>
          <PreferenceRow label="关闭窗口时最小化到托盘">
            <Switch checked={closeToTray} onChange={(value) => void handleCloseToTrayChange(value)} />
          </PreferenceRow>
          <PreferenceRow label="运行环境">
            <Input value={systemInfoLabel || '读取中'} readOnly />
          </PreferenceRow>
        </div>
      </div>

      <div className="settings-group-card">
        <div className="settings-group-card__body">
          <PreferenceRow label="缓存目录">
            <div className="settings-inline-actions settings-inline-actions--compact">
              <Input value={runtimeInfo?.cacheDir ?? ''} readOnly />
              <Button onClick={() => void pickDirectory('cacheDir')} disabled={!runtimeInfo}>
                选择
              </Button>
            </div>
          </PreferenceRow>
          <PreferenceRow label="工作目录">
            <div className="settings-inline-actions settings-inline-actions--compact">
              <Input value={runtimeInfo?.workDir ?? ''} readOnly />
              <Button onClick={() => void pickDirectory('workDir')} disabled={!runtimeInfo}>
                选择
              </Button>
            </div>
          </PreferenceRow>
          <PreferenceRow label="日志目录">
            <div className="settings-inline-actions settings-inline-actions--compact">
              <Input value={runtimeInfo?.logDir ?? ''} readOnly />
              <Button onClick={() => runtimeInfo?.logDir && void openPath(runtimeInfo.logDir)} disabled={!runtimeInfo?.logDir}>
                打开
              </Button>
            </div>
          </PreferenceRow>
        </div>
      </div>

      {error ? <Alert type="error" content={error} /> : null}
      {loading ? <Alert type="info" content="正在加载系统设置..." /> : null}
    </div>
  );
}

Component.displayName = 'SystemSettings';
