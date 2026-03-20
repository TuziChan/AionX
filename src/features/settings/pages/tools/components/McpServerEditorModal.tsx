import { useEffect, useState } from 'react';
import type { McpServer } from '@/bindings';
import { EMPTY_MCP_SERVER } from '@/features/settings/api/tools';
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
import type { McpServerFormValues } from '../types';

interface McpServerEditorModalProps {
  server: McpServer | null;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: McpServerFormValues, editingServer?: McpServer | null) => Promise<void>;
}

export function McpServerEditorModal({ server, visible, onCancel, onSubmit }: McpServerEditorModalProps) {
  const [values, setValues] = useState<McpServerFormValues>(EMPTY_MCP_SERVER);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (server) {
      setValues({
        name: server.name,
        type: server.type as McpServerFormValues['type'],
        command: server.command ?? '',
        args: server.args ?? '[]',
        env: server.env ?? '{}',
        url: server.url ?? '',
        oauthConfig: server.oauth_config ?? '{}',
      });
      return;
    }

    setValues(EMPTY_MCP_SERVER);
  }, [server, visible]);

  const updateValue = <TKey extends keyof McpServerFormValues>(key: TKey, value: McpServerFormValues[TKey]) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleOk = async () => {
    if (!values.name.trim()) {
      notify.error('请输入名称');
      return;
    }

    if (!values.type.trim()) {
      notify.error('请选择类型');
      return;
    }

    await onSubmit(
      {
        ...values,
        name: values.name.trim(),
        command: values.command.trim(),
        args: values.args.trim(),
        env: values.env.trim(),
        url: values.url.trim(),
        oauthConfig: values.oauthConfig.trim(),
      },
      server,
    );
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="settings-tools-page__editor-modal">
        <DialogHeader>
          <DialogTitle>{server ? '编辑 MCP Server' : '添加 MCP Server'}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-name">名称</Label>
            <Input id="tools-server-name" value={values.name} onChange={(event) => updateValue('name', event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-type">类型</Label>
            <Select value={values.type} onValueChange={(value) => updateValue('type', value as McpServerFormValues['type'])}>
              <SelectTrigger id="tools-server-type">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="stdio">stdio</SelectItem>
                  <SelectItem value="sse">sse</SelectItem>
                  <SelectItem value="http">http</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-command">命令</Label>
            <Input
              id="tools-server-command"
              value={values.command}
              onChange={(event) => updateValue('command', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-args">参数（JSON 数组）</Label>
            <Textarea
              id="tools-server-args"
              className="min-h-20"
              value={values.args}
              onChange={(event) => updateValue('args', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-env">环境变量（JSON 对象）</Label>
            <Textarea
              id="tools-server-env"
              className="min-h-20"
              value={values.env}
              onChange={(event) => updateValue('env', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-url">URL</Label>
            <Input id="tools-server-url" value={values.url} onChange={(event) => updateValue('url', event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tools-server-oauth-config">OAuth 配置（JSON）</Label>
            <Textarea
              id="tools-server-oauth-config"
              className="min-h-20"
              value={values.oauthConfig}
              onChange={(event) => updateValue('oauthConfig', event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button data-testid="tools-server-save" type="button" onClick={() => void handleOk()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
