import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BusPosition, RoutePathPoint } from '@entities/bus';
import {
  createBusMarkerIcon,
  createBusStopMarkerIcon,
  createUserMarkerIcon,
  getRouteTypeColor,
  NaverMap,
} from '@shared/ui/naver';

/** 버스 마커가 노출되는 최소 줌 레벨 (정류장 아이콘과 동일) */
const BUS_MARKER_MIN_ZOOM = 17;

/** gpsX/gpsY 문자열을 좌표로 파싱한다. NaN·0(GPS 미확보)은 무효로 보고 null을 반환. */
const parseCoord = (value: string): number | null => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) || parsed === 0 ? null : parsed;
};

interface Location {
  lat: number;
  lng: number;
}

interface SelectedStation {
  lat: number;
  lng: number;
  name: string;
}

export interface BusRouteWithPositions {
  busRouteId: string;
  /** 노선 번호 (busRouteAbrv) */
  routeName: string;
  /** 노선 유형 코드 (routeType) */
  routeType: string;
  /** 진행 방면 (adirection) */
  direction?: string;
  positions: BusPosition[];
  /** 노선 전체 경로 좌표 (폴리라인) */
  path?: RoutePathPoint[];
}

interface BusMapWidgetProps {
  location: Location;
  selectedStation?: SelectedStation | null;
  /** 선택된 노선들의 실시간 버스 위치 */
  busRoutes?: BusRouteWithPositions[];
  /** 하단 오버레이(바텀시트 등)가 가리는 높이(px). 선택 정류장을 가려지지 않은 영역 중앙에 배치하기 위해 사용 */
  bottomInset?: number;
}

