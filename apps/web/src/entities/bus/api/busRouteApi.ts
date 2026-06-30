import type { BusRoute, RoutePathPoint } from '../model/types';

import { busGet } from '@shared/api';

export const searchBusRoutes = (routeName: string): Promise<BusRoute[]> =>
  busGet<BusRoute>('/busRouteInfo/getBusRouteList', {
    strSrch: routeName,
  });

export const getRoutePath = (busRouteId: string): Promise<RoutePathPoint[]> =>
  busGet<RoutePathPoint>('/busRouteInfo/getRoutePath', { busRouteId });
