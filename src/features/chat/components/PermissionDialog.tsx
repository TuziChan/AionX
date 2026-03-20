import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui';
import { useAgentStore } from '../stores/agentStore';

interface Props {
  chatId: string;
}

export function PermissionDialog({ chatId }: Props) {
  const pending = useAgentStore((s) => s.pendingPermission);
  const approve = useAgentStore((s) => s.approvePermission);

  if (!pending) {
    return null;
  }

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permission Request</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-wrap">
            {pending.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => approve(chatId, pending.id, false)}>
            Deny
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => approve(chatId, pending.id, true)}>
            Allow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
