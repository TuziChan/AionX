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
        lazy: () => import('./pages/gemini/page'),
      },
      {
        path: 'model',
        lazy: () => import('./pages/model/page'),
      },
      {
        path: 'agent',
        lazy: () => import('./pages/agent/page'),
      },
      {
        path: 'display',
        lazy: () => import('./pages/DisplaySettings'),
      },
      {
        path: 'webui',
        lazy: () => import('./pages/webui/page'),
      },
      {
        path: 'system',
        lazy: () => import('./pages/system/page'),
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
        lazy: () => import('./pages/extension/page'),
      },
    ],
  },
];
