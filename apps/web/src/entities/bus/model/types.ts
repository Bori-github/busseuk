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

/** 사용자가 선택한 노선의 메타 정보. 여러 정류장에 걸쳐 지도 렌더링·태그 표시에 쓰인다. */
export interface SelectedRoute {
  busRouteId: string
  busRouteAbrv: string
  routeType: string
  adirection: string
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
