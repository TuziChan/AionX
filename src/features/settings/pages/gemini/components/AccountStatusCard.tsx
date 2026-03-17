import { Button, Form, Input, Modal, Tag } from '@arco-design/web-react';
import { useEffect, useState } from 'react';
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
      <section className="settings-group-card settings-gemini-page__hero-card" data-testid="gemini-account-card">
        <div className="settings-gemini-page__hero-content">
          <div className="settings-gemini-page__hero-copy">
            <div className="settings-group-card__title">Google 账号状态</div>
            <div className="settings-gemini-page__hero-title">
              {authStatus.connected ? authStatus.email ?? '已连接 Google 账号' : '还没有连接 Google 账号'}
            </div>
            <div className="settings-gemini-page__hero-subtitle">
              {authStatus.connected
                ? '账号状态、项目绑定和默认行为已经从旧的 prompt 流程迁到独立设置卡。'
                : '连接后会记录当前账号，并把 Project 绑定与默认行为保留在同一条真实设置链路里。'}
            </div>
          </div>

          <div className="settings-gemini-page__hero-actions">
            <Tag color={authStatus.connected ? 'green' : 'gray'}>{authStatus.connected ? '已连接' : '未连接'}</Tag>
            {authStatus.connected ? (
              <>
                <Input id="gemini-account-email" data-testid="gemini-account-email" value={authStatus.email ?? ''} readOnly />
                <Button loading={authPending} onClick={() => setModalVisible(true)}>
                  切换账号
                </Button>
                <Button loading={authPending} status="danger" onClick={() => void onDisconnectAccount()}>
                  退出账号
                </Button>
              </>
            ) : (
              <Button data-testid="gemini-login-button" type="primary" loading={authPending} onClick={() => setModalVisible(true)}>
                Google 登录
              </Button>
            )}
          </div>
        </div>
      </section>

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
