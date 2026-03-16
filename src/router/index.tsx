import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import { Sidebar } from '../components/layout';

// 临时占位页面
function HomePage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-t-primary mb-2">Welcome to AionX</h1>
        <p className="text-t-secondary">AI Agent Collaboration Platform</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-t-primary mb-2">Settings</h1>
        <p className="text-t-secondary">Configuration panel</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout sider={<Sidebar />} />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
