import { Modal, Button } from '@arco-design/web-react';
import { useAgentStore } from '../stores/agentStore';

interface Props {
  chatId: string;
}

export function PermissionDialog({ chatId }: Props) {
  const pending = useAgentStore((s) => s.pendingPermission);
  const approve = useAgentStore((s) => s.approvePermission);

  if (!pending) return null;

  return (
    <Modal
      visible
      title="Permission Request"
      closable={false}
      maskClosable={false}
      footer={[
        <Button key="deny" onClick={() => approve(chatId, pending.id, false)}>
          Deny
        </Button>,
        <Button key="allow" type="primary" onClick={() => approve(chatId, pending.id, true)}>
          Allow
        </Button>,
      ]}
    >
      <p className="text-sm text-t-primary whitespace-pre-wrap">
        {pending.description}
      </p>
    </Modal>
  );
}
