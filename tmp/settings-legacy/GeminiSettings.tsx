import { Button, Input, Message, Select, Switch } from '@arco-design/web-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSetting, updateSetting } from '@/services/settings';
import type { GeminiConfig } from '../types';
import { PreferenceRow } from '../components/PreferenceRow';

const DEFAULT_CONFIG: GeminiConfig = {
  authType: '',
  proxy: '',
  GOOGLE_GEMINI_BASE_URL: '',
  GOOGLE_CLOUD_PROJECT: '',
  yoloMode: false,
  preferredMode: '',
};

export function Component() {
  const [config, setConfig] = useState<GeminiConfig>(DEFAULT_CONFIG);
  const [googleAccount, setGoogleAccount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [savedConfig, savedAccount] = await Promise.all([
        getSetting<GeminiConfig>('gemini.config', DEFAULT_CONFIG),
        getSetting<string>('gemini.currentGoogleAccount', ''),
      ]);
      setConfig({
        ...DEFAULT_CONFIG,
        ...savedConfig,
      });
      setGoogleAccount(savedAccount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [load]);

  const queueSave = useCallback((next: GeminiConfig) => {
    setConfig(next);
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void updateSetting('gemini.config', next).catch((error) => {
        Message.error(`保存 Gemini 配置失败: ${error instanceof Error ? error.message : String(error)}`);
      });
    }, 300);
  }, []);

  const handleGoogleLogin = async () => {
    const email = window.prompt('输入当前 Google 账号邮箱');
    if (!email) return;
    setGoogleAccount(email);
    await updateSetting('gemini.currentGoogleAccount', email);
    Message.success('Google 账号已记录');
  };

  const handleGoogleLogout = async () => {
    setGoogleAccount('');
    await updateSetting('gemini.currentGoogleAccount', '');
    Message.success('Google 账号已退出');
  };

  return (
    <div className="settings-panel">
      <div className="settings-group-card">
        <div className="settings-group-card__body">
          <PreferenceRow label="个人认证">
            {googleAccount ? (
              <div className="settings-inline-actions settings-inline-actions--compact">
                <Input value={googleAccount} readOnly />
                <Button onClick={() => void handleGoogleLogout()}>退出</Button>
              </div>
            ) : (
              <Button type="primary" onClick={() => void handleGoogleLogin()}>
                Google 登录
              </Button>
            )}
          </PreferenceRow>
          <PreferenceRow label="认证类型">
            <Select
              value={config.authType}
              options={[
                { label: 'Google Account', value: 'google-account' },
                { label: 'API Key', value: 'api-key' },
              ]}
              onChange={(value) => queueSave({ ...config, authType: String(value) })}
            />
          </PreferenceRow>
        </div>
      </div>

      <div className="settings-group-card">
        <div className="settings-group-card__body">
          <PreferenceRow label="代理配置">
            <Input value={config.proxy ?? ''} onChange={(value) => queueSave({ ...config, proxy: value })} placeholder="http://127.0.0.1:7890" />
          </PreferenceRow>
          <PreferenceRow label="GOOGLE_GEMINI_BASE_URL">
            <Input
              value={config.GOOGLE_GEMINI_BASE_URL ?? ''}
              onChange={(value) => queueSave({ ...config, GOOGLE_GEMINI_BASE_URL: value })}
              placeholder="可选"
            />
          </PreferenceRow>
          <PreferenceRow label="GOOGLE_CLOUD_PROJECT">
            <Input
              value={config.GOOGLE_CLOUD_PROJECT ?? ''}
              onChange={(value) => queueSave({ ...config, GOOGLE_CLOUD_PROJECT: value })}
              placeholder="填写 GCP Project ID"
            />
          </PreferenceRow>
          <PreferenceRow label="YOLO 模式">
            <Switch checked={Boolean(config.yoloMode)} onChange={(value) => queueSave({ ...config, yoloMode: value })} />
          </PreferenceRow>
          <PreferenceRow label="默认会话模式">
            <Select
              value={config.preferredMode ?? ''}
              options={[
                { label: '默认', value: '' },
                { label: 'Auto', value: 'auto' },
                { label: 'Manual', value: 'manual' },
              ]}
              onChange={(value) => queueSave({ ...config, preferredMode: String(value) })}
            />
          </PreferenceRow>
        </div>
      </div>

      {loading ? <div className="settings-status-inline">正在加载 Gemini 配置...</div> : null}
    </div>
  );
}

Component.displayName = 'GeminiSettings';
