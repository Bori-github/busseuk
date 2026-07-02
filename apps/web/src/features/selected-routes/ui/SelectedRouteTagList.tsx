import type { SelectedRoute } from '@entities/bus';
import { getRouteTypeColor } from '@entities/bus';
import { XIcon } from '@shared/icons';

interface SelectedRouteTagListProps {
  routes: SelectedRoute[];
  onRemove: (route: SelectedRoute) => void;
}

/**
 * 선택된 노선을 검색창 하단에 태그(노선번호 + 제거 버튼)로 노출한다.
 * 바텀시트가 닫혀도 선택 상태를 유지·해제할 수 있는 단일 진입점.
 * 선택된 노선이 없으면 아무것도 렌더링하지 않는다.
 */
export const SelectedRouteTagList = ({
  routes,
  onRemove,
}: SelectedRouteTagListProps) => {
  if (routes.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {routes.map((route) => (
        <li
          key={route.busRouteId}
          className="flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1.5 text-xs font-bold text-white shadow-md"
          style={{ backgroundColor: getRouteTypeColor(route.routeType) }}
        >
          <span>{route.busRouteAbrv}</span>
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
