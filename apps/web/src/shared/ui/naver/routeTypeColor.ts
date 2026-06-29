/** routeType → 색상. 버스 마커 배지와 노선 경로 라인이 공유한다. */
const ROUTE_TYPE_COLOR: Record<string, string> = {
  '1': '#2563EB', // 공항
  '2': '#4ADE80', // 마을
  '3': '#3B82F6', // 간선
  '4': '#16A34A', // 지선
  '5': '#EAB308', // 순환
  '6': '#DC2626', // 광역
};

const DEFAULT_COLOR = '#6B7280';

export const getRouteTypeColor = (routeType: string): string =>
  ROUTE_TYPE_COLOR[routeType] ?? DEFAULT_COLOR;
