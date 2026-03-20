import { useEffect, useState } from 'react';
import { EMPTY_MODEL_PROVIDER } from '@/features/settings/api/model';
import { notify } from '@/shared/lib';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/shared/ui';
import type { ModelProvider } from '@/features/settings/types';
import type { ProviderFormValues } from '../types';

interface ProviderEditorModalProps {
  provider: ModelProvider | null;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ProviderFormValues, editingProvider?: ModelProvider | null) => Promise<void>;
}

export function ProviderEditorModal({ provider, visible, onCancel, onSubmit }: ProviderEditorModalProps) {
  const [values, setValues] = useState<ProviderFormValues>(EMPTY_MODEL_PROVIDER);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (provider) {
      setValues({
        id: provider.id,
        platform: provider.platform,
        name: provider.name,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        contextLimit: provider.contextLimit,
      });
      return;
    }

    setValues(EMPTY_MODEL_PROVIDER);
  }, [provider, visible]);

  const updateValue = <TKey extends keyof ProviderFormValues>(key: TKey, value: ProviderFormValues[TKey]) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleOk = async () => {
    if (!values.name.trim()) {
      notify.error('请输入平台名称');
      return;
    }

    if (!values.platform.trim()) {
      notify.error('请选择平台类型');
      return;
    }

    await onSubmit(
      {
        ...values,
        name: values.name.trim(),
        baseUrl: values.baseUrl.trim(),
        apiKey: values.apiKey,
      },
      provider,
    );
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="settings-model-page__provider-modal">
        <DialogHeader>
          <DialogTitle>{provider ? '编辑平台' : '添加平台'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-provider-name">平台名称</Label>
            <Input
              id="model-provider-name"
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-provider-platform">平台类型</Label>
            <Select value={values.platform} onValueChange={(value) => updateValue('platform', value)}>
              <SelectTrigger id="model-provider-platform">
                <SelectValue placeholder="选择平台类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="openai-compatible">OpenAI Compatible</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-provider-base-url">Base URL</Label>
            <Input
              id="model-provider-base-url"
              value={values.baseUrl}
              onChange={(event) => updateValue('baseUrl', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-provider-api-key">API Key</Label>
            <Textarea
              id="model-provider-api-key"
              className="min-h-24"
              value={values.apiKey}
              onChange={(event) => updateValue('apiKey', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="model-provider-context-limit">Context Limit</Label>
            <Input
              id="model-provider-context-limit"
              value={values.contextLimit ?? ''}
              onChange={(event) => updateValue('contextLimit', event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button data-testid="model-provider-save" type="button" onClick={() => void handleOk()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
