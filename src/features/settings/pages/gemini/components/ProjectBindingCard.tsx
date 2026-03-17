import { Input } from '@arco-design/web-react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import type { GeminiAuthStatus } from '../types';

interface ProjectBindingCardProps {
  authStatus: GeminiAuthStatus;
  cloudProject: string;
  onProjectChange: (value: string) => void;
}

export function ProjectBindingCard({ authStatus, cloudProject, onProjectChange }: ProjectBindingCardProps) {
  return (
    <section className="settings-group-card" data-testid="gemini-project-card">
      <div className="settings-gemini-page__section-header">
        <div>
          <div className="settings-group-card__title">项目绑定</div>
          <div className="settings-gemini-page__section-subtitle">
            {authStatus.connected
              ? `当前 Project 会跟随账号 ${authStatus.email ?? ''} 保存，下次切回这个账号时自动恢复。`
              : '可以先填写默认 Project，也可以在连接 Google 账号后为当前账号单独绑定。'}
          </div>
        </div>
      </div>

      <div className="settings-group-card__body">
        <PreferenceRow
          label="GOOGLE_CLOUD_PROJECT"
          description="填写当前账号对应的 GCP Project ID。账号切换后会自动读取该账号已保存的绑定值。"
        >
          <Input
            id="gemini-project-id"
            value={cloudProject}
            onChange={onProjectChange}
            placeholder="例如 aionx-prod"
          />
        </PreferenceRow>
      </div>
    </section>
  );
}
