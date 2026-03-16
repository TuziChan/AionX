import { RouterProvider } from 'react-router-dom';
import { LayoutProvider } from './contexts/LayoutContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { router } from './router';
import './i18n'; // 初始化i18next

function App() {
  return (
    <LayoutProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </LayoutProvider>
  );
}

export default App;
