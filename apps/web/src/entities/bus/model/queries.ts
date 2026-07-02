import { queryOptions } from '@tanstack/react-query';

import { getBusPositions } from '../api/busPositionApi';
import { getRoutePath, searchBusRoutes } from '../api/busRouteApi';
import { busQueryKeys } from './queryKeys';

export const busRouteSearchQueryOptions = (routeName: string) =>
  queryOptions({
    queryKey: busQueryKeys.routeSearch(routeName),
    queryFn: () => searchBusRoutes(routeName),
    enabled: routeName.trim().length > 0,
    staleTime: 60_000,
  });

// enabled=false면 폴링을 완전히 멈춘다. 버스 마커가 보이지 않을 때(줌<17) 꺼서
// 공공데이터 호출 쿼터를 아낀다. 마커가 다시 보이면 즉시 재개된다.
export const busPositionsQueryOptions = (busRouteId: string, enabled = true) =>
  queryOptions({
    queryKey: busQueryKeys.position(busRouteId),
    queryFn: () => getBusPositions(busRouteId),
    enabled,
    staleTime: 0,
    // 서울 버스 위치 API는 약 5초 주기로 갱신되므로 폴링도 5초로 맞춘다.
    refetchInterval: 5_000,
    // refetchOnWindowFocus는 전역 기본값(true)을 따른다 — 포커스 복귀 시 즉시 갱신해
    // 백그라운드 동안 정지·throttle됐던 마커를 바로 최신화한다. 폴링은 enabled 게이팅
    // (버스 미노출 시 중단)으로 이미 제한돼 있어 추가 호출 부담은 미미하다.
  });

export const routePathQueryOptions = (busRouteId: string) =>
  queryOptions({
    queryKey: busQueryKeys.routePath(busRouteId),
    queryFn: () => getRoutePath(busRouteId),
    // 노선 경로는 매일 새벽 5시에만 갱신되므로 길게 캐싱한다.
    staleTime: 24 * 60 * 60 * 1000,
  });
