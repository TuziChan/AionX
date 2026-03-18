import { Input, Select, Switch } from '@arco-design/web-react';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import { LANGUAGE_OPTIONS } from '../types';

interface SystemBehaviorCardProps {
  closeToTray: boolean;
  cronNotificationEnabled: boolean;
  currentLanguage: string;
  notificationEnabled: boolean;
  savingCloseToTray: boolean;
  savingCronNotification: boolean;
  savingLanguage: boolean;
  savingNotification: boolean;
  systemInfoLabel: string;
  onCloseToTrayChange: (checked: boolean) => void;
  onCronNotificationChange: (checked: boolean) => void;
  onLanguageChange: (language: string) => void;
  onNotificationChange: (checked: boolean) => void;
}

export function SystemBehaviorCard({
  closeToTray,
  cronNotificationEnabled,
  currentLanguage,
  notificationEnabled,
  savingCloseToTray,
  savingCronNotification,
  savingLanguage,
  savingNotification,
  systemInfoLabel,
  onCloseToTrayChange,
  onCronNotificationChange,
  onLanguageChange,
  onNotificationChange,
}: SystemBehaviorCardProps) {
  return (
    <section className="settings-system-page__section" data-testid="system-behavior-card">
      <div className="settings-system-page__section-body">
        <PreferenceRow label="语言">
          <div data-testid="system-language-select">
            <Select
              disabled={savingLanguage}
              options={LANGUAGE_OPTIONS}
              value={currentLanguage}
              onChange={(value) => onLanguageChange(String(value))}
            />
          </div>
        </PreferenceRow>

        <PreferenceRow label="关闭窗口时最小化到托盘">
          <div data-testid="system-close-to-tray">
            <Switch checked={closeToTray} disabled={savingCloseToTray} onChange={onCloseToTrayChange} />
          </div>
        </PreferenceRow>

        <div className="settings-system-page__notification-block" data-testid="system-notification-card">
          <PreferenceRow
            label="通知"
            description="统一控制桌面通知与任务完成提醒。"
          >
            <div data-testid="system-notification-enabled">
              <Switch checked={notificationEnabled} disabled={savingNotification} onChange={onNotificationChange} />
            </div>
          </PreferenceRow>

          {notificationEnabled ? (
            <div className="settings-system-page__notification-children">
              <PreferenceRow label="任务完成通知">
                <div data-testid="system-cron-notification-enabled">
                  <Switch
                    checked={cronNotificationEnabled}
                    disabled={savingCronNotification}
                    onChange={onCronNotificationChange}
                  />
                </div>
              </PreferenceRow>
            </div>
          ) : null}
        </div>

        <PreferenceRow label="运行环境" description="当前应用运行时平台信息。">
          <Input id="system-info-label" readOnly value={systemInfoLabel} />
        </PreferenceRow>
      </div>
    </section>
  );
}
