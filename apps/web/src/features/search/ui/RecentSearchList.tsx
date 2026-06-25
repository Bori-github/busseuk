import type { RecentSearchItem } from '../model/types';
import { StationSearchItem } from './StationSearchItem';

interface RecentSearchListProps {
  items: RecentSearchItem[];
  onSelect: (item: RecentSearchItem) => void;
}

const renderItem = (
  item: RecentSearchItem,
  onSelect: (item: RecentSearchItem) => void,
) => {
  switch (item.type) {
    case 'station':
      return (
        <StationSearchItem
          key={`station:${item.arsId}`}
          stNm={item.stNm}
          arsId={item.arsId}
          onClick={() => onSelect(item)}
        />
      );
    case 'route':
      return null;
  }
};

export const RecentSearchList = ({
  items,
  onSelect,
}: RecentSearchListProps) => {
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden">
      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400">
        최근 검색
      </p>
      <ul>{items.map((item) => renderItem(item, onSelect))}</ul>
    </div>
  );
};
