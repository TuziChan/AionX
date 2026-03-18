import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useState } from 'react';
import type { ChannelPlugin, WebUiStatus } from '@/bindings';
import {
  DEFAULT_WEBUI_SETTINGS,
  changeWebuiPassword,
  createChannelPlugin,
  deleteChannelPlugin,
  getWebuiSettings,
  getWebuiStatus,
  listChannelPlugins,
  resetWebuiPassword,
  saveWebuiSettings,
  startWebuiServer,
  stopWebuiServer,
  toggleChannelPlugin,
  updateChannelPlugin,
} from '@/features/settings/api/webui';
import type { ChannelPluginFormValues, WebuiSettingsDraft } from '../types';

export function useWebuiSettings() {
  const [settings, setSettings] = useState<WebuiSettingsDraft>(DEFAULT_WEBUI_SETTINGS);
  const [status, setStatus] = useState<WebUiStatus | null>(null);
  const [plugins, setPlugins] = useState<ChannelPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [savingPlugin, setSavingPlugin] = useState(false);
  const [togglingPluginId, setTogglingPluginId] = useState<string | null>(null);
  const [deletingPluginId, setDeletingPluginId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSettings, nextStatus, nextPlugins] = await Promise.all([
        getWebuiSettings(),
        getWebuiStatus(),
        listChannelPlugins(),
      ]);
      setSettings(nextSettings);
      setStatus(nextStatus);
      setPlugins(nextPlugins);
    } catch (error) {
      Message.error(`加载 WebUI 设置失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistSettings = useCallback(async (nextSettings: WebuiSettingsDraft, successMessage = 'WebUI 接入配置已保存') => {
    setSavingSettings(true);
    try {
      const saved = await saveWebuiSettings(nextSettings);
      setSettings(saved);
      Message.success(successMessage);
      return saved;
    } catch (error) {
      Message.error(`保存 WebUI 配置失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setSavingSettings(false);
    }
  }, []);

  const updateSettingsDraft = useCallback((updater: WebuiSettingsDraft | ((current: WebuiSettingsDraft) => WebuiSettingsDraft)) => {
    setSettings((current) => (typeof updater === 'function' ? updater(current) : updater));
  }, []);

  const toggleServer = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        setStarting(true);
        try {
          const saved = await persistSettings(
            {
              ...settings,
              enabled: true,
            },
            'WebUI 启动配置已保存',
          );
          const info = await startWebuiServer(saved);
          setStatus({
            running: true,
            port: info.port,
            remote: info.remote,
            admin_username: info.admin_username,
            initial_password: info.initial_password,
          });
          setSettings((current) => ({
            ...current,
            enabled: true,
            port: info.port,
            remote: info.remote,
          }));
          Message.success('WebUI 已启动');
        } catch {
          // errors are already surfaced in helper functions
        } finally {
          setStarting(false);
        }
        return;
      }

      setStopping(true);
      try {
        await stopWebuiServer();
        const saved = await getWebuiSettings();
        setSettings(saved);
        setStatus((current) =>
          current
            ? {
                ...current,
                running: false,
                port: null,
                initial_password: null,
              }
            : {
                running: false,
                port: null,
                remote: saved.remote,
                admin_username: 'admin',
                initial_password: null,
              },
        );
        Message.success('WebUI 已停止');
      } catch (error) {
        Message.error(`停止 WebUI 失败: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setStopping(false);
      }
    },
    [persistSettings, settings],
  );

  const submitPasswordChange = useCallback(async (newPassword: string) => {
    setChangingPassword(true);
    try {
      await changeWebuiPassword(newPassword);
      setStatus((current) => (current ? { ...current, initial_password: null } : current));
      Message.success('管理员密码已更新');
    } catch (error) {
      Message.error(`修改密码失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setChangingPassword(false);
    }
  }, []);

  const resetPassword = useCallback(async () => {
    setResettingPassword(true);
    try {
      const password = await resetWebuiPassword();
      setStatus((current) =>
        current
          ? {
              ...current,
              initial_password: password,
            }
          : current,
      );
      Message.success('已生成新的随机密码');
    } catch (error) {
      Message.error(`重置密码失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setResettingPassword(false);
    }
  }, []);

  const savePlugin = useCallback(async (values: ChannelPluginFormValues, editingPlugin?: ChannelPlugin | null) => {
    setSavingPlugin(true);
    try {
      if (editingPlugin) {
        await updateChannelPlugin(editingPlugin.id, values);
        Message.success('频道插件已更新');
      } else {
        await createChannelPlugin(values);
        Message.success('频道插件已创建');
      }

      setPlugins(await listChannelPlugins());
    } catch (error) {
      Message.error(`保存频道插件失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      setSavingPlugin(false);
    }
  }, []);

  const removePlugin = useCallback(async (pluginId: string) => {
    setDeletingPluginId(pluginId);
    try {
      await deleteChannelPlugin(pluginId);
      setPlugins((current) => current.filter((plugin) => plugin.id !== pluginId));
      Message.success('频道插件已删除');
    } catch (error) {
      Message.error(`删除频道插件失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeletingPluginId(null);
    }
  }, []);

  const setPluginEnabled = useCallback(async (plugin: ChannelPlugin, enabled: boolean) => {
    setTogglingPluginId(plugin.id);
    try {
      await toggleChannelPlugin(plugin, enabled);
      setPlugins((current) =>
        current.map((item) =>
          item.id === plugin.id
            ? {
                ...item,
                enabled,
                status: enabled ? 'active' : 'disabled',
              }
            : item,
        ),
      );
      Message.success(enabled ? '频道插件已启用' : '频道插件已停用');
    } catch (error) {
      Message.error(`更新频道插件失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTogglingPluginId(null);
    }
  }, []);

  return {
    changingPassword,
    deletingPluginId,
    loading,
    plugins,
    resettingPassword,
    savingPlugin,
    savingSettings,
    settings,
    starting,
    status,
    stopping,
    togglingPluginId,
    load,
    persistSettings,
    removePlugin,
    resetPassword,
    savePlugin,
    setPluginEnabled,
    submitPasswordChange,
    toggleServer,
    updateSettingsDraft,
  };
}
