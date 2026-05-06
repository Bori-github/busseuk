import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

import { QueryProvider } from './providers/QueryProvider';
import { router } from './router';

export const App = () => {
  return (
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </QueryProvider>
  );
};
