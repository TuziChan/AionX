import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createModelProvider,
  deleteModelProvider,
  deleteProviderModel,
  getApiKeyCount,
  getNextModelProtocol,
  isModelEnabled,
  listModelProviders,
  runModelHealthCheck,
  setModelProviderEnabled,
  setProviderModelEnabled,
  setProviderModelProtocol,
  updateModelProvider,
  upsertProviderModel,
} from '@/features/settings/api/model';
import { notify } from '@/shared/lib';
import type { ModelProvider } from '@/features/settings/types';
import type { ModelEditorDraft, ProviderFormValues } from '../types';

export function useModelProviders() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [checkingModelKey, setCheckingModelKey] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listModelProviders();
      setProviders(result);
      setSelectedProviderId((current) => current ?? result[0]?.id ?? null);
    } catch (error) {
      notify.error(`加载模型平台失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const filteredProviders = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return providers;
    }

    return providers.filter((provider) => {
      const haystacks = [provider.name, provider.platform, provider.baseUrl, ...provider.model];
      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }, [providers, searchValue]);

  useEffect(() => {
    if (filteredProviders.length === 0) {
      if (providers.length === 0) {
        setSelectedProviderId(null);
      }
      return;
    }

    if (!selectedProviderId || !filteredProviders.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(filteredProviders[0].id);
    }
  }, [filteredProviders, providers.length, selectedProviderId]);

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) ?? null,
    [providers, selectedProviderId],
  );

  const replaceProvider = useCallback((nextProvider: ModelProvider) => {
    setProviders((current) => {
      const hasExisting = current.some((provider) => provider.id === nextProvider.id);
      if (!hasExisting) {
        return [...current, nextProvider];
      }
      return current.map((provider) => (provider.id === nextProvider.id ? nextProvider : provider));
    });
  }, []);

  const upsertProvider = useCallback(
    async (values: ProviderFormValues, editingProvider?: ModelProvider | null) => {
      try {
        const nextProvider = editingProvider
          ? await updateModelProvider(editingProvider.id, values)
          : await createModelProvider(values);

        replaceProvider(nextProvider);
        setSelectedProviderId(nextProvider.id);
        notify.success(editingProvider ? '平台已更新' : '平台已添加');
      } catch (error) {
        notify.error(`保存平台失败: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    },
    [replaceProvider],
  );

  const deleteProvider = useCallback(async (providerId: string) => {
    try {
      await deleteModelProvider(providerId);
      setProviders((current) => current.filter((provider) => provider.id !== providerId));
      setSelectedProviderId((current) => (current === providerId ? null : current));
      notify.success('平台已删除');
    } catch (error) {
      notify.error(`删除平台失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const toggleProviderEnabled = useCallback(
    async (provider: ModelProvider) => {
      try {
        const nextProvider = await setModelProviderEnabled(provider.id, provider.enabled === false);
        replaceProvider(nextProvider);
        notify.success(nextProvider.enabled === false ? '平台已停用' : '平台已启用');
      } catch (error) {
        notify.error(`切换平台状态失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [replaceProvider],
  );

  const saveModel = useCallback(
    async ({ providerId, originalName, name }: ModelEditorDraft) => {
      const nextName = name.trim();
      if (!nextName) {
        notify.error('请输入模型名称');
        return false;
      }

      const provider = providers.find((item) => item.id === providerId);
      if (!provider) {
        notify.error('未找到目标平台');
        return false;
      }

      const hasDuplicate = provider.model.some((model) => model === nextName && model !== originalName);
      if (hasDuplicate) {
        notify.error('模型名称已存在');
        return false;
      }

      try {
        const nextProvider = await upsertProviderModel(providerId, nextName, originalName);
        replaceProvider(nextProvider);
        setSelectedProviderId(providerId);
        notify.success(originalName ? '模型已更新' : '模型已添加');
        return true;
      } catch (error) {
        notify.error(`保存模型失败: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    },
    [providers, replaceProvider],
  );

  const deleteModel = useCallback(
    async (providerId: string, modelName: string) => {
      try {
        const nextProvider = await deleteProviderModel(providerId, modelName);
        replaceProvider(nextProvider);
        notify.success('模型已删除');
      } catch (error) {
        notify.error(`删除模型失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [replaceProvider],
  );

  const toggleModel = useCallback(
    async (providerId: string, modelName: string, enabled: boolean) => {
      try {
        const nextProvider = await setProviderModelEnabled(providerId, modelName, enabled);
        replaceProvider(nextProvider);
        notify.success(enabled ? '模型已启用' : '模型已停用');
      } catch (error) {
        notify.error(`切换模型状态失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [replaceProvider],
  );

  const cycleModelProtocol = useCallback(
    async (providerId: string, modelName: string) => {
      try {
        const provider = providers.find((item) => item.id === providerId);
        if (!provider) {
          throw new Error('未找到目标平台');
        }

        const nextProvider = await setProviderModelProtocol(providerId, modelName, getNextModelProtocol(provider, modelName));
        replaceProvider(nextProvider);
        notify.success('协议已切换');
      } catch (error) {
        notify.error(`切换协议失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [providers, replaceProvider],
  );

  const runHealthCheck = useCallback(async (providerId: string, modelName: string) => {
    setCheckingModelKey(`${providerId}:${modelName}`);
    try {
      const health = await runModelHealthCheck(providerId, modelName);
      setProviders((current) =>
        current.map((provider) =>
          provider.id === providerId
            ? {
                ...provider,
                modelHealth: {
                  ...(provider.modelHealth ?? {}),
                  [modelName]: health,
                },
              }
            : provider,
        ),
      );
      notify.success('健康检查已完成');
    } catch (error) {
      notify.error(`健康检查失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCheckingModelKey(null);
    }
  }, []);

  const providerSummaries = useMemo(
    () =>
      filteredProviders.map((provider) => ({
        ...provider,
        apiKeyCount: getApiKeyCount(provider.apiKey),
        enabledModelCount: provider.model.filter((model) => isModelEnabled(provider, model)).length,
      })),
    [filteredProviders],
  );

  return {
    checkingModelKey,
    loading,
    providerSummaries,
    searchValue,
    selectedProvider,
    selectedProviderId,
    cycleModelProtocol,
    deleteModel,
    deleteProvider,
    loadProviders,
    runHealthCheck,
    saveModel,
    selectProvider: setSelectedProviderId,
    setSearchValue,
    toggleModel,
    toggleProviderEnabled,
    upsertProvider,
  };
}
