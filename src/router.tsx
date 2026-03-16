import { createHashRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Sidebar } from './components/layout/Sidebar';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout sider={<Sidebar />} />,
    children: [
      {
        index: true,
        element: <Navigate to="/guide" replace />,
      },
      {
        path: 'guide',
        lazy: () => import('./features/guide/GuidePage'),
      },
      {
        path: 'chat/:id',
        lazy: () => import('./features/chat/ChatPage'),
      },
      {
        path: 'settings',
        lazy: () => import('./features/settings/components/SettingsLayout'),
        children: [
          {
            index: true,
            element: <Navigate to="/settings/gemini" replace />,
          },
          {
            path: 'gemini',
            lazy: () => import('./features/settings/pages/GeminiSettings'),
          },
          {
            path: 'model',
            lazy: () => import('./features/settings/pages/ModelSettings'),
          },
          {
            path: 'agent',
            lazy: () => import('./features/settings/pages/AgentSettings'),
          },
          {
            path: 'skills-hub',
            lazy: () => import('./features/settings/pages/SkillsHubSettings'),
          },
          {
            path: 'display',
            lazy: () => import('./features/settings/pages/DisplaySettings'),
          },
          {
            path: 'webui',
            lazy: () => import('./features/settings/pages/WebuiSettings'),
          },
          {
            path: 'system',
            lazy: () => import('./features/settings/pages/SystemSettings'),
          },
          {
            path: 'tools',
            lazy: () => import('./features/settings/pages/ToolsSettings'),
          },
          {
            path: 'about',
            lazy: () => import('./features/settings/pages/About'),
          },
        ],
      },
    ],
  },
]);
