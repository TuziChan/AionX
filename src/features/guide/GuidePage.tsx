import {
  Bot,
  Code2,
  Compass,
  LoaderCircle,
  MonitorUp,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { startTransition, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContentPageFrame } from '@/app/layouts';
import { cn, notify } from '@/shared/lib';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/ui';
import { useChatStore } from '../chat/stores/chatStore';

const agentOptions = [
  { key: 'acp', label: 'Claude Code', tone: 'blue' as const, description: '偏代码执行与本地工具链' },
  { key: 'codex', label: 'Codex', tone: 'green' as const, description: '偏工程改造与终端执行' },
  { key: 'gemini', label: 'Gemini', tone: 'purple' as const, description: '偏多模态与快速规划' },
  { key: 'nanobot', label: 'Nanobot', tone: 'orangered' as const, description: '偏轻量自动化与脚本' },
  { key: 'openclaw', label: 'OpenClaw', tone: 'gold' as const, description: '偏系统巡检与工作流' },
];

const quickActions = [
  {
    title: '重构设置页',
    prompt: '请按照 AionUi 风格重构当前设置页布局，优先统一标题、卡片、分组与移动端导航。',
  },
  {
    title: '检查差异',
    prompt: '请对比当前页面与 AionUi 的视觉差异，并输出需要先修复的 5 个高优先级项。',
  },
  {
    title: '补全截图页',
    prompt: '请补全登录页、Cron 页和组件展示页，确保截图基线覆盖这些页面。',
  },
  {
    title: '生成计划',
    prompt: '基于当前代码结构生成下一阶段实施计划，按壳层、路由、页面和验收拆分。',
  },
];

const modelOptions = [
  'claude-sonnet-4',
  'gpt-5-codex',
  'gemini-2.5-pro',
  'deepseek-r1',
];

export function Component() {
  const navigate = useNavigate();
  const createChat = useChatStore((state) => state.createChat);
  const [selectedAgent, setSelectedAgent] = useState(agentOptions[0].key);
  const [selectedModel, setSelectedModel] = useState(modelOptions[0]);
  const [workspace, setWorkspace] = useState('F:/Work/AionX');
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedAgentInfo = useMemo(
    () => agentOptions.find((item) => item.key === selectedAgent) ?? agentOptions[0],
    [selectedAgent]
  );

  const handleLaunchConversation = async () => {
    const text = prompt.trim();
    if (!text) {
      notify.warning('请输入一个任务，再进入会话。');
      return;
    }

    setSubmitting(true);

    try {
      const chat = await createChat(text.slice(0, 36), selectedAgent, selectedModel);
      navigate(`/conversation/${chat.id}`, {
        state: {
          seedPrompt: text,
          seedWorkspace: workspace,
          seedModel: selectedModel,
          seedAgent: selectedAgent,
        },
      });
      return;
    } catch (error) {
      console.error('Failed to create chat:', error);
      navigate('/conversation/demo', {
        state: {
          seedPrompt: text,
          seedWorkspace: workspace,
          seedModel: selectedModel,
          seedAgent: selectedAgent,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ContentPageFrame pageClassName="guid-page" width="wide">
      <PageHeader
        className="guid-page__hero"
        eyebrow="Guided Workspace"
        title="用统一视觉入口发起新的工作流"
        description="这里对齐 AionUi 的 Guide 结构: Agent Pill、输入卡、快捷动作、模型选择与工作区提示全部放在一个统一入口中。"
        eyebrowClassName="guid-page__eyebrow"
        titleClassName="guid-page__title"
        descriptionClassName="guid-page__subtitle"
      />

      <ToggleGroup
        type="single"
        value={selectedAgent}
        onValueChange={(value) => {
          if (!value) {
            return;
          }

          startTransition(() => setSelectedAgent(value));
        }}
        className="guid-agent-bar"
      >
        {agentOptions.map((agent) => (
          <ToggleGroupItem
            key={agent.key}
            value={agent.key}
            aria-label={`选择 ${agent.label}`}
            className="guid-agent-pill h-auto"
          >
            <span className="guid-agent-pill__title">{agent.label}</span>
            <span className="guid-agent-pill__meta">{agent.description}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Card className="guid-input-card border-white/60 bg-white/85 shadow-[0_28px_72px_rgba(17,24,39,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-950/90">
        <CardHeader className="guid-input-card__header p-0">
          <div>
            <div className="guid-input-card__label">当前 Agent</div>
            <div className="guid-input-card__agent">
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-200">
                {selectedAgentInfo.label}
              </Badge>
              <span className="text-sm text-t-secondary">{selectedAgentInfo.description}</span>
            </div>
          </div>
          <div className="guid-input-card__selectors">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="guid-select">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {modelOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              className="guid-input-card__workspace"
              value={workspace}
              onChange={(event) => setWorkspace(event.target.value)}
              placeholder="Workspace path"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-6">
          <Textarea
            className="guid-input-card__textarea"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={`给 ${selectedAgentInfo.label} 一个清晰任务，例如：对比 AionUi 与 AionX 的 Conversation 页面结构并给出实施顺序`}
            rows={7}
          />
        </CardContent>

        <CardFooter className="guid-input-card__footer p-0 pt-6">
          <div className="guid-input-card__actions">
            <Badge variant="outline" className="guid-chip">
              <Compass data-icon="inline-start" />
              工作区已连接
            </Badge>
            <Badge variant="outline" className="guid-chip">
              <Code2 data-icon="inline-start" />
              模型: {selectedModel}
            </Badge>
            <Badge variant="outline" className="guid-chip">
              <MonitorUp data-icon="inline-start" />
              预览面板默认可用
            </Badge>
          </div>
          <Button type="button" size="lg" onClick={handleLaunchConversation} disabled={submitting}>
            {submitting ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
            开始会话
          </Button>
        </CardFooter>
      </Card>

      <div className="guid-assistant-grid">
        {agentOptions.map((agent) => (
          <Card
            key={agent.key}
            className={cn('guid-assistant-card', selectedAgent === agent.key && 'guid-assistant-card--selected')}
          >
            <CardHeader className="p-0">
              <CardTitle className="guid-assistant-card__title">{agent.label}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-3">
              <p className="guid-assistant-card__text">{agent.description}</p>
            </CardContent>
            <CardFooter className="p-0">
              <Button type="button" variant="link" className="guid-assistant-card__action h-auto" onClick={() => setSelectedAgent(agent.key)}>
                <Bot data-icon="inline-start" />
                设为当前入口
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="guid-quick-actions">
        {quickActions.map((action) => (
          <Button
            key={action.title}
            type="button"
            variant="outline"
            className="guid-quick-actions__item h-auto justify-start whitespace-normal"
            onClick={() => {
              startTransition(() => setPrompt(action.prompt));
            }}
          >
            <span className="guid-quick-actions__icon">
              <Workflow />
            </span>
            <span className="guid-quick-actions__title">{action.title}</span>
          </Button>
        ))}
      </div>
    </ContentPageFrame>
  );
}

Component.displayName = 'GuidePage';
