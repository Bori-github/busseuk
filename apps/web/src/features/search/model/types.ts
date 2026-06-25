export interface StationSearchItem {
  type: 'station';
  stId: string;
  stNm: string;
  arsId: string;
  tmX: string;
  tmY: string;
}

export interface BusRouteSearchItem {
  type: 'route';
  busRouteId: string;
  busRouteNm: string;
  busRouteAbrv: string;
}

export type RecentSearchItem = StationSearchItem | BusRouteSearchItem;
