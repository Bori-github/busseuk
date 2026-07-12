import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

import { QueryProvider } from './providers/QueryProvider';
import { router } from './router';

export const App = () => {
  return (
    <QueryProvider>
      {/* strict: 무거운 `motion` 대신 경량 `m` 컴포넌트만 허용해 번들을 최소화한다.
          domAnimation은 애니메이션·exit 기능만 포함(드래그·레이아웃 제외). */}
      <LazyMotion features={domAnimation} strict>
        {/* reducedMotion="user": OS의 '동작 줄이기' 설정 시 transform 애니메이션을 끄고
            opacity만 남긴다(정보 전달은 유지, 전정기관 자극만 제거). */}
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </LazyMotion>
      <Toaster position="top-center" richColors />
    </QueryProvider>
  );
};
