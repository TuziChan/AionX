import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './app/providers';
import { LayoutProvider } from './contexts/LayoutContext';
import { router } from './router';
import './i18n'; // 初始化i18next

function App() {
  return (
    <LayoutProvider>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </LayoutProvider>
  );
}

export default App;
