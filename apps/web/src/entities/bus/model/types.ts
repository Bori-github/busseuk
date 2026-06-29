export interface BusRoute {
  busRouteId: string
  busRouteNm: string
  busRouteAbrv: string
  routeType: string
  stStationNm: string
  edStationNm: string
}

export interface RoutePathPoint {
  no: string
  /** 경도 WGS84 */
  gpsX: string
  /** 위도 WGS84 */
  gpsY: string
}

export interface BusPosition {
  vehId: string
  plainNo: string
  /** 맵매칭 좌표 GRS80 (지도 렌더링에는 부적합) */
  posX: string
  posY: string
  /** GPS 좌표 WGS84 (네이버맵 렌더링용). gpsX=경도, gpsY=위도 */
  gpsX: string
  gpsY: string
  sectOrd: string
  sectionId: string
  dataTm: string
}
