import { Button, Input } from '@arco-design/web-react';
import { openPath } from '@tauri-apps/plugin-opener';
import { PreferenceRow } from '@/features/settings/components/PreferenceRow';
import type { RuntimeDirectoryDraft } from '../types';

interface RuntimeDirectoriesCardProps {
  runtimeInfo: RuntimeDirectoryDraft;
  saving: boolean;
  onPickDirectory: (field: 'cacheDir' | 'workDir') => void;
}

export function RuntimeDirectoriesCard({ runtimeInfo, saving, onPickDirectory }: RuntimeDirectoriesCardProps) {
  return (
    <section className="settings-group-card" data-testid="system-runtime-card">
      <div className="settings-group-card__body">
        <PreferenceRow label="缓存目录">
          <div className="settings-inline-actions settings-inline-actions--compact">
            <Input id="system-cache-dir" readOnly value={runtimeInfo.cacheDir} />
            <Button data-testid="system-pick-cache-dir" disabled={saving} onClick={() => onPickDirectory('cacheDir')}>
              选择
            </Button>
          </div>
        </PreferenceRow>
        <PreferenceRow label="工作目录">
          <div className="settings-inline-actions settings-inline-actions--compact">
            <Input id="system-work-dir" readOnly value={runtimeInfo.workDir} />
            <Button data-testid="system-pick-work-dir" disabled={saving} onClick={() => onPickDirectory('workDir')}>
              选择
            </Button>
          </div>
        </PreferenceRow>
        <PreferenceRow label="日志目录">
          <div className="settings-inline-actions settings-inline-actions--compact">
            <Input id="system-log-dir" readOnly value={runtimeInfo.logDir} />
            <Button
              data-testid="system-open-log-dir"
              disabled={!runtimeInfo.logDir}
              onClick={() => void openPath(runtimeInfo.logDir)}
            >
              打开
            </Button>
          </div>
        </PreferenceRow>
      </div>
    </section>
  );
}
