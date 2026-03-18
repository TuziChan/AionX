import { createHashRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedOutlet } from './features/auth/components/ProtectedOutlet';
import { chatRoutes } from './features/chat';
import { settingsRoutes } from './features/settings';

export const router = createHashRouter([
  {
    path: '/login',
    lazy: () => import('./features/auth/LoginPage'),
  },
  {
    path: '/',
    element: <ProtectedOutlet />,
    children: [
      {
        element: <MainLayout sider={<Sidebar />} />,
        children: [
          {
            index: true,
            element: <Navigate to="/guid" replace />,
          },
          {
            path: 'guid',
            lazy: () => import('./features/guide/GuidePage'),
          },
          {
            path: 'cron',
            lazy: () => import('./features/cron/CronPage'),
          },
          {
            path: 'test/components',
            lazy: () => import('./features/test/ComponentsShowcasePage'),
          },
          ...chatRoutes,
          {
            path: '*',
            element: <Navigate to="/guid" replace />,
          },
        ],
      },
      ...settingsRoutes,
    ],
  },
]);
