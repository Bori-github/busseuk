import type { StationSearchResult } from '@entities/station';

interface SearchListProps {
  results: StationSearchResult[];
  isLoading: boolean;
  disabled?: boolean;
  onSelect: (station: StationSearchResult) => void;
}

export const SearchList = ({
  results,
  isLoading,
  disabled = false,
  onSelect,
}: SearchListProps) => {
  return (
    <div className="overflow-hidden">
      {!isLoading && results.length === 0 && (
        <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다</p>
      )}
      {!isLoading && results.length > 0 && (
        <ul>
          {results.map((station) => (
            <li key={station.arsId}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(station)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-800 disabled:pointer-events-none disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {station.stNm}
                  </p>
                  <p className="text-xs text-gray-400">
                    정류소 번호 {station.arsId}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
