import { Button, Input } from '@arco-design/web-react';
import { openPath } from '@tauri-apps/plugin-opener';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import type { RuntimeDirectoryDraft } from '../types';

interface RuntimeDirectoriesCardProps {
  runtimeInfo: RuntimeDirectoryDraft;
  saving: boolean;
  onPickDirectory: (field: 'cacheDir' | 'workDir') => void;
}

function DirectoryRow({
  actionLabel,
  actionTestId,
  description,
  inputId,
  label,
  onAction,
  value,
  disabled,
}: {
  actionLabel: string;
  actionTestId: string;
  description?: string;
  inputId: string;
  label: string;
  onAction: () => void;
  value: string;
  disabled: boolean;
}) {
  return (
    <PreferenceRow label={label} description={description}>
      <div className="settings-system-page__directory-control">
        <Input id={inputId} readOnly value={value} />
        <Button data-testid={actionTestId} disabled={disabled} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </PreferenceRow>
  );
}

export function RuntimeDirectoriesCard({ runtimeInfo, saving, onPickDirectory }: RuntimeDirectoriesCardProps) {
  return (
    <section className="settings-system-page__section" data-testid="system-runtime-card">
      <div className="settings-system-page__section-heading">
        <div className="settings-system-page__section-title">运行目录</div>
        <div className="settings-system-page__section-description">
          调整缓存与工作目录时会在保存后提示重启；日志目录保持只读，只提供快速打开入口。
        </div>
      </div>

      <div className="settings-system-page__section-body">
        <DirectoryRow
          actionLabel="选择"
          actionTestId="system-pick-cache-dir"
          description="用于缓存模型响应和临时文件。"
          disabled={saving}
          inputId="system-cache-dir"
          label="缓存目录"
          onAction={() => onPickDirectory('cacheDir')}
          value={runtimeInfo.cacheDir}
        />

        <DirectoryRow
          actionLabel="选择"
          actionTestId="system-pick-work-dir"
          description="用于工作流与运行时数据落盘。"
          disabled={saving}
          inputId="system-work-dir"
          label="工作目录"
          onAction={() => onPickDirectory('workDir')}
          value={runtimeInfo.workDir}
        />

        <DirectoryRow
          actionLabel="打开"
          actionTestId="system-open-log-dir"
          description="日志目录由系统维护，便于快速排查运行问题。"
          disabled={!runtimeInfo.logDir}
          inputId="system-log-dir"
          label="日志目录"
          onAction={() => void openPath(runtimeInfo.logDir)}
          value={runtimeInfo.logDir}
        />
      </div>
    </section>
  );
}
