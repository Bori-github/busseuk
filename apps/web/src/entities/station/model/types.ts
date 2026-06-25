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
