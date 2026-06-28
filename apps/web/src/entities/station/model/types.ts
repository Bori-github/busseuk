export interface Station {
  stationId: string;
  stationNm: string;
  arsId: string;
  gpsX: string;
  gpsY: string;
  dist: string;
  stationTp: string;
}

export interface StationSearchResult {
  stId: string;
  stNm: string;
  arsId: string;
  tmX: string; // 경도 WGS84 (lng)
  tmY: string; // 위도 WGS84 (lat)
}

export interface StationInformation {
  busRouteId: string;
  busRouteAbrv: string;
  rtNm: string;
  routeType: string; // '1':공항, '2':마을, '3':간선, '4':지선, '5':순환, '6':광역
  adirection: string;
  arrmsg1: string;
  arrmsg2: string;
}
