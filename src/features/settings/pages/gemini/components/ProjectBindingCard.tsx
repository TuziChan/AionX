import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import { Input } from '@/shared/ui';
import type { GeminiAuthStatus } from '../types';

interface ProjectBindingCardProps {
  authStatus: GeminiAuthStatus;
  cloudProject: string;
  onProjectChange: (value: string) => void;
}

export function ProjectBindingCard({ authStatus, cloudProject, onProjectChange }: ProjectBindingCardProps) {
  return (
    <PreferenceRow
      label="GOOGLE_CLOUD_PROJECT"
      description={
        authStatus.connected
          ? `当前 Project 会跟随账号 ${authStatus.email ?? ''} 保存，并在切回该账号时自动恢复。`
          : '未登录时也可以先填写默认 Project，登录后会转为当前账号的绑定值。'
      }
    >
      <Input
        id="gemini-project-id"
        value={cloudProject}
        onChange={(event) => onProjectChange(event.target.value)}
        placeholder="例如 aionx-prod"
      />
    </PreferenceRow>
  );
}
