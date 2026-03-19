import { Button, Card, Collapse, Message, Modal, Space, Steps, Tag } from '@arco-design/web-react';
import { useState } from 'react';
import { ContentPageFrame } from '@/app/layouts';
import { PageHeader } from '@/shared/ui';

export function Component() {
  const [messageApi, contextHolder] = Message.useMessage();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <ContentPageFrame pageClassName="components-page" width="wide">
      {contextHolder}
      <PageHeader
        className="components-page__hero"
        eyebrow="Components"
        title="组件展示页"
        description="用于核查按钮、Tag、Collapse、Message、Modal 和 Steps 是否已接入统一样式体系。"
        eyebrowClassName="components-page__eyebrow"
        titleClassName="components-page__title"
        descriptionClassName="components-page__subtitle"
      />

      <div className="components-page__grid">
        <Card className="components-card" bordered={false}>
          <h2>Message</h2>
          <Space wrap>
            <Button type="primary" onClick={() => void messageApi?.info?.('Info Message')}>
              Info
            </Button>
            <Button status="success" type="primary" onClick={() => void messageApi?.success?.('Success Message')}>
              Success
            </Button>
            <Button status="warning" type="primary" onClick={() => void messageApi?.warning?.('Warning Message')}>
              Warning
            </Button>
            <Button status="danger" type="primary" onClick={() => void messageApi?.error?.('Error Message')}>
              Error
            </Button>
          </Space>
        </Card>

        <Card className="components-card" bordered={false}>
          <h2>Tag</h2>
          <Space wrap>
            <Tag checkable color="blue">
              Blue
            </Tag>
            <Tag checkable color="green">
              Green
            </Tag>
            <Tag checkable color="red">
              Red
            </Tag>
            <Tag checkable color="orange">
              Orange
            </Tag>
          </Space>
        </Card>

        <Card className="components-card" bordered={false}>
          <h2>Collapse</h2>
          <Collapse defaultActiveKey={['1']}>
            <Collapse.Item header="Conversation Header" name="1">
              标题、标签、操作按钮与分割线在这里统一演示。
            </Collapse.Item>
            <Collapse.Item header="Workspace Panel" name="2">
              工作区树、搜索栏和工具按钮由同一视觉层控制。
            </Collapse.Item>
          </Collapse>
        </Card>

        <Card className="components-card" bordered={false}>
          <h2>Steps</h2>
          <Steps current={step} size="small">
            <Steps.Step title="Shell" />
            <Steps.Step title="Pages" />
            <Steps.Step title="Verify" />
          </Steps>
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setStep((value) => Math.max(1, value - 1))}>上一步</Button>
            <Button type="primary" onClick={() => setStep((value) => Math.min(3, value + 1))}>
              下一步
            </Button>
          </Space>
        </Card>

        <Card className="components-card" bordered={false}>
          <h2>Modal</h2>
          <Button type="primary" onClick={() => setVisible(true)}>
            打开弹窗
          </Button>
          <Modal
            visible={visible}
            title="视觉对齐弹窗"
            onCancel={() => setVisible(false)}
            onOk={() => setVisible(false)}
          >
            这里用于检查弹窗背景、圆角、阴影和按钮状态。
          </Modal>
        </Card>
      </div>
    </ContentPageFrame>
  );
}

Component.displayName = 'ComponentsShowcasePage';
