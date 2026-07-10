import { m } from 'framer-motion';

import { XIcon } from '@shared/icons';
import { TAP_SCALE, listItemVariants } from '@shared/lib';

interface StationSearchItemProps {
  stNm: string;
  arsId: string;
  disabled?: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

export const StationSearchItem = ({ stNm, arsId, disabled, onClick, onRemove }: StationSearchItemProps) => (
  <m.li variants={listItemVariants} className="flex items-center hover:bg-gray-800">
    <m.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={TAP_SCALE}
      className="flex flex-1 items-center gap-3 px-4 py-3 text-left disabled:pointer-events-none disabled:opacity-50"
    >
      <div>
        <p className="text-sm font-semibold text-white">{stNm}</p>
        <p className="text-xs text-gray-400">정류소 번호 {arsId}</p>
      </div>
    </m.button>
    {onRemove && (
      <m.button type="button" onClick={onRemove} whileTap={TAP_SCALE} className="px-4 py-3" aria-label="최근 검색 삭제">
        <XIcon className="h-4 w-4 text-gray-400" />
      </m.button>
    )}
  </m.li>
);
