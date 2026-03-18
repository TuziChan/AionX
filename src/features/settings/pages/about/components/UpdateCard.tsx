import { Button, Switch, Typography } from '@arco-design/web-react';
import type { UpdateCheckResult, UpdatePreferences } from '../types';

interface UpdateCardProps {
  checking: boolean;
  preferences: UpdatePreferences | null;
  savingPreference: boolean;
  updateResult: UpdateCheckResult | null;
  onCheck: () => void;
  onIncludePrereleaseChange: (includePrerelease: boolean) => void;
}

export function UpdateCard({
  checking,
  preferences,
  savingPreference,
  updateResult,
  onCheck,
  onIncludePrereleaseChange,
}: UpdateCardProps) {
  const statusTone =
    updateResult?.status === 'error'
      ? 'settings-about__update-status--error'
      : updateResult?.updateAvailable
        ? 'settings-about__update-status--highlight'
        : 'settings-about__update-status--neutral';

  return (
    <div className="settings-about__update-card" data-testid="about-update-card">
      <Button data-testid="about-check-updates" type="primary" long loading={checking} onClick={onCheck}>
        检查更新
      </Button>
      <div className="settings-about__update-row">
        <Typography.Text className="settings-about__update-text">包含预发布版本</Typography.Text>
        <Switch
          size="small"
          checked={preferences?.includePrerelease ?? false}
          disabled={savingPreference || !preferences}
          onChange={onIncludePrereleaseChange}
        />
      </div>
      {updateResult ? (
        <div className={`settings-about__update-status ${statusTone}`} data-testid="about-update-status">
          <div className="settings-about__update-status-title">
            {updateResult.updateAvailable
              ? `发现新版本 ${updateResult.latestVersion ?? ''}`.trim()
              : '更新检查结果'}
          </div>
          <div className="settings-about__update-status-text">{updateResult.detail}</div>
          {updateResult.notes ? <div className="settings-about__update-status-text">{updateResult.notes}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
