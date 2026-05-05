import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { QueryProvider } from './providers/QueryProvider';

export const App = () => {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
};
