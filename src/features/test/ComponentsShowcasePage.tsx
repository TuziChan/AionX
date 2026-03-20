import { useState } from 'react';
import { ContentPageFrame } from '@/app/layouts';
import { notify } from '@/shared/lib';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';

export function Component() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <ContentPageFrame pageClassName="components-page" width="wide">
      <PageHeader
        className="components-page__hero"
        eyebrow="Components"
        title="组件展示页"
        description="用于核查 Button、Badge、Accordion、Dialog、Tabs 和 sonner 是否已接入统一的 shadcn 组件体系。"
        eyebrowClassName="components-page__eyebrow"
        titleClassName="components-page__title"
        descriptionClassName="components-page__subtitle"
      />

      <div className="components-page__grid">
        <Card className="components-card">
          <CardHeader>
            <CardTitle>Toast</CardTitle>
            <CardDescription>统一验证 shared `notify` 是否已经接到 shadcn `sonner`。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => notify.info('Info Message')}>Info</Button>
            <Button variant="secondary" onClick={() => notify.success('Success Message')}>
              Success
            </Button>
            <Button variant="outline" onClick={() => notify.warning('Warning Message')}>
              Warning
            </Button>
            <Button variant="destructive" onClick={() => notify.error('Error Message')}>
              Error
            </Button>
          </CardContent>
        </Card>

        <Card className="components-card">
          <CardHeader>
            <CardTitle>Badge</CardTitle>
            <CardDescription>标签展示改回 shadcn `Badge` 的默认变体语义。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>

        <Card className="components-card">
          <CardHeader>
            <CardTitle>Accordion</CardTitle>
            <CardDescription>原来的 Collapse 改为 shadcn 官方 `Accordion`。</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="conversation">
              <AccordionItem value="conversation">
                <AccordionTrigger>Conversation Header</AccordionTrigger>
                <AccordionContent>标题、标签、操作按钮与分割线在这里统一演示。</AccordionContent>
              </AccordionItem>
              <AccordionItem value="workspace">
                <AccordionTrigger>Workspace Panel</AccordionTrigger>
                <AccordionContent>工作区树、搜索栏和工具按钮由同一视觉层控制。</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="components-card">
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>阶段状态用 shadcn `Tabs` 和 `Badge` 展示，而不是旧 `Steps`。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Tabs value={String(step)} onValueChange={(value) => setStep(Number(value))}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="1">Shell</TabsTrigger>
                <TabsTrigger value="2">Pages</TabsTrigger>
                <TabsTrigger value="3">Verify</TabsTrigger>
              </TabsList>
              <TabsContent value="1" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={step === 1 ? 'default' : 'outline'}>Current</Badge>
                共享壳层、导航与标题栏统一收口。
              </TabsContent>
              <TabsContent value="2" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={step === 2 ? 'default' : 'outline'}>Current</Badge>
                页面级基础组件替换为 shared shadcn primitives。
              </TabsContent>
              <TabsContent value="3" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={step === 3 ? 'default' : 'outline'}>Current</Badge>
                构建、桌面 smoke 与响应式 smoke 串行验收。
              </TabsContent>
            </Tabs>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))}>
                上一步
              </Button>
              <Button onClick={() => setStep((value) => Math.min(3, value + 1))}>下一步</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="components-card">
          <CardHeader>
            <CardTitle>Dialog</CardTitle>
            <CardDescription>弹窗验证改为 shadcn `Dialog` 默认组合结构。</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={visible} onOpenChange={setVisible}>
              <Button onClick={() => setVisible(true)}>打开弹窗</Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>视觉对齐弹窗</DialogTitle>
                  <DialogDescription>这里用于检查弹窗背景、圆角、阴影和按钮状态。</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setVisible(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setVisible(false)}>确认</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </ContentPageFrame>
  );
}

Component.displayName = 'ComponentsShowcasePage';
