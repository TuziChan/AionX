import classNames from 'classnames';
import { FolderOpen, History } from 'lucide-react';
import { Button, Input } from '@/shared/ui';

const workspaceItems = [
  { name: 'src', type: 'dir' },
  { name: 'components', type: 'dir' },
  { name: 'features', type: 'dir' },
  { name: 'styles', type: 'dir' },
  { name: 'docs/PLAN.md', type: 'file' },
  { name: 'README.md', type: 'file' },
];

export function ChatSidebar() {
  return (
    <div className="chat-workspace">
      <div className="workspace-toolbar-row">
        <div className="workspace-title-label">Workspace</div>
        <div className="workspace-toolbar-actions">
          <Button type="button" variant="ghost" size="icon" className="workspace-toolbar-icon-btn">
            <FolderOpen />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="workspace-toolbar-icon-btn">
            <History />
          </Button>
        </div>
      </div>
      <div className="workspace-toolbar-search">
        <Input className="workspace-search-input" placeholder="Search files" />
      </div>
      <div className="workspace-tree">
        {workspaceItems.map((item) => (
          <div key={item.name} className="workspace-tree__item">
            <span className={classNames('workspace-tree__dot', item.type === 'dir' && 'workspace-tree__dot--dir')} />
            <span className="workspace-tree__name">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
