import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@shared/lib';

import {
  BottomSheetContext,
  DRAG_THRESHOLD,
  PEEK_HEIGHT_RATIO,
  SHEET_EASING,
  SHEET_TRANSITION,
  type BottomSheetContextValue,
  type SheetState,
} from './context';

export interface BottomSheetRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 닫힘 애니메이션 완료 후 호출 */
  onClose?: () => void;
  children: ReactNode;
  /** peek 상태일 때 높이 (px). 미지정 시 50vh */
  peekHeight?: number;
  /** 시트 패널에 추가할 클래스 (배경 등 테마 오버라이드) */
  className?: string;
  /** 드래그 핸들에 추가할 클래스 */
  handleClassName?: string;
}

export const BottomSheetRoot = ({
  open,
  onOpenChange,
  onClose,
  children,
  peekHeight,
  className,
  handleClassName,
}: BottomSheetRootProps) => {
  const titleId = useId();
  const [prevOpen, setPrevOpen] = useState(open);
  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [isDragging, setIsDragging] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [dragTranslateY, setDragTranslateY] = useState(() => (open ? 0 : typeof window !== 'undefined' ? window.innerHeight : 800));

  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startStateRef = useRef<SheetState>('peek');
  const isDraggingRef = useRef(false);
  const dragHeightRef = useRef<number | null>(null);

  const peekH = Math.min(peekHeight ?? viewportHeight * PEEK_HEIGHT_RATIO, viewportHeight);
  const fullH = viewportHeight;
  const snapMidpoint = peekH + (fullH - peekH) / 2;

  const restingHeight = sheetState === 'full' ? fullH : peekH;
  const currentHeight = dragHeight ?? restingHeight;

  if (open !== prevOpen) {
    setPrevOpen(open);

    if (open) {
      setIsExiting(false);
      setIsOpening(true);
      setSheetState('peek');
      setIsDragging(false);
      setDragHeight(null);
    } else {
      setIsExiting(true);
      setIsOpening(false);
    }
  }

  useEffect(() => {
    const updateViewportHeight = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  useLayoutEffect(() => {
    if (!open || isExiting) return;

    isDraggingRef.current = false;
    dragHeightRef.current = null;

    let enterSlideUpFrameId = 0;
    const enterStartPaintFrameId = requestAnimationFrame(() => {
      const enterOffset = sheetRef.current?.getBoundingClientRect().height ?? peekH;
      setDragTranslateY(enterOffset);

      enterSlideUpFrameId = requestAnimationFrame(() => {
        setIsOpening(false);
        setDragTranslateY(0);
      });
    });

    return () => {
      cancelAnimationFrame(enterStartPaintFrameId);
      cancelAnimationFrame(enterSlideUpFrameId);
    };
  }, [open, isExiting, peekH]);

  useLayoutEffect(() => {
    if (!isExiting || open) return;

    const exitSlideDownFrameId = requestAnimationFrame(() => {
      const exitOffset = sheetRef.current?.getBoundingClientRect().height ?? peekH;
      setDragTranslateY(exitOffset);
    });

    return () => cancelAnimationFrame(exitSlideDownFrameId);
  }, [isExiting, open, peekH]);

  const resetDrag = useCallback(() => {
    isDraggingRef.current = false;
    dragHeightRef.current = null;
    setIsDragging(false);
    setDragHeight(null);

    if (open) {
      setDragTranslateY(0);
    }
  }, [open]);

  const requestClose = useCallback(() => {
    if (!open || isExiting || isOpening) return;
    onOpenChange(false);
  }, [open, isExiting, isOpening, onOpenChange]);

  const handleCloseTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (!isExiting || e.propertyName !== 'transform') return;

    setIsExiting(false);
    setDragTranslateY(viewportHeight);
    onClose?.();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!open || isExiting || isOpening) return;

    startYRef.current = e.clientY;
    startStateRef.current = sheetState;
    isDraggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || isExiting) return;

    const delta = e.clientY - startYRef.current;

    if (startStateRef.current === 'peek') {
      if (delta < 0) {
        const nextHeight = Math.min(fullH, peekH - delta);
        dragHeightRef.current = nextHeight;
        setDragHeight(nextHeight);
        setDragTranslateY(0);
        return;
      }

      dragHeightRef.current = peekH;
      setDragHeight(peekH);
      setDragTranslateY(delta);
      return;
    }

    const nextHeight = Math.max(peekH, fullH - delta);
    dragHeightRef.current = nextHeight;
    setDragHeight(nextHeight);
    setDragTranslateY(0);
  };

  const finishDrag = (rawDelta: number) => {
    const draggedHeight = dragHeightRef.current ?? restingHeight;

    if (startStateRef.current === 'peek') {
      if (rawDelta > DRAG_THRESHOLD) {
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragHeight(null);
        dragHeightRef.current = null;
        requestClose();
        return;
      }

      if (rawDelta < -DRAG_THRESHOLD || draggedHeight >= snapMidpoint) {
        setSheetState('full');
      } else {
        setSheetState('peek');
      }
    } else if (rawDelta > DRAG_THRESHOLD || draggedHeight <= snapMidpoint) {
      setSheetState('peek');
    } else {
      setSheetState('full');
    }

    resetDrag();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const rawDelta = e.clientY - startYRef.current;
    finishDrag(rawDelta);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = () => {
    if (isExiting) return;
    resetDrag();
  };

  const isFull = sheetState === 'full' && dragHeight === null;
  const showRoundedTop = !isFull || isDragging;
  const isInteractive = open && !isExiting && !isOpening;
  const skipTransition = isDragging || isOpening;

  const contextValue: BottomSheetContextValue = {
    titleId,
    requestClose,
    isInteractive,
  };

  return createPortal(
    <BottomSheetContext.Provider value={contextValue}>
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-10 bg-black/20 transition-opacity duration-300 ${open && !isExiting ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionTimingFunction: SHEET_EASING }}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="false"
        aria-hidden={!open}
        aria-labelledby={titleId}
        className={cn('fixed bottom-0 left-0 right-0 z-20 flex flex-col bg-white shadow-lg', className)}
        style={{
          height: `${currentHeight}px`,
          borderTopLeftRadius: showRoundedTop ? '1rem' : 0,
          borderTopRightRadius: showRoundedTop ? '1rem' : 0,
          transform: `translateY(${dragTranslateY}px)`,
          transition: skipTransition ? 'none' : SHEET_TRANSITION,
          pointerEvents: isInteractive ? 'auto' : 'none',
          visibility: open || isExiting ? 'visible' : 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleCloseTransitionEnd}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none select-none flex-col items-center pt-2 pb-1 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className={cn('h-1 w-10 rounded-full bg-gray-300', handleClassName)} aria-hidden />
        </div>

        {children}
      </div>
    </BottomSheetContext.Provider>,
    document.body,
  );
};
