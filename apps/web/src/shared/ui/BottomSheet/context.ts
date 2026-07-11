import { createContext, useContext } from 'react';

export type SheetState = 'peek' | 'full';

/** 손을 뗀 지점(관성 투사 포함)이 이 거리(px)를 넘으면 다음 상태로 넘어간다. */
export const DRAG_THRESHOLD = 80;
export const PEEK_HEIGHT_RATIO = 0.5;

/** 속도를 낼 때 참고할 최근 포인터 이동 구간(ms). 짧게 잡아야 '마지막 손놀림'이 반영된다. */
export const VELOCITY_WINDOW_MS = 100;

/**
 * 관성 투사 시간(ms). 손을 뗀 속도로 이만큼 더 갔을 지점을 목적지 판정에 쓴다.
 * 거리만 보면 짧고 빠른 플릭이 임계값에 못 미쳐 무시되므로, 속도를 거리로 환산해 더한다.
 */
export const FLING_PROJECTION_MS = 120;
export const SHEET_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
export const SHEET_TRANSITION = `height 0.3s ${SHEET_EASING}, border-top-left-radius 0.3s ${SHEET_EASING}, border-top-right-radius 0.3s ${SHEET_EASING}, transform 0.3s ${SHEET_EASING}`;

export interface BottomSheetContextValue {
  titleId: string;
  requestClose: () => void;
  isInteractive: boolean;
}

export const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export const useBottomSheetContext = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('BottomSheet compound components must be used within BottomSheet.');
  }
  return context;
};
