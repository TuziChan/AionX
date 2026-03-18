import { Button, Divider, Switch, Typography } from '@arco-design/web-react';
import { IconGithub } from '@arco-design/web-react/icon';
import { useEffect, useMemo, useState } from 'react';
import packageJson from '../../../../package.json';

const links = [
  { title: '帮助文档', url: 'https://github.com/iOfficeAI/AionUi/wiki' },
  { title: '更新日志', url: 'https://github.com/iOfficeAI/AionUi/releases' },
  { title: '问题反馈', url: 'https://github.com/iOfficeAI/AionUi/issues' },
  { title: '联系作者', url: 'https://x.com/WailiVery' },
  { title: '官方网站', url: 'https://www.aionui.com' },
];

export function Component() {
  const [includePrerelease, setIncludePrerelease] = useState(false);
  const version = useMemo(() => packageJson.version, []);

  useEffect(() => {
    setIncludePrerelease(localStorage.getItem('update.includePrerelease') === 'true');
  }, []);

  return (
    <div className="settings-panel settings-panel--narrow">
      <div className="settings-about__hero">
        <Typography.Title heading={3} className="settings-about__title">
          AionX
        </Typography.Title>
        <Typography.Text className="settings-about__desc">
          保持与 AionUi 一致的设置结构与内容组织，页面模式下只替换容器，不改变信息架构。
        </Typography.Text>
        <div className="settings-about__meta">
          <span className="settings-about__version">v{version}</span>
          <button
            type="button"
            className="settings-about__github"
            onClick={() => window.open('https://github.com/TuziChan/AionX', '_blank', 'noopener,noreferrer')}
          >
            <IconGithub />
          </button>
        </div>
        <div className="settings-about__update-card">
          <Button type="primary" long>
            检查更新
          </Button>
          <div className="settings-about__update-row">
            <Typography.Text className="settings-about__update-text">包含预发布版本</Typography.Text>
            <Switch
              size="small"
              checked={includePrerelease}
              onChange={(value) => {
                setIncludePrerelease(value);
                localStorage.setItem('update.includePrerelease', String(value));
              }}
            />
          </div>
        </div>
      </div>

      <Divider className="settings-about__divider" />

      <div className="settings-about__links">
        {links.map((item) => (
          <button
            key={item.title}
            type="button"
            className="settings-about__link"
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          >
            <span>{item.title}</span>
            <span className="settings-about__link-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

Component.displayName = 'AboutSettings';
