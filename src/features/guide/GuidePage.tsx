import { Button, Input, Message, Select, Tag } from '@arco-design/web-react';
import { CompassOne, CodeBrackets, ListView, PreviewOpen } from '@icon-park/react';
import classNames from 'classnames';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      Message.warning('请输入一个任务，再进入会话。');
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
    <div className="guid-page size-full overflow-y-auto">
      <div className="guid-page__shell">
        <div className="guid-page__hero">
          <p className="guid-page__eyebrow">Guided Workspace</p>
          <h1 className="guid-page__title">用统一视觉入口发起新的工作流</h1>
          <p className="guid-page__subtitle">
            这里对齐 AionUi 的 Guide 结构: Agent Pill、输入卡、快捷动作、模型选择与工作区提示全部放在一个统一入口中。
          </p>
        </div>

        <div className="guid-agent-bar">
          {agentOptions.map((agent) => (
            <button
              key={agent.key}
              type="button"
              className={classNames('guid-agent-pill', selectedAgent === agent.key && 'guid-agent-pill--active')}
              onClick={() => setSelectedAgent(agent.key)}
            >
              <span className="guid-agent-pill__title">{agent.label}</span>
              <span className="guid-agent-pill__meta">{agent.description}</span>
            </button>
          ))}
        </div>

        <div className="guid-input-card">
          <div className="guid-input-card__header">
            <div>
              <div className="guid-input-card__label">当前 Agent</div>
              <div className="guid-input-card__agent">
                <Tag color={selectedAgentInfo.tone}>{selectedAgentInfo.label}</Tag>
                <span className="text-sm text-t-secondary">{selectedAgentInfo.description}</span>
              </div>
            </div>
            <div className="guid-input-card__selectors">
              <Select
                className="guid-select"
                size="large"
                value={selectedModel}
                onChange={(value) => setSelectedModel(String(value))}
                options={modelOptions.map((item) => ({ label: item, value: item }))}
              />
              <Input
                className="guid-input-card__workspace"
                size="large"
                value={workspace}
                onChange={setWorkspace}
                placeholder="Workspace path"
              />
            </div>
          </div>

          <Input.TextArea
            className="guid-input-card__textarea"
            value={prompt}
            onChange={setPrompt}
            placeholder={`给 ${selectedAgentInfo.label} 一个清晰任务，例如：对比 AionUi 与 AionX 的 Conversation 页面结构并给出实施顺序`}
            autoSize={{ minRows: 6, maxRows: 10 }}
          />

          <div className="guid-input-card__footer">
            <div className="guid-input-card__actions">
              <button type="button" className="guid-chip">
                <CompassOne theme="outline" size="16" />
                工作区已连接
              </button>
              <button type="button" className="guid-chip">
                <CodeBrackets theme="outline" size="16" />
                模型: {selectedModel}
              </button>
              <button type="button" className="guid-chip">
                <PreviewOpen theme="outline" size="16" />
                预览面板默认可用
              </button>
            </div>
            <Button type="primary" size="large" loading={submitting} onClick={handleLaunchConversation}>
              开始会话
            </Button>
          </div>
        </div>

        <div className="guid-assistant-grid">
          {agentOptions.map((agent) => (
            <div key={agent.key} className={classNames('guid-assistant-card', selectedAgent === agent.key && 'guid-assistant-card--selected')}>
              <div className="guid-assistant-card__title">{agent.label}</div>
              <p className="guid-assistant-card__text">{agent.description}</p>
              <button
                type="button"
                className="guid-assistant-card__action"
                onClick={() => setSelectedAgent(agent.key)}
              >
                设为当前入口
              </button>
            </div>
          ))}
        </div>

        <div className="guid-quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className="guid-quick-actions__item"
              onClick={() => setPrompt(action.prompt)}
            >
              <span className="guid-quick-actions__icon">
                <ListView theme="outline" size="16" />
              </span>
              <span className="guid-quick-actions__title">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'GuidePage';
