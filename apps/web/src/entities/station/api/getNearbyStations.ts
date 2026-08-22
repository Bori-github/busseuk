import type { NearbyStation, NearbyStationItem } from '../model/types';

import { busGet, BusApiError } from '@shared/api';
import { parseCoord } from '@shared/lib';

/** 500m면 도심에서 50개 넘게 잡혀 과밀해짐 */
export const NEARBY_RADIUS_METERS = 300;

const hasArrivalInfo = (item: NearbyStationItem) => item.arsId !== '0' && item.arsId !== '';

const toNearbyStation = (item: NearbyStationItem): NearbyStation | null => {
  const lat = parseCoord(item.gpsY);
  const lng = parseCoord(item.gpsX);
  if (lat === null || lng === null) return null;

  return {
    stationId: item.stationId,
    arsId: item.arsId,
    name: item.stationNm,
    lat,
    lng,
    distanceMeters: Number(item.dist),
  };
};

export const getNearbyStations = async (lat: number, lng: number): Promise<NearbyStation[]> => {
  try {
    const items = await busGet<NearbyStationItem>('/stationinfo/getStationByPos', {
      tmX: String(lng),
      tmY: String(lat),
      radius: String(NEARBY_RADIUS_METERS),
    });

    // 좌표를 읽지 못한 정류장은 지도에 표시할 수 없으므로 제외
    return items.filter(hasArrivalInfo).flatMap((item) => toNearbyStation(item) ?? []);
  } catch (error) {
    if (error instanceof BusApiError && error.isNotFound) return [];
    throw error;
  }
};
