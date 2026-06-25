import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRecentSearches } from '../model/useRecentSearches';
import { SearchList } from './SearchList';

import { getStationsByNameQueryOptions } from '@entities/station';

import type { StationSearchResult } from '@entities/station';
import { useDebounce } from '@shared/lib';
import { InputSearch } from '@shared/ui';
import { ChevronLeftIcon } from '@shared/icons';

interface SearchOverlayProps {
  onClose: () => void;
  onSelect: (station: StationSearchResult) => void;
}

export const SearchOverlay = ({ onClose, onSelect }: SearchOverlayProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { addRecentSearch } = useRecentSearches();

  const hasQuery = debouncedQuery.trim().length >= 2;
  const isQuerySettled = query.trim() === debouncedQuery.trim();

  const { data: results = [], isFetching, isPlaceholderData, isLoading } =
    useQuery({
      ...getStationsByNameQueryOptions(debouncedQuery),
      enabled: hasQuery,
      placeholderData: keepPreviousData,
    });

  const canSelect =
    hasQuery &&
    isQuerySettled &&
    !isFetching &&
    !isPlaceholderData &&
    results.length > 0;

  const handleSelectStation = (station: StationSearchResult) => {
    addRecentSearch({ type: 'station', ...station });
    onSelect(station);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canSelect) {
      handleSelectStation(results[0]);
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black text-white">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <InputSearch
          leadingButton={
            <button type="button" onClick={onClose}>
              <ChevronLeftIcon className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          onKeyDown={handleKeyDown}
          placeholder="정류소 검색"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {hasQuery && (
          <SearchList
            results={results}
            isLoading={isLoading}
            disabled={!canSelect}
            onSelect={handleSelectStation}
          />
        )}
      </div>
    </div>
  );
};
