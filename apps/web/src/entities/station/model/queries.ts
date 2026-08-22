import { queryOptions } from '@tanstack/react-query';

import { getNearbyStations } from '../api/getNearbyStations';
import { getStationsByName } from '../api/getStationsByName';
import { getStationInformation } from '../api/getStationInformation';
import { stationQueryKeys } from './queryKeys';

export const getStationsByNameQueryOptions = (query: string) =>
  queryOptions({
    queryKey: stationQueryKeys.searchByName(query),
    queryFn: () => getStationsByName(query),
    staleTime: 60_000, // 1분
  });

export const getStationInformationQueryOptions = (arsId: string) =>
  queryOptions({
    queryKey: stationQueryKeys.stationInformation(arsId),
    queryFn: () => getStationInformation(arsId),
    staleTime: 15_000, // 15초
  });

/** 약 11m 격자 */
const roundCoord = (value: number) => Math.round(value * 1e4) / 1e4;

/** 같은 지점이면 결과도 같음 */
export const isSameNearbyQueryPoint = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  roundCoord(a.lat) === roundCoord(b.lat) && roundCoord(a.lng) === roundCoord(b.lng);

export const nearbyStationsQueryOptions = (lat: number, lng: number) => {
  const roundedLat = roundCoord(lat);
  const roundedLng = roundCoord(lng);

  return queryOptions({
    queryKey: stationQueryKeys.nearby(roundedLat, roundedLng),
    queryFn: () => getNearbyStations(roundedLat, roundedLng),
    // 정류소 정보는 매일 새벽 5시에만 갱신
    staleTime: 24 * 60 * 60 * 1000,
  });
};
