import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';

/** 테스트용 QueryClient. 재시도를 꺼 결정적으로 동작하게 한다. */
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

/** render의 wrapper로 넘길 QueryClientProvider 래퍼를 만든다. */
export const createQueryWrapper = (
  queryClient: QueryClient = createTestQueryClient(),
) => {
  const QueryWrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return QueryWrapper;
};
