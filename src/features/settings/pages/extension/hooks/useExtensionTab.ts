import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getExtensionSettingsTab, setExtensionEnabled } from '@/features/settings/api/extension';
import type { ExtensionSettingsTab } from '../types';

export function useExtensionTab() {
  const { tabId = '' } = useParams<{ tabId: string }>();
  const [tab, setTab] = useState<ExtensionSettingsTab | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tabId) {
      setTab(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextTab = await getExtensionSettingsTab(tabId);
      setTab(nextTab);
    } catch (error) {
      setTab(null);
      Message.error(`加载扩展设置失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleEnabled = useCallback(
    async (enabled: boolean) => {
      if (!tab) {
        return;
      }

      setSaving(true);
      try {
        await setExtensionEnabled(tab.extensionId, enabled);
        setTab((current) => (current ? { ...current, enabled } : current));
        Message.success(enabled ? '扩展已启用' : '扩展已停用');
      } catch (error) {
        Message.error(`更新扩展状态失败: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setSaving(false);
      }
    },
    [tab],
  );

  return {
    loading,
    saving,
    tab,
    load,
    toggleEnabled,
  };
}
