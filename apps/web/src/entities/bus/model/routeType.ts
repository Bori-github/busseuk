export interface RouteTypeInfo {
  label: string;
  /** 마커·폴리라인·배지에 쓰는 hex 색상 */
  color: string;
}

/**
 * 노선 유형(routeType) 코드별 표시 정보. 지도 마커·폴리라인과 도착정보 배지가 공유하는 단일 출처.
 * 색상은 Tailwind 팔레트(blue-600/green-400/…)와 동일 값으로 맞춰져 있다.
 */
const ROUTE_TYPES: Record<string, RouteTypeInfo> = {
  '1': { label: '공항', color: '#2563EB' },
  '2': { label: '마을', color: '#4ADE80' },
  '3': { label: '간선', color: '#3B82F6' },
  '4': { label: '지선', color: '#16A34A' },
  '5': { label: '순환', color: '#EAB308' },
  '6': { label: '광역', color: '#DC2626' },
};

const DEFAULT_COLOR = '#6B7280';

export const getRouteTypeColor = (routeType: string): string => ROUTE_TYPES[routeType]?.color ?? DEFAULT_COLOR;

export const getRouteTypeLabel = (routeType: string): string | undefined => ROUTE_TYPES[routeType]?.label;
