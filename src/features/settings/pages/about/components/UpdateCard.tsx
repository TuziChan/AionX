import { DownloadCloud, LoaderCircle } from 'lucide-react';
import { Button, PageSection, PageSectionContent, PageSectionDescription, PageSectionHeader, PageSectionTitle, Switch } from '@/shared/ui';
import type { UpdateCheckResult, UpdatePreferences } from '../types';

interface UpdateCardProps {
  checking: boolean;
  preferences: UpdatePreferences | null;
  savingPreference: boolean;
  updateResult: UpdateCheckResult | null;
  onCheck: () => void;
  onIncludePrereleaseChange: (includePrerelease: boolean) => void;
}

function resolveStatusTone(updateResult: UpdateCheckResult | null) {
  if (!updateResult) {
    return 'border-border/70 bg-background/60 text-muted-foreground';
  }

  if (updateResult.status === 'error') {
    return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300';
  }

  if (updateResult.updateAvailable) {
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300';
  }

  return 'border-border/70 bg-background/60 text-muted-foreground';
}

export function UpdateCard({
  checking,
  preferences,
  savingPreference,
  updateResult,
  onCheck,
  onIncludePrereleaseChange,
}: UpdateCardProps) {
  return (
    <PageSection
      padding="md"
      className="w-full bg-slate-50/82 dark:bg-slate-950/52"
      data-testid="about-update-card"
    >
      <PageSectionHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <PageSectionTitle className="text-base">应用更新</PageSectionTitle>
            <PageSectionDescription>检查新版本，并决定是否把预发布版本也纳入检测范围。</PageSectionDescription>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DownloadCloud className="size-5" />
          </div>
        </div>
      </PageSectionHeader>

      <PageSectionContent className="space-y-4">
        <Button
          data-testid="about-check-updates"
          variant="outline"
          disabled={checking}
          className="h-10 w-full rounded-2xl border-border/80 bg-background/80"
          onClick={onCheck}
        >
          {checking ? <LoaderCircle className="size-4 animate-spin" /> : null}
          检查更新
        </Button>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/65 px-4 py-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">包含预发布版本</div>
            <p className="text-xs leading-5 text-muted-foreground">开启后会一起检测 Beta、RC 等预发布渠道。</p>
          </div>
          <Switch
            checked={preferences?.includePrerelease ?? false}
            disabled={savingPreference || !preferences}
            aria-label="包含预发布版本"
            onCheckedChange={onIncludePrereleaseChange}
          />
        </div>

        {updateResult ? (
          <div className={`rounded-2xl border px-4 py-3 ${resolveStatusTone(updateResult)}`} data-testid="about-update-status">
            <div className="text-sm font-semibold text-foreground">
              {updateResult.updateAvailable ? `发现新版本 ${updateResult.latestVersion ?? ''}`.trim() : '更新检查结果'}
            </div>
            <div className="mt-2 text-sm leading-6">{updateResult.detail}</div>
            {updateResult.notes ? <div className="mt-2 text-sm leading-6">{updateResult.notes}</div> : null}
          </div>
        ) : null}
      </PageSectionContent>
    </PageSection>
  );
}
