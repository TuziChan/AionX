import { Button, Card, Switch, Tag } from '@arco-design/web-react';
import { ContentPageFrame } from '@/app/layouts';
import { PageHeader } from '@/shared/ui';

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
  return (
    <ContentPageFrame pageClassName="cron-page" width="wide">
      <PageHeader
        className="cron-page__hero"
        eyebrow="Automation"
        title="Cron 与定时任务页"
        description="对齐计划中的可见页面要求，提供稳定的任务列表、状态标识和快速操作区。"
        actions={
          <div className="cron-page__toolbar">
            <Button type="primary">新建任务</Button>
            <Button type="outline">导入任务</Button>
          </div>
        }
        eyebrowClassName="cron-page__eyebrow"
        titleClassName="cron-page__title"
        descriptionClassName="cron-page__subtitle"
      />

      <div className="cron-page__grid">
        {cronJobs.map((job) => (
          <Card key={job.id} className="cron-card" bordered={false}>
            <div className="cron-card__header">
              <div>
                <h2>{job.title}</h2>
                <p>{job.schedule}</p>
              </div>
              <Tag color={job.status === 'ACTIVE' ? 'green' : 'gray'}>{job.status}</Tag>
            </div>
            <p className="cron-card__description">{job.description}</p>
            <div className="cron-card__footer">
              <div className="cron-card__toggle">
                <span>启用</span>
                <Switch checked={job.status === 'ACTIVE'} />
              </div>
              <Button size="small" type="outline">
                编辑
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </ContentPageFrame>
  );
}

Component.displayName = 'CronPage';
