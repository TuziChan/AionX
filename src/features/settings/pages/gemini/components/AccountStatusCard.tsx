import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/ui';
import type { GeminiAuthStatus } from '../types';

interface AccountStatusCardProps {
  authPending: boolean;
  authStatus: GeminiAuthStatus;
  onConnectAccount: (email: string) => Promise<void>;
  onDisconnectAccount: () => Promise<void>;
}

export function AccountStatusCard({
  authPending,
  authStatus,
  onConnectAccount,
  onDisconnectAccount,
}: AccountStatusCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!modalVisible) {
      setEmail(authStatus.email ?? '');
    }
  }, [authStatus.email, modalVisible]);

  const handleConfirm = async () => {
    await onConnectAccount(email);
    setModalVisible(false);
  };

  return (
    <>
      <PreferenceRow
        label="个人认证"
        description={
          authStatus.connected
            ? '当前 Google 账号会作为 Gemini 项目绑定的归属身份。'
            : '登录后会记录当前 Google 账号，并在该账号下恢复对应的项目绑定。'
        }
      >
        {authStatus.connected ? (
          <div className="settings-inline-actions settings-inline-actions--compact settings-gemini-page__auth-row">
            <Input id="gemini-account-email" data-testid="gemini-account-email" value={authStatus.email ?? ''} readOnly />
            <Button type="button" disabled={authPending} onClick={() => setModalVisible(true)}>
              {authPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              切换账号
            </Button>
            <Button type="button" variant="destructive" disabled={authPending} onClick={() => void onDisconnectAccount()}>
              {authPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              退出
            </Button>
          </div>
        ) : (
          <Button
            data-testid="gemini-login-button"
            type="button"
            disabled={authPending}
            onClick={() => setModalVisible(true)}
          >
            {authPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            Google 登录
          </Button>
        )}
      </PreferenceRow>

      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="settings-gemini-page__auth-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authStatus.connected ? '切换 Google 账号' : '连接 Google 账号'}</DialogTitle>
            <DialogDescription>输入要绑定的 Google 账号邮箱，保存后会刷新当前 Gemini 认证状态。</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Label htmlFor="gemini-login-email">Google 账号邮箱</Label>
            <Input
              id="gemini-login-email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={authPending} onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button
              data-testid="gemini-login-confirm"
              type="button"
              disabled={authPending}
              onClick={() => void handleConfirm()}
            >
              {authPending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
