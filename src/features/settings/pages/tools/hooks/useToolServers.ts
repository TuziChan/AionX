import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createMcpServer,
  deleteMcpServer,
  getImageGenerationSettings,
  getServerEndpointLabel,
  listImageGenerationOptions,
  listMcpServers,
  saveImageGenerationSettings,
  testMcpConnection,
  updateMcpServer,
} from '@/features/settings/api/tools';
import { notify } from '@/shared/lib';
import type { McpServer } from '@/bindings';
import type { ImageGenerationDraft, ImageGenerationOption, McpServerFormValues, McpServerSummary } from '../types';

const DEFAULT_IMAGE_SETTINGS: ImageGenerationDraft = {
  enabled: false,
  providerId: null,
  modelName: null,
};

export function useToolServers() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingServerId, setTestingServerId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [imageSettings, setImageSettings] = useState<ImageGenerationDraft>(DEFAULT_IMAGE_SETTINGS);
  const [imageOptions, setImageOptions] = useState<ImageGenerationOption[]>([]);
  const [testMessages, setTestMessages] = useState<Record<string, string>>({});

  const loadTools = useCallback(async () => {
    setLoading(true);
    try {
      const [nextServers, nextImageSettings, nextImageOptions] = await Promise.all([
        listMcpServers(),
        getImageGenerationSettings(),
        listImageGenerationOptions(),
      ]);

      setServers(nextServers);
      setSelectedServerId((current) => current ?? nextServers[0]?.id ?? null);
      setImageSettings(nextImageSettings);
      setImageOptions(nextImageOptions);
    } catch (error) {
      notify.error(`加载工具配置失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTools();
  }, [loadTools]);

  const filteredServers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return servers;
    }

    return servers.filter((server) => {
      const values = [server.name, server.type, server.command ?? '', server.url ?? '', server.args ?? '', server.env ?? ''];
      return values.some((value) => value.toLowerCase().includes(query));
    });
  }, [searchValue, servers]);

  useEffect(() => {
    if (filteredServers.length === 0) {
      if (servers.length === 0) {
        setSelectedServerId(null);
      }
      return;
    }

    if (!selectedServerId || !filteredServers.some((server) => server.id === selectedServerId)) {
      setSelectedServerId(filteredServers[0].id);
    }
  }, [filteredServers, selectedServerId, servers.length]);

  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId) ?? null,
    [selectedServerId, servers],
  );

  const serverSummaries = useMemo<McpServerSummary[]>(
    () =>
      filteredServers.map((server) => ({
        ...server,
        endpointLabel: getServerEndpointLabel(server),
        oauthReady: Boolean(server.oauth_config && server.oauth_config !== '{}'),
        lastTestMessage: testMessages[server.id],
      })),
    [filteredServers, testMessages],
  );

  const upsertServer = useCallback(async (values: McpServerFormValues, editingServer?: McpServer | null) => {
    try {
      const nextServer = editingServer
        ? await updateMcpServer(editingServer.id, values, editingServer.enabled)
        : await createMcpServer(values);

      setServers((current) => {
        const exists = current.some((server) => server.id === nextServer.id);
        if (!exists) {
          return [nextServer, ...current];
        }
        return current.map((server) => (server.id === nextServer.id ? nextServer : server));
      });
      setSelectedServerId(nextServer.id);
      notify.success(editingServer ? 'MCP 服务器已更新' : 'MCP 服务器已创建');
    } catch (error) {
      notify.error(`保存 MCP 服务器失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }, []);

  const toggleServer = useCallback(async (server: McpServer, enabled: boolean) => {
    try {
      const nextServer = await updateMcpServer(
        server.id,
        {
          name: server.name,
          type: server.type as McpServerFormValues['type'],
          command: server.command ?? '',
          args: server.args ?? '[]',
          env: server.env ?? '{}',
          url: server.url ?? '',
          oauthConfig: server.oauth_config ?? '{}',
        },
        enabled,
      );
      setServers((current) => current.map((item) => (item.id === nextServer.id ? nextServer : item)));
      notify.success(enabled ? 'MCP 服务器已启用' : 'MCP 服务器已停用');
    } catch (error) {
      notify.error(`切换 MCP 服务器状态失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const removeServer = useCallback(async (serverId: string) => {
    try {
      await deleteMcpServer(serverId);
      setServers((current) => current.filter((server) => server.id !== serverId));
      setSelectedServerId((current) => (current === serverId ? null : current));
      setTestMessages((current) => {
        const nextMessages = { ...current };
        delete nextMessages[serverId];
        return nextMessages;
      });
      notify.success('MCP 服务器已删除');
    } catch (error) {
      notify.error(`删除 MCP 服务器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const runConnectionTest = useCallback(async (serverId: string) => {
    setTestingServerId(serverId);
    try {
      const message = await testMcpConnection(serverId);
      setTestMessages((current) => ({
        ...current,
        [serverId]: message,
      }));
      notify.success('连接测试通过');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTestMessages((current) => ({
        ...current,
        [serverId]: message,
      }));
      notify.error(`连接测试失败: ${message}`);
    } finally {
      setTestingServerId(null);
    }
  }, []);

  const saveImageSettings = useCallback(async (nextSettings: ImageGenerationDraft) => {
    try {
      const saved = await saveImageGenerationSettings(nextSettings);
      setImageSettings(saved);
      notify.success('图像生成设置已保存');
    } catch (error) {
      notify.error(`保存图像生成设置失败: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }, []);

  return {
    imageOptions,
    imageSettings,
    loading,
    searchValue,
    selectedServer,
    selectedServerId,
    serverSummaries,
    testingServerId,
    loadTools,
    removeServer,
    runConnectionTest,
    saveImageSettings,
    selectServer: setSelectedServerId,
    setSearchValue,
    toggleServer,
    upsertServer,
  };
}
