import { createContext, useContext } from 'react';

export type SheetState = 'peek' | 'full';

export const DRAG_THRESHOLD = 80;
export const PEEK_HEIGHT_RATIO = 0.5;
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
