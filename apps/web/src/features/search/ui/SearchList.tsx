import { m } from 'framer-motion';

import { StationSearchItem } from './StationSearchItem';
import type { StationSearchResult } from '@entities/station';
import { listVariants } from '@shared/lib';

interface SearchListProps {
  results: StationSearchResult[];
  isLoading: boolean;
  disabled?: boolean;
  onSelect: (station: StationSearchResult) => void;
}

export const SearchList = ({ results, isLoading, disabled = false, onSelect }: SearchListProps) => {
  return (
    <div className="overflow-hidden">
      {!isLoading && results.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다</p>}
      {!isLoading && results.length > 0 && (
        <m.ul variants={listVariants(results.length)} initial="hidden" animate="visible">
          {results.map((station) => (
            <StationSearchItem
              key={station.arsId}
              stNm={station.stNm}
              arsId={station.arsId}
              disabled={disabled}
              onClick={() => onSelect(station)}
            />
          ))}
        </m.ul>
      )}
    </div>
  );
};
