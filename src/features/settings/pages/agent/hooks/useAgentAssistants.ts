import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DetectedAgent } from '@/bindings';
import {
  createCustomAssistant,
  detectAvailableAgents,
  getAssistantStatusLabel,
  listBuiltinAssistants,
  listCustomAssistants,
  removeCustomAssistant,
  saveBuiltinAssistantPreferences,
  toBuiltinAssistantEntry,
  toCustomAssistantEntry,
  updateCustomAssistant,
} from '@/features/settings/api/agent';
import { notify } from '@/shared/lib';
import type { AssistantEditorValues, AssistantEntry } from '../types';
import { createAgentOptions } from '../types';

export function useAgentAssistants() {
  const [assistants, setAssistants] = useState<AssistantEntry[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingAssistantId, setRemovingAssistantId] = useState<string | null>(null);
  const [togglingAssistantId, setTogglingAssistantId] = useState<string | null>(null);
  const [detectedAgents, setDetectedAgents] = useState<DetectedAgent[]>([]);

  const loadAssistants = useCallback(async (preferredSelectedId?: string | null) => {
    setLoading(true);
    try {
      const [builtinAssistants, customAssistants, availableAgents] = await Promise.all([
        listBuiltinAssistants(),
        listCustomAssistants(),
        detectAvailableAgents(),
      ]);

      const nextAssistants = [
        ...builtinAssistants.map(toBuiltinAssistantEntry),
        ...customAssistants.map(toCustomAssistantEntry),
      ];

      setAssistants(nextAssistants);
      setDetectedAgents(availableAgents);
      setSelectedAssistantId((current) => {
        const nextSelectedId = preferredSelectedId ?? current;
        if (nextSelectedId && nextAssistants.some((assistant) => assistant.id === nextSelectedId)) {
          return nextSelectedId;
        }
        return nextAssistants[0]?.id ?? null;
      });
    } catch (error) {
      notify.error(`加载助手配置失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssistants();
  }, [loadAssistants]);

  const selectedAssistant = useMemo(
    () => assistants.find((assistant) => assistant.id === selectedAssistantId) ?? null,
    [assistants, selectedAssistantId],
  );

  const agentOptions = useMemo(() => createAgentOptions(detectedAgents), [detectedAgents]);

  const saveAssistant = useCallback(
    async (values: AssistantEditorValues, editingAssistant?: AssistantEntry | null) => {
      setSaving(true);
      try {
        if (!editingAssistant) {
          const created = await createCustomAssistant(values);
          notify.success('自定义助手已创建');
          await loadAssistants(`custom-${created.id}`);
          return;
        }

        if (editingAssistant.source === 'builtin') {
          await saveBuiltinAssistantPreferences(editingAssistant.id, {
            mainAgent: values.mainAgent,
            enabled: values.enabled,
          });
          notify.success('内置助手配置已更新');
          await loadAssistants(editingAssistant.id);
          return;
        }

        if (!editingAssistant.pluginId) {
          throw new Error('缺少自定义助手插件 ID');
        }

        await updateCustomAssistant(editingAssistant.pluginId, values);
        notify.success('自定义助手已更新');
        await loadAssistants(editingAssistant.id);
      } catch (error) {
        notify.error(`保存助手失败: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [loadAssistants],
  );

  const deleteAssistant = useCallback(
    async (assistant: AssistantEntry) => {
      if (assistant.source !== 'custom' || !assistant.pluginId) {
        return false;
      }

      setRemovingAssistantId(assistant.id);
      try {
        await removeCustomAssistant(assistant.pluginId);
        notify.success('自定义助手已删除');
        await loadAssistants(null);
        return true;
      } catch (error) {
        notify.error(`删除助手失败: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      } finally {
        setRemovingAssistantId(null);
      }
    },
    [loadAssistants],
  );

  const toggleAssistantEnabled = useCallback(
    async (assistant: AssistantEntry, enabled: boolean) => {
      setTogglingAssistantId(assistant.id);
      try {
        if (assistant.source === 'builtin') {
          await saveBuiltinAssistantPreferences(assistant.id, {
            mainAgent: assistant.mainAgent,
            enabled,
          });
        } else {
          if (!assistant.pluginId) {
            throw new Error('缺少自定义助手插件 ID');
          }

          await updateCustomAssistant(assistant.pluginId, {
            id: assistant.id,
            source: assistant.source,
            name: assistant.name,
            description: assistant.description,
            avatar: assistant.avatar,
            mainAgent: assistant.mainAgent,
            enabled,
            prompt: assistant.prompt,
          });
        }

        notify.success(enabled ? '助手已启用' : '助手已停用');
        await loadAssistants(assistant.id);
      } catch (error) {
        notify.error(`切换助手状态失败: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setTogglingAssistantId(null);
      }
    },
    [loadAssistants],
  );

  return {
    agentOptions,
    assistants,
    loading,
    removingAssistantId,
    saving,
    selectedAssistant,
    selectedAssistantId,
    deleteAssistant,
    getStatusLabel: getAssistantStatusLabel,
    loadAssistants,
    saveAssistant,
    selectAssistant: setSelectedAssistantId,
    toggleAssistantEnabled,
    togglingAssistantId,
  };
}
