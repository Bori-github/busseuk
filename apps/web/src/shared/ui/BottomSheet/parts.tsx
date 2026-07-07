import type { ReactNode } from 'react';

import { cn } from '@shared/lib';
import { XIcon } from '@shared/icons';

import { useBottomSheetContext } from './context';

interface BottomSheetHeaderProps {
  children: ReactNode;
  className?: string;
}

interface BottomSheetTitleProps {
  children: ReactNode;
  className?: string;
}

interface BottomSheetCloseProps {
  className?: string;
}

interface BottomSheetContentProps {
  children: ReactNode;
  className?: string;
}

export const BottomSheetHeader = ({ children, className }: BottomSheetHeaderProps) => (
  <div className={cn('flex shrink-0 items-center justify-between gap-3 px-4 pt-1 pb-2', className)}>{children}</div>
);

export const BottomSheetTitle = ({ children, className }: BottomSheetTitleProps) => {
  const { titleId } = useBottomSheetContext();

  return (
    <h2 id={titleId} className={cn('min-w-0 flex-1 text-base font-bold', className)}>
      {children}
    </h2>
  );
};

export const BottomSheetClose = ({ className }: BottomSheetCloseProps) => {
  const { requestClose, isInteractive } = useBottomSheetContext();

  return (
    <button
      type="button"
      aria-label="바텀시트 닫기"
      disabled={!isInteractive}
      onClick={requestClose}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 disabled:pointer-events-none',
        className,
      )}
    >
      <XIcon className="h-4 w-4" />
    </button>
  );
};

export const BottomSheetContent = ({ children, className }: BottomSheetContentProps) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto', className)}>{children}</div>
);
