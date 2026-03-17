import { Navigate, type RouteObject } from 'react-router-dom';

export const settingsRoutes: RouteObject[] = [
  {
    path: 'settings',
    lazy: () => import('./layout/SettingsLayout'),
    children: [
      {
        index: true,
        element: <Navigate to="/settings/gemini" replace />,
      },
      {
        path: 'gemini',
        lazy: () => import('./pages/GeminiSettings'),
      },
      {
        path: 'model',
        lazy: () => import('./pages/model/page'),
      },
      {
        path: 'agent',
        lazy: () => import('./pages/AgentSettings'),
      },
      {
        path: 'display',
        lazy: () => import('./pages/DisplaySettings'),
      },
      {
        path: 'webui',
        lazy: () => import('./pages/WebuiSettings'),
      },
      {
        path: 'system',
        lazy: () => import('./pages/SystemSettings'),
      },
      {
        path: 'tools',
        lazy: () => import('./pages/tools/page'),
      },
      {
        path: 'about',
        lazy: () => import('./pages/About'),
      },
      {
        path: 'ext/:tabId',
        lazy: () => import('./pages/ExtensionSettings'),
      },
    ],
  },
];
