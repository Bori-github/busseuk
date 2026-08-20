import type { SelectedRoute } from '@entities/bus';
import { getRouteTypeColor } from '@entities/bus';
import { XIcon } from '@shared/icons';

interface SelectedRouteTagListProps {
  routes: SelectedRoute[];
  onRemove: (route: SelectedRoute) => void;
  onReopen: (route: SelectedRoute) => void;
}

/**
 * 선택 노선을 검색창 하단에 태그로 노출. 시트가 닫혀도 해제할 수 있는 단일 진입점.
 * 노선번호 탭 → 그 노선을 고른 정류장 시트 재오픈. 선택이 없으면 렌더하지 않음.
 */
export const SelectedRouteTagList = ({ routes, onRemove, onReopen }: SelectedRouteTagListProps) => {
  if (routes.length === 0) return null;

  return (
    <ul className="flex gap-2 overflow-x-auto">
      {routes.map((route) => (
        <li
          key={route.busRouteId}
          className="flex shrink-0 items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: getRouteTypeColor(route.routeType) }}
        >
          <button type="button" onClick={() => onReopen(route)} aria-label={`${route.busRouteAbrv} 정류소 도착정보 다시 보기`}>
            {route.busRouteAbrv}
          </button>
          <button
            type="button"
            onClick={() => onRemove(route)}
            aria-label={`${route.busRouteAbrv} 노선 선택 해제`}
            className="flex h-4 w-4 items-center justify-center rounded-full bg-black/20 hover:bg-black/40"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
};
