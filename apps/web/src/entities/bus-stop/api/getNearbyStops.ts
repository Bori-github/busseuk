import type { BusStop, NearbyStopItem } from '../model/types';

import { busGet, BusApiError } from '@shared/api';

/** 500m면 도심에서 50개 넘게 잡혀 과밀해짐 */
export const NEARBY_RADIUS_METERS = 300;

const hasArrivalInfo = (item: NearbyStopItem) => item.arsId !== '0' && item.arsId !== '';

const toBusStop = (item: NearbyStopItem): BusStop => ({
  stationId: item.stationId,
  arsId: item.arsId,
  name: item.stationNm,
  lat: parseFloat(item.gpsY),
  lng: parseFloat(item.gpsX),
  distanceMeters: Number(item.dist),
});

export const getNearbyStops = async (lat: number, lng: number): Promise<BusStop[]> => {
  try {
    const items = await busGet<NearbyStopItem>('/stationinfo/getStationByPos', {
      tmX: String(lng),
      tmY: String(lat),
      radius: String(NEARBY_RADIUS_METERS),
    });

    return items.filter(hasArrivalInfo).map(toBusStop);
  } catch (error) {
    if (error instanceof BusApiError && error.isNotFound) return [];
    throw error;
  }
};
