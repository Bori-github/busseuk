import { queryOptions } from '@tanstack/react-query';

import { getNearbyStops } from '../api/getNearbyStops';
import { busStopQueryKeys } from './queryKeys';

/** 약 11m 격자 */
const roundCoord = (value: number) => Math.round(value * 1e4) / 1e4;

export const nearbyStopsQueryOptions = (lat: number, lng: number) => {
  const roundedLat = roundCoord(lat);
  const roundedLng = roundCoord(lng);

  return queryOptions({
    queryKey: busStopQueryKeys.nearby(roundedLat, roundedLng),
    queryFn: () => getNearbyStops(roundedLat, roundedLng),
    // 정류소 정보는 매일 새벽 5시에만 갱신
    staleTime: 24 * 60 * 60 * 1000,
  });
};
