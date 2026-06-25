interface StationSearchItemProps {
  stNm: string;
  arsId: string;
  disabled?: boolean;
  onClick: () => void;
}

export const StationSearchItem = ({
  stNm,
  arsId,
  disabled,
  onClick,
}: StationSearchItemProps) => (
  <li>
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-800 disabled:pointer-events-none disabled:opacity-50"
    >
      <div>
        <p className="text-sm font-semibold text-white">{stNm}</p>
        <p className="text-xs text-gray-400">정류소 번호 {arsId}</p>
      </div>
    </button>
  </li>
);
