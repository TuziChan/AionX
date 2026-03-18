import { Alert, Divider, Typography } from '@arco-design/web-react';
import { IconGithub } from '@arco-design/web-react/icon';
import { openUrl as openExternal } from '@tauri-apps/plugin-opener';
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
    <div className="settings-panel settings-panel--narrow">
      <div className="settings-about__shell">
        <div className="settings-about__hero" data-testid="about-hero">
          <div className="settings-about__hero-copy">
            <Typography.Title heading={3} className="settings-about__title">
              {metadata?.appName ?? 'AionX'}
            </Typography.Title>
            <Typography.Text className="settings-about__desc">
              查看当前版本、更新偏好与常用资源入口。
            </Typography.Text>
            <div className="settings-about__meta">
              <span className="settings-about__version">v{metadata?.version ?? '0.0.0'}</span>
              <button
                type="button"
                className="settings-about__github"
                aria-label="打开源码仓库"
                onClick={() => void openExternal(metadata?.repositoryUrl ?? 'https://github.com/TuziChan/AionX')}
              >
                <IconGithub />
              </button>
            </div>
          </div>

          <UpdateCard
            checking={checking}
            preferences={preferences}
            savingPreference={savingPreference}
            updateResult={updateResult}
            onCheck={() => void runUpdateCheck()}
            onIncludePrereleaseChange={(value) => void updateIncludePrerelease(value)}
          />
        </div>

        <Divider className="settings-about__divider" />

        <div className="settings-about__links" data-testid="about-links">
          {links.map((item) => (
            <button
              key={item.title}
              type="button"
              className="settings-about__link"
              onClick={() => void openExternal(item.url)}
            >
              <span>{item.title}</span>
              <span className="settings-about__link-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="settings-about__status-list">
          {error ? <Alert type="error" content={error} /> : null}
          {loading ? <Alert type="info" content="正在加载关于页信息..." /> : null}
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'AboutSettings';
