import { Alert, Input, Message, Switch } from '@arco-design/web-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { commands, type Extension } from '@/bindings';
import { PreferenceRow } from '../components/PreferenceRow';

export function Component() {
  const { tabId = '' } = useParams<{ tabId: string }>();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await commands.listExtensions();
      if (result.status === 'ok') {
        setExtensions(result.data);
      } else {
        Message.error(`加载扩展失败: ${String(result.error)}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const extension = useMemo(
    () => extensions.find((item) => item.id === tabId || item.name === tabId) ?? null,
    [extensions, tabId],
  );

  const handleToggle = async (checked: boolean) => {
    if (!extension) return;
    const result = await commands.updateExtension(extension.id, {
      enabled: checked,
      name: extension.name,
      version: extension.version,
      description: extension.description,
      config: extension.config,
    });
    if (result.status !== 'ok') {
      Message.error(`更新扩展失败: ${String(result.error)}`);
      return;
    }
    void load();
  };

  if (!extension) {
    return (
      <div className="settings-panel">
        <Alert type="warning" content={loading ? '正在加载扩展设置...' : `未找到扩展设置页：${tabId}`} />
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div className="settings-group-card">
        <div className="settings-group-card__title">扩展设置 · {extension.name}</div>
        <div className="settings-group-card__body">
          <PreferenceRow label="名称">
            <Input value={extension.name} readOnly />
          </PreferenceRow>
          <PreferenceRow label="版本">
            <Input value={extension.version} readOnly />
          </PreferenceRow>
          <PreferenceRow label="路径">
            <Input value={extension.path} readOnly />
          </PreferenceRow>
          <PreferenceRow label="启用">
            <Switch checked={extension.enabled} onChange={(value) => void handleToggle(value)} />
          </PreferenceRow>
          <PreferenceRow label="描述">
            <Input.TextArea value={extension.description ?? ''} autoSize={{ minRows: 3, maxRows: 8 }} readOnly />
          </PreferenceRow>
          <PreferenceRow label="配置(JSON)">
            <Input.TextArea value={extension.config ?? '{}'} autoSize={{ minRows: 6, maxRows: 12 }} readOnly />
          </PreferenceRow>
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'ExtensionSettings';
