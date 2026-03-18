import { Message } from '@arco-design/web-react';
import { useEffect, useMemo, useState } from 'react';
import { checkForUpdates, getAppMetadata, getUpdatePreferences, saveUpdatePreferences } from '@/features/settings/api/about';
import type { AboutMetadata, UpdateCheckResult, UpdatePreferences } from '../types';

export function useAboutSettings() {
  const [metadata, setMetadata] = useState<AboutMetadata | null>(null);
  const [preferences, setPreferences] = useState<UpdatePreferences | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [appMetadata, updatePreferences] = await Promise.all([getAppMetadata(), getUpdatePreferences()]);

        if (cancelled) {
          return;
        }

        setMetadata(appMetadata);
        setPreferences(updatePreferences);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }

        setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
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
  }, []);

  async function updateIncludePrerelease(includePrerelease: boolean) {
    if (!preferences) {
      return;
    }

    const previous = preferences;
    const nextPreferences = {
      includePrerelease,
    };

    setPreferences(nextPreferences);
    setSavingPreference(true);

    try {
      const saved = await saveUpdatePreferences(nextPreferences);
      setPreferences(saved);
      Message.success('更新偏好已保存');
    } catch (caughtError) {
      setPreferences(previous);
      Message.error(`保存失败: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`);
    } finally {
      setSavingPreference(false);
    }
  }

  async function runUpdateCheck() {
    setChecking(true);

    try {
      const result = await checkForUpdates();
      setUpdateResult(result);

      if (result.updateAvailable) {
        Message.success('检测到可用更新');
      } else if (result.status === 'up-to-date') {
        Message.info('当前已经是最新版本');
      } else {
        Message.warning(result.detail);
      }
    } catch (caughtError) {
      const detail = caughtError instanceof Error ? caughtError.message : String(caughtError);
      setUpdateResult({
        status: 'error',
        currentVersion: metadata?.version ?? '0.0.0',
        latestVersion: null,
        updateAvailable: false,
        notes: null,
        publishedAt: null,
        detail,
      });
      Message.error(`检查更新失败: ${detail}`);
    } finally {
      setChecking(false);
    }
  }

  const links = useMemo(
    () =>
      metadata
        ? [
            { title: '帮助文档', url: metadata.docsUrl },
            { title: '更新日志', url: metadata.releasesUrl },
            { title: '问题反馈', url: metadata.issuesUrl },
            { title: '联系作者', url: metadata.contactUrl },
            { title: '源码仓库', url: metadata.repositoryUrl },
          ].filter((item) => item.url)
        : [],
    [metadata],
  );

  return {
    checking,
    error,
    links,
    loading,
    metadata,
    preferences,
    savingPreference,
    updateIncludePrerelease,
    updateResult,
    runUpdateCheck,
  };
}
