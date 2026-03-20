import { ArrowUpRight, Github } from 'lucide-react';
import { openUrl as openExternal } from '@tauri-apps/plugin-opener';
import { AppLogoMark } from '@/widgets/app-frame';
import { Alert, AlertDescription, Button, PageHeader, PageSection, Separator, SettingsPage, SettingsPageStack } from '@/shared/ui';
import { UpdateCard } from './components/UpdateCard';
import { useAboutSettings } from './hooks/useAboutSettings';

export function Component() {
  const {
    checking,
    error,
    links,
    loading,
    metadata,
    preferences,
    savingPreference,
    updateIncludePrerelease,
    updateResult,
    runUpdateCheck,
  } = useAboutSettings();

  return (
    <SettingsPage className="settings-about-page">
      <SettingsPageStack>
        <PageSection
          className="items-center border-border/70 bg-card/78 text-center"
          data-testid="about-hero"
        >
          <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-5 text-center">
            <AppLogoMark size="lg" />
            <PageHeader
              align="center"
              title={metadata?.appName ?? 'AionX'}
              description="查看当前版本、更新偏好与常用资源入口。"
              titleClassName="text-[28px] md:text-[30px]"
              descriptionClassName="max-w-[420px]"
            />

            <div className="flex items-center justify-center gap-3">
              <span className="rounded-full border border-border/70 bg-background/65 px-3 py-1.5 text-sm font-medium text-foreground">
                v{metadata?.version ?? '0.0.0'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="打开源码仓库"
                onClick={() => void openExternal(metadata?.repositoryUrl ?? 'https://github.com/TuziChan/AionX')}
              >
                <Github className="size-4" />
              </Button>
            </div>
          </div>
        </PageSection>

        <div className="mx-auto w-full max-w-[560px]">
          <UpdateCard
            checking={checking}
            preferences={preferences}
            savingPreference={savingPreference}
            updateResult={updateResult}
            onCheck={() => void runUpdateCheck()}
            onIncludePrereleaseChange={(value) => void updateIncludePrerelease(value)}
          />
        </div>

        <PageSection padding="md">
          <div className="mx-auto w-full max-w-[560px] space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">常用资源</h2>
              <p className="text-sm leading-6 text-muted-foreground">所有链接继续通过 typed metadata 注入，便于后续统一维护。</p>
            </div>

            <Separator />

            <div className="flex flex-col gap-2" data-testid="about-links">
              {links.map((item) => (
                <Button
                  key={item.title}
                  type="button"
                  variant="ghost"
                  className="h-auto justify-between rounded-2xl border border-transparent px-4 py-3 text-left hover:border-border/70 hover:bg-muted/50"
                  onClick={() => void openExternal(item.url)}
                >
                  <span>{item.title}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </div>
        </PageSection>

        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {loading ? (
            <Alert>
              <AlertDescription>正在加载关于页信息...</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </SettingsPageStack>
    </SettingsPage>
  );
}

Component.displayName = 'AboutSettings';