export const BusMapWidget = ({
  location,
  selectedStation,
  busRoutes = [],
  bottomInset = 0,
}: BusMapWidgetProps) => {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const userMarkerRef = useRef<naver.maps.Marker | null>(null);
  const selectedMarkerRef = useRef<naver.maps.Marker | null>(null);
  const busMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const routePathsRef = useRef<Map<string, naver.maps.Polyline>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(BUS_MARKER_MIN_ZOOM);

  const bottomInsetRef = useRef(bottomInset);
  useEffect(() => {
    bottomInsetRef.current = bottomInset;
  }, [bottomInset]);

  const handleMapReady = useCallback((map: naver.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // 개발 환경에서 콘솔로 지도 인스턴스에 접근하기 위한 디버그용 코드
  useEffect(() => {
    if (!import.meta.env.DEV || !mapRef.current) return;

    const debugWindow = window as Window & { __busMap?: naver.maps.Map };
    debugWindow.__busMap = mapRef.current;

    return () => {
      delete debugWindow.__busMap;
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new naver.maps.Marker({
        map: mapRef.current,
        position: new naver.maps.LatLng(location.lat, location.lng),
        icon: createUserMarkerIcon(),
      });
    } else {
      userMarkerRef.current.setPosition(
        new naver.maps.LatLng(location.lat, location.lng),
      );
    }
  }, [mapReady, location]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (!selectedStation) {
      selectedMarkerRef.current?.setMap(null);
      selectedMarkerRef.current = null;
      return;
    }

    const position = new naver.maps.LatLng(selectedStation.lat, selectedStation.lng);
    const icon = createBusStopMarkerIcon({ name: selectedStation.name });

    if (!selectedMarkerRef.current) {
      selectedMarkerRef.current = new naver.maps.Marker({
        map: mapRef.current,
        position,
        icon,
      });
    } else {
      selectedMarkerRef.current.setPosition(position);
      selectedMarkerRef.current.setIcon(icon);
      selectedMarkerRef.current.setMap(mapRef.current);
    }

    const inset = bottomInsetRef.current;
    if (inset > 0) {
      // 바텀시트가 하단을 가리므로, 가려지지 않은 영역의 중앙에 정류장이 오도록
      // 화면 투영 좌표에서 목표 중심을 아래로 inset/2만큼 밀어 보정한다.
      const projection = mapRef.current.getProjection();
      const offset = projection.fromCoordToOffset(position);
      const target = projection.fromOffsetToCoord(
        new naver.maps.Point(offset.x, offset.y + inset / 2),
      );
      mapRef.current.panTo(target);
    } else {
      mapRef.current.panTo(position);
    }
  }, [mapReady, selectedStation]);

  // 노선 경로는 24h 캐시·불변이므로 위치 폴링(15s)마다 폴리라인을 재생성하지 않도록,
  // 노선 구성·경로 길이가 바뀔 때만 갱신되는 목록으로 분리한다(P1: 위치 갱신과 경로 렌더 디커플).
  const pathSignature = busRoutes
    .map((route) => `${route.busRouteId}:${route.path?.length ?? 0}`)
    .join(',');
  const routePaths = useMemo(
    () =>
      busRoutes
        .filter((route) => route.path && route.path.length > 0)
        .map((route) => ({
          busRouteId: route.busRouteId,
          routeType: route.routeType,
          path: route.path as RoutePathPoint[],
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathSignature],
  );

  // 선택된 노선의 전체 경로를 폴리라인으로 렌더링한다.
  // 버스 마커와 동일한 줌 임계값에서만 노출하고, busRouteId 기준으로 diff 한다.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const polylines = routePathsRef.current;
    const showPaths = zoom >= BUS_MARKER_MIN_ZOOM;

    const next = new Map<string, { path: naver.maps.LatLng[]; color: string }>();

    if (showPaths) {
      for (const route of routePaths) {
        const path = route.path
          .map((point) => {
            const lat = parseCoord(point.gpsY);
            const lng = parseCoord(point.gpsX);
            if (lat === null || lng === null) return null;
            return new naver.maps.LatLng(lat, lng);
          })
          .filter((latlng): latlng is naver.maps.LatLng => latlng !== null);

        if (path.length < 2) continue;

        next.set(route.busRouteId, {
          path,
          color: getRouteTypeColor(route.routeType),
        });
      }
    }

    for (const [busRouteId, polyline] of polylines) {
      if (!next.has(busRouteId)) {
        polyline.setMap(null);
        polylines.delete(busRouteId);
      }
    }

    for (const [busRouteId, { path, color }] of next) {
      const existing = polylines.get(busRouteId);

      if (existing) {
        existing.setPath(path);
      } else {
        polylines.set(
          busRouteId,
          new naver.maps.Polyline({
            map,
            path,
            strokeColor: color,
            strokeWeight: 5,
            strokeOpacity: 0.85,
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
          }),
        );
      }
    }
  }, [mapReady, routePaths, zoom]);

  useEffect(() => {
    const polylines = routePathsRef.current;
    return () => {
      for (const polyline of polylines.values()) {
        polyline.setMap(null);
      }
      polylines.clear();
    };
  }, []);

  // 선택된 노선의 실시간 버스 위치를 마커로 렌더링한다.
  // 줌이 임계값 미만이면 모두 숨기고, 그 이상이면 vehId 기준으로 add/update/remove 한다.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const markers = busMarkersRef.current;
    const showBuses = zoom >= BUS_MARKER_MIN_ZOOM;

    const next = new Map<string, naver.maps.LatLng>();
    const iconOptions = new Map<
      string,
      { routeName: string; routeType: string; direction?: string }
    >();

    if (showBuses) {
      for (const route of busRoutes) {
        for (const bus of route.positions) {
          const lat = parseCoord(bus.gpsY);
          const lng = parseCoord(bus.gpsX);
          if (lat === null || lng === null) continue;

          next.set(bus.vehId, new naver.maps.LatLng(lat, lng));
          iconOptions.set(bus.vehId, {
            routeName: route.routeName,
            routeType: route.routeType,
            direction: route.direction,
          });
        }
      }
    }

    for (const [vehId, marker] of markers) {
      if (!next.has(vehId)) {
        marker.setMap(null);
        markers.delete(vehId);
      }
    }

    for (const [vehId, position] of next) {
      const existing = markers.get(vehId);

      // 기존 마커는 위치만 갱신한다. 아이콘(노선번호·방면)은 vehId 동안 불변이므로
      // 신규 마커에만 생성한다(P2: 매 갱신 아이콘 재생성·reflow 방지).
      if (existing) {
        existing.setPosition(position);
      } else {
        markers.set(
          vehId,
          new naver.maps.Marker({
            map,
            position,
            icon: createBusMarkerIcon(iconOptions.get(vehId)!),
          }),
        );
      }
    }
  }, [mapReady, busRoutes, zoom]);

  useEffect(() => {
    const markers = busMarkersRef.current;
    return () => {
      for (const marker of markers.values()) {
        marker.setMap(null);
      }
      markers.clear();
    };
  }, []);

  return (
    <NaverMap
      center={location}
      onReady={handleMapReady}
      onZoomChanged={setZoom}
    />
  );
};
