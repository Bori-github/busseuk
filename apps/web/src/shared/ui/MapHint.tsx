import type { PropsWithChildren } from 'react';

/** 지도 위에 겹쳐 띄우는 한 줄 안내. 노출 조건은 쓰는 쪽에서 판단한다. */
export const MapHint = ({ children }: PropsWithChildren) => (
  <div className="self-center rounded-full bg-black/80 px-3 py-1.5 text-xs text-gray-300 shadow-md">{children}</div>
);
