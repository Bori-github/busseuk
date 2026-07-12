import { m } from 'framer-motion';

import type { RecentSearchItem } from '../model/types';
import { StationSearchItem } from './StationSearchItem';
import { listVariants } from '@shared/lib';

interface RecentSearchListProps {
  items: RecentSearchItem[];
  onSelect: (item: RecentSearchItem) => void;
  onRemove: (item: RecentSearchItem) => void;
}

const renderItem = (item: RecentSearchItem, onSelect: (item: RecentSearchItem) => void, onRemove: (item: RecentSearchItem) => void) => {
  switch (item.type) {
    case 'station':
      return (
        <StationSearchItem
          key={`station:${item.arsId}`}
          stNm={item.stNm}
          arsId={item.arsId}
          onClick={() => onSelect(item)}
          onRemove={() => onRemove(item)}
        />
      );
    case 'route':
      return null;
  }
};

export const RecentSearchList = ({ items, onSelect, onRemove }: RecentSearchListProps) => {
  return (
    <div className="overflow-hidden">
      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400">최근 검색</p>
      {items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-gray-400 text-center">최근 검색 내역이 없습니다</p>
      ) : (
        <m.ul variants={listVariants(items.length)} initial="hidden" animate="visible">
          {items.map((item) => renderItem(item, onSelect, onRemove))}
        </m.ul>
      )}
    </div>
  );
};
