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

export const busPositionsQueryOptions = (busRouteId: string) =>
  queryOptions({
    queryKey: busQueryKeys.position(busRouteId),
    queryFn: () => getBusPositions(busRouteId),
    staleTime: 0,
    refetchInterval: 15_000,
  });

export const routePathQueryOptions = (busRouteId: string) =>
  queryOptions({
    queryKey: busQueryKeys.routePath(busRouteId),
    queryFn: () => getRoutePath(busRouteId),
    // 노선 경로는 매일 새벽 5시에만 갱신되므로 길게 캐싱한다.
    staleTime: 24 * 60 * 60 * 1000,
  });
