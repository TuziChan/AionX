import { createHashRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedLayout } from './features/auth/components/ProtectedLayout';
import { chatRoutes } from './features/chat';
import { settingsRoutes } from './features/settings';

export const router = createHashRouter([
  {
    path: '/login',
    lazy: () => import('./features/auth/LoginPage'),
  },
  {
    path: '/',
    element: (
      <ProtectedLayout>
        <MainLayout sider={<Sidebar />} />
      </ProtectedLayout>
    ),
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
      ...settingsRoutes,
      {
        path: '*',
        element: <Navigate to="/guid" replace />,
      },
    ],
  },
]);
