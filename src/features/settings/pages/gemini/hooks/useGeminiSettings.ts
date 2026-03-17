import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_GEMINI_SETTINGS,
  getGeminiSettings,
  getGoogleAuthStatus,
  logoutGoogleAuth,
  saveGeminiSettings,
  startGoogleAuth,
} from '@/features/settings/api/gemini';
import type { GeminiAuthStatus, GeminiSettingsDraft } from '../types';

const DEFAULT_AUTH_STATUS: GeminiAuthStatus = {
  connected: false,
  email: null,
  projectId: null,
};

export function useGeminiSettings() {
  const [draft, setDraft] = useState<GeminiSettingsDraft>(DEFAULT_GEMINI_SETTINGS);
  const [authStatus, setAuthStatus] = useState<GeminiAuthStatus>(DEFAULT_AUTH_STATUS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const queuedDraftRef = useRef<GeminiSettingsDraft>(DEFAULT_GEMINI_SETTINGS);

  const clearPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextDraft, nextAuthStatus] = await Promise.all([getGeminiSettings(), getGoogleAuthStatus()]);
      queuedDraftRef.current = nextDraft;
      setDraft(nextDraft);
      setAuthStatus(nextAuthStatus);
    } catch (error) {
      Message.error(`加载 Gemini 配置失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistDraft = useCallback(async (nextDraft: GeminiSettingsDraft) => {
    setSaving(true);
    try {
      const savedDraft = await saveGeminiSettings(nextDraft);
      queuedDraftRef.current = savedDraft;
      setDraft(savedDraft);
    } catch (error) {
      Message.error(`保存 Gemini 配置失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        void persistDraft(queuedDraftRef.current);
      }
    };
  }, [load, persistDraft]);

  const queueDraftUpdate = useCallback(
    (updater: GeminiSettingsDraft | ((current: GeminiSettingsDraft) => GeminiSettingsDraft)) => {
      setDraft((current) => {
        const nextDraft = typeof updater === 'function' ? updater(current) : updater;
        queuedDraftRef.current = nextDraft;
        clearPendingSave();
        saveTimerRef.current = window.setTimeout(() => {
          void persistDraft(queuedDraftRef.current);
        }, 300);
        return nextDraft;
      });
    },
    [clearPendingSave, persistDraft],
  );

  const connectGoogleAccount = useCallback(
    async (email: string) => {
      setAuthPending(true);
      try {
        await startGoogleAuth(email);
        const [nextDraft, nextAuthStatus] = await Promise.all([getGeminiSettings(), getGoogleAuthStatus()]);
        clearPendingSave();
        queuedDraftRef.current = nextDraft;
        setDraft(nextDraft);
        setAuthStatus(nextAuthStatus);
        Message.success('Google 账号已连接');
      } catch (error) {
        Message.error(`Google 登录失败: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      } finally {
        setAuthPending(false);
      }
    },
    [clearPendingSave],
  );

  const disconnectGoogleAccount = useCallback(async () => {
    setAuthPending(true);
    try {
      const nextAuthStatus = await logoutGoogleAuth();
      setAuthStatus(nextAuthStatus);
      Message.success('Google 账号已退出');
    } catch (error) {
      Message.error(`退出 Google 账号失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setAuthPending(false);
    }
  }, []);

  return {
    authPending,
    authStatus,
    draft,
    loading,
    saving,
    connectGoogleAccount,
    disconnectGoogleAccount,
    queueDraftUpdate,
    reload: load,
  };
}
