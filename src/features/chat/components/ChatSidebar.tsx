import { FolderOpen, History } from '@icon-park/react';
import classNames from 'classnames';

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
          <button type="button" className="workspace-toolbar-icon-btn">
            <FolderOpen theme="outline" size="16" />
          </button>
          <button type="button" className="workspace-toolbar-icon-btn">
            <History theme="outline" size="16" />
          </button>
        </div>
      </div>
      <div className="workspace-toolbar-search">
        <input className="workspace-search-input" placeholder="Search files" />
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
