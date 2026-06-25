import { XIcon } from '@shared/icons';

interface StationSearchItemProps {
  stNm: string;
  arsId: string;
  disabled?: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

export const StationSearchItem = ({
  stNm,
  arsId,
  disabled,
  onClick,
  onRemove,
}: StationSearchItemProps) => (
  <li className="flex items-center hover:bg-gray-800">
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-1 items-center gap-3 px-4 py-3 text-left disabled:pointer-events-none disabled:opacity-50"
    >
      <div>
        <p className="text-sm font-semibold text-white">{stNm}</p>
        <p className="text-xs text-gray-400">정류소 번호 {arsId}</p>
      </div>
    </button>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="px-4 py-3"
        aria-label="최근 검색 삭제"
      >
        <XIcon className="h-4 w-4 text-gray-400" />
      </button>
    )}
  </li>
);
