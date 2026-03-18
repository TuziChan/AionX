import { Button, Form, Input, Modal } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
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
            <Button loading={authPending} onClick={() => setModalVisible(true)}>
              切换账号
            </Button>
            <Button loading={authPending} status="danger" onClick={() => void onDisconnectAccount()}>
              退出
            </Button>
          </div>
        ) : (
          <Button
            data-testid="gemini-login-button"
            type="primary"
            loading={authPending}
            onClick={() => setModalVisible(true)}
          >
            Google 登录
          </Button>
        )}
      </PreferenceRow>

      <Modal
        visible={modalVisible}
        className="settings-gemini-page__auth-modal"
        title={authStatus.connected ? '切换 Google 账号' : '连接 Google 账号'}
        onCancel={() => setModalVisible(false)}
        onOk={() => void handleConfirm()}
        okButtonProps={{ loading: authPending }}
        unmountOnExit
      >
        <Form layout="vertical">
          <Form.Item label="Google 账号邮箱">
            <Input
              id="gemini-login-email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
