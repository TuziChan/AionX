import type { RouteObject } from 'react-router-dom';

export const chatRoutes: RouteObject[] = [
  {
    path: 'conversation/:id',
    lazy: () => import('./components/ChatSession'),
  },
];
