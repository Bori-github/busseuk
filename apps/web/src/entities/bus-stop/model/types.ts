export interface NearbyStopItem {
  stationId: string;
  stationNm: string;
  arsId: string;
  /** 경도 WGS84 */
  gpsX: string;
  /** 위도 WGS84 */
  gpsY: string;
  /** 기준점으로부터 거리(m) */
  dist: string;
  stationTp: string;
}

export interface BusStop {
  stationId: string;
  arsId: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}
