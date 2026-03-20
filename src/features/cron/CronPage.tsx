import { useState } from 'react';
import { ContentPageFrame } from '@/app/layouts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  PageHeader,
  Switch,
} from '@/shared/ui';

const cronJobs = [
  {
    id: 'daily-report',
    title: 'Daily Report',
    schedule: '每天 09:30',
    status: 'ACTIVE',
    description: '汇总最近一次构建、设置页差异和预览截图任务。',
  },
  {
    id: 'layout-audit',
    title: 'Layout Audit',
    schedule: '每周一 11:00',
    status: 'PAUSED',
    description: '扫描标题栏、侧栏和移动端遮罩的视觉回归。',
  },
  {
    id: 'screenshot-baseline',
    title: 'Screenshot Baseline',
    schedule: '每周五 18:00',
    status: 'ACTIVE',
    description: '对 Login / Guid / Conversation / Settings / Cron 做基线截图。',
  },
];

export function Component() {
  const [enabledJobs, setEnabledJobs] = useState<Record<string, boolean>>(
    Object.fromEntries(cronJobs.map((job) => [job.id, job.status === 'ACTIVE']))
  );

  return (
    <ContentPageFrame pageClassName="cron-page" width="wide">
      <PageHeader
        className="cron-page__hero"
        eyebrow="Automation"
        title="Cron 与定时任务页"
        description="对齐计划中的可见页面要求，提供稳定的任务列表、状态标识和快速操作区。"
        actions={
          <div className="cron-page__toolbar">
            <Button type="button">新建任务</Button>
            <Button type="button" variant="outline">
              导入任务
            </Button>
          </div>
        }
        eyebrowClassName="cron-page__eyebrow"
        titleClassName="cron-page__title"
        descriptionClassName="cron-page__subtitle"
      />

      <div className="cron-page__grid">
        {cronJobs.map((job) => (
          <Card key={job.id} className="cron-card">
            <CardHeader className="cron-card__header">
              <div>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>{job.schedule}</CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  enabledJobs[job.id]
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'border-border bg-muted text-muted-foreground'
                }
              >
                {enabledJobs[job.id] ? 'ACTIVE' : 'PAUSED'}
              </Badge>
            </CardHeader>
            <CardContent className="pb-0 pt-0">
              <p className="cron-card__description">{job.description}</p>
            </CardContent>
            <CardFooter className="cron-card__footer">
              <div className="cron-card__toggle">
                <span>启用</span>
                <Switch
                  checked={enabledJobs[job.id]}
                  onCheckedChange={(checked) =>
                    setEnabledJobs((current) => ({
                      ...current,
                      [job.id]: checked,
                    }))
                  }
                />
              </div>
              <Button type="button" size="sm" variant="outline">
                编辑
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </ContentPageFrame>
  );
}

Component.displayName = 'CronPage';
