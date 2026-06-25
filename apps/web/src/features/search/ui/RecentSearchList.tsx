import type { RecentSearchItem, StationSearchItem } from '../model/types';

interface RecentSearchListProps {
  items: RecentSearchItem[];
  onSelect: (item: RecentSearchItem) => void;
}

const StationItem = ({
  item,
  onSelect,
}: {
  item: StationSearchItem;
  onSelect: (item: RecentSearchItem) => void;
}) => (
  <li>
    <button
      onClick={() => onSelect(item)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-800"
    >
      <div>
        <p className="text-sm font-semibold text-white">{item.stNm}</p>
        <p className="text-xs text-gray-400">정류소 번호 {item.arsId}</p>
      </div>
    </button>
  </li>
);

const renderItem = (
  item: RecentSearchItem,
  onSelect: (item: RecentSearchItem) => void,
) => {
  switch (item.type) {
    case 'station':
      return (
        <StationItem
          key={`station:${item.arsId}`}
          item={item}
          onSelect={onSelect}
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
