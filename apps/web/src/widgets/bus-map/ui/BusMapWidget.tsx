import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  advancePlayTime,
  hasPendingPlayback,
  MAX_FRAME_MS,
  playbackRate,
  pruneBuffer,
  pushSample,
  sampleAt,
  TARGET_LAG_MS,
} from '../lib/busInterpolation';
import type { Sample } from '../lib/busInterpolation';

import type { BusPosition, RoutePathPoint } from '@entities/bus';
import { getRouteTypeColor } from '@entities/bus';
import {
  buildRoutePolyline,
  pointAtDistance,
  projectToPolyline,
} from '@shared/lib';
import type { LatLng, RoutePolyline } from '@shared/lib';
import {
  BUS_ARROW_SELECTOR,
  createBusMarkerIcon,
  createBusStopMarkerIcon,
  createUserMarkerIcon,
  NaverMap,
} from '@shared/ui/naver';

/** 버스 마커가 노출되는 최소 줌 레벨 (정류장 아이콘과 동일) */
const BUS_MARKER_MIN_ZOOM = 17;

/**
 * raw GPS를 노선에 투영했을 때 허용하는 최대 이탈(m). 이보다 벗어나면(우회·U턴·GPS 노이즈)
 * 투영을 버리고 raw GPS 위치를 그대로 쓴다 — 도로선 위 엉뚱한 지점에 스냅되는 것을 막는다.
 */
const MAX_SNAP_ERROR_M = 60;

/** gpsX/gpsY 문자열을 좌표로 파싱한다. NaN·0(GPS 미확보)은 무효로 보고 null을 반환. */
const parseCoord = (value: string): number | null => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) || parsed === 0 ? null : parsed;
};

/** 노선 경로 점들을 유효 좌표(LatLng)만 파싱한다. 투영용 폴리라인·렌더 폴리라인의 단일 출처. */
const parseRoutePath = (path: RoutePathPoint[]): LatLng[] =>
  path.reduce<LatLng[]>((acc, point) => {
    const lat = parseCoord(point.gpsY);
    const lng = parseCoord(point.gpsX);
    if (lat !== null && lng !== null) acc.push({ lat, lng });
    return acc;
  }, []);

interface Location {
  lat: number;
  lng: number;
}

interface SelectedStation {
  lat: number;
  lng: number;
  name: string;
}

/** 차량별 재생 상태: 노선 폴리라인 + 관측 샘플 버퍼 */
interface BusAnimState {
  poly: RoutePolyline;
  /** 관측 {s,t} 버퍼. renderTime을 사이에 두는 두 샘플을 보간한다. */
  buffer: Sample[];
  /** 마커 내 화살표 DOM 핸들 캐시(해석되면 이후 프레임의 querySelector를 생략). */
  arrowEl?: HTMLElement;
}

export interface BusRouteWithPositions {
  busRouteId: string;
  /** 노선 번호 (busRouteAbrv) */
  routeName: string;
  /** 노선 유형 코드 (routeType) */
  routeType: string;
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
  /** 버스 마커 노출 여부(줌 임계 이상) 변화를 상위에 알린다. 안 보일 때 위치 폴링을 끄기 위함. */
  onBusVisibilityChange?: (visible: boolean) => void;
}

export const BusMapWidget = ({
  location,
  selectedStation,
  busRoutes = [],
  bottomInset = 0,
  onBusVisibilityChange,
}: BusMapWidgetProps) => {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const userMarkerRef = useRef<naver.maps.Marker | null>(null);
  const selectedMarkerRef = useRef<naver.maps.Marker | null>(null);
  const busMarkersRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const routePathsRef = useRef<Map<string, naver.maps.Polyline>>(new Map());

  // 차량별 재생 상태. 폴(5초)마다 관측을 버퍼에 쌓고, rAF 루프가 renderTime(=now−지연)을
  // 사이에 두는 두 실측을 보간해 위치를 연속적으로 재생한다(예측 없음 → 백트래킹 없음).
  const busAnimRef = useRef<Map<string, BusAnimState>>(new Map());
  const rafRef = useRef<number | null>(null);
  // 재생 클럭: 모든 버스가 공유. t=현재 재생 시각(performance.now 도메인), last=직전 프레임 시각.
  const playClockRef = useRef<{ t: number | null; last: number }>({
    t: null,
    last: 0,
  });

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
          // API 응답이 순번(no)대로 온다는 보장이 없어, 폴리라인이 지그재그가 되지 않도록 정렬한다.
          path: [...(route.path as RoutePathPoint[])].sort(
            (a, b) => Number(a.no) - Number(b.no),
          ),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathSignature],
  );

  // 노선별 투영용 폴리라인 캐시(누적거리 사전계산). 버스 raw GPS를 노선 위로 투영해
  // heading(진행 방향)을 안정적으로 얻는 데 쓴다. routePaths가 바뀔 때만 재구성된다.
  const routePolylines = useMemo(() => {
    const polylines = new Map<string, RoutePolyline>();
    for (const route of routePaths) {
      const points = parseRoutePath(route.path);
      if (points.length >= 2) {
        polylines.set(route.busRouteId, buildRoutePolyline(points));
      }
    }
    return polylines;
  }, [routePaths]);

  // 선택된 노선의 전체 경로를 폴리라인으로 렌더링한다.
  // 노선선은 줌아웃 시 전체 경로 파악에 쓰이므로 줌과 무관하게 항상 표시하고, busRouteId 기준으로 diff 한다.
  // (줌에 의존하지 않으므로 줌 변경 시 경로를 재파싱하지 않는다.)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const polylines = routePathsRef.current;

    const next = new Map<string, { path: naver.maps.LatLng[]; color: string }>();

    for (const route of routePaths) {
      const points = parseRoutePath(route.path);
      if (points.length < 2) continue;

      next.set(route.busRouteId, {
        path: points.map((p) => new naver.maps.LatLng(p.lat, p.lng)),
        color: getRouteTypeColor(route.routeType),
      });
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
  }, [mapReady, routePaths]);

  useEffect(() => {
    const polylines = routePathsRef.current;
    return () => {
      for (const polyline of polylines.values()) {
        polyline.setMap(null);
      }
      polylines.clear();
    };
  }, []);

  // 누적거리 s 위치의 좌표·heading을 마커에 반영한다(위치 이동 + 화살표 회전).
  // 화살표 DOM 핸들은 캐시해 프레임당 querySelector를 피하되, 네이버가 마커 DOM을
  // 재생성하면 캐시가 detached 노드를 가리킬 수 있으므로 isConnected로 확인해 재해석한다.
  const applyBusAnim = useCallback(
    (marker: naver.maps.Marker, anim: BusAnimState, s: number) => {
      const { lat, lng, heading } = pointAtDistance(anim.poly, s);
      marker.setPosition(new naver.maps.LatLng(lat, lng));
      if (anim.arrowEl === undefined || !anim.arrowEl.isConnected) {
        // 아직 안 그려졌거나(다음 프레임 재시도) 노드가 끊겼으면 다시 해석한다.
        anim.arrowEl =
          marker.getElement()?.querySelector<HTMLElement>(BUS_ARROW_SELECTOR) ??
          undefined;
      }
      if (anim.arrowEl) {
        anim.arrowEl.style.visibility = 'visible';
        anim.arrowEl.style.transform = `rotate(${heading}deg)`;
      }
    },
    [],
  );

  // rAF 루프: 적응형 재생 클럭(playTime)을 사이에 두는 두 실측을 보간해 위치를 재생한다.
  // 클럭은 목표 지연을 유지하되, 초과 지연이 쌓이면 잠깐 >1배속으로 부드럽게 회수(캐치업)한다.
  // 최신 실측을 절대 앞지르지 않으므로(clamp) 예측·되돌아감이 없고, 재생 구간이 없으면 멈춘다.
  const runAnimation = useCallback(
    function frame(now: number) {
      const markers = busMarkersRef.current;
      const anims = busAnimRef.current;
      const clock = playClockRef.current;

      // 모든 버스의 최신 실측 시각 → 재생 클럭이 넘지 못하는 상한.
      let newest = -Infinity;
      for (const anim of anims.values()) {
        const last = anim.buffer[anim.buffer.length - 1];
        if (last && last.t > newest) newest = last.t;
      }
      if (newest === -Infinity) {
        rafRef.current = null;
        clock.last = 0;
        return;
      }

      // 클럭 초기화/재동기화: 최초이거나 오래 멈춰 클럭이 낡았으면 목표 지연 위치로 리셋.
      if (clock.t === null || now - clock.t > TARGET_LAG_MS * 3) {
        clock.t = now - TARGET_LAG_MS;
        clock.last = now;
      }
      const dtMs = Math.min(now - clock.last, MAX_FRAME_MS);
      clock.last = now;
      const rate = playbackRate(now - clock.t);
      clock.t = advancePlayTime(clock.t, dtMs, rate, newest);
      const playTime = clock.t;

      let active = false;
      for (const [vehId, anim] of anims) {
        pruneBuffer(anim.buffer, playTime);
        const s = sampleAt(anim.buffer, playTime);
        if (s === null) continue;
        const marker = markers.get(vehId);
        if (marker) applyBusAnim(marker, anim, s);
        if (hasPendingPlayback(anim.buffer, playTime)) active = true;
      }

      if (active) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rafRef.current = null;
      }
    },
    [applyBusAnim],
  );

  const startAnimation = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(runAnimation);
    }
  }, [runAnimation]);

  // 선택된 노선의 실시간 버스 위치를 마커로 렌더링한다.
  // 줌이 임계값 미만이면 모두 숨기고, 그 이상이면 vehId 기준으로 add/update/remove 한다.
  // 폴리라인이 있는 차량은 관측을 버퍼에 쌓고 rAF 루프가 지연 재생 보간으로 이동시키며,
  // 폴리라인이 없는 차량(경로 미로드)은 종전처럼 raw GPS로 즉시 배치한다.
  const showBuses = zoom >= BUS_MARKER_MIN_ZOOM;

  // 마커 노출 여부가 바뀌면 상위에 알린다(안 보일 때 위치 폴링을 꺼 쿼터를 아끼기 위함).
  useEffect(() => {
    onBusVisibilityChange?.(showBuses);
  }, [showBuses, onBusVisibilityChange]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    const markers = busMarkersRef.current;
    const anims = busAnimRef.current;
    const now = performance.now();

    interface Desired {
      lat: number;
      lng: number;
      routeName: string;
      color: string;
      poly?: RoutePolyline;
      /** 노선 폴리라인에 투영한 관측 누적거리(m) */
      sObs?: number;
    }
    const next = new Map<string, Desired>();

    if (showBuses) {
      for (const route of busRoutes) {
        const poly = routePolylines.get(route.busRouteId);
        for (const bus of route.positions) {
          const lat = parseCoord(bus.gpsY);
          const lng = parseCoord(bus.gpsX);
          if (lat === null || lng === null) continue;

          const desired: Desired = {
            lat,
            lng,
            routeName: route.routeName,
            color: getRouteTypeColor(route.routeType),
            poly,
          };
          // 폴리라인이 있으면 raw GPS를 투영해 관측 누적거리를 얻는다(지터에 강함).
          // 직전 관측 위치를 힌트로 줘 순환·왕복 노선에서 반대편 다리 락온을 막고,
          // 노선에서 너무 벗어난 관측은 투영을 버리고 raw GPS를 쓴다.
          if (poly) {
            const hint = anims.get(bus.vehId)?.buffer.at(-1)?.s;
            const proj = projectToPolyline(
              poly,
              { lat, lng },
              { nearDistance: hint },
            );
            if (proj.errorMeters <= MAX_SNAP_ERROR_M) {
              desired.sObs = proj.distanceAlong;
            }
          }
          next.set(bus.vehId, desired);
        }
      }
    }

    for (const [vehId, marker] of markers) {
      if (!next.has(vehId)) {
        marker.setMap(null);
        markers.delete(vehId);
        anims.delete(vehId);
      }
    }

    let hasPlayback = false;
    for (const [vehId, d] of next) {
      // 폴리라인이 있으면 관측을 버퍼에 쌓고, 없으면 재생 대상에서 제외한다.
      let anim: BusAnimState | undefined;
      if (d.poly && d.sObs !== undefined) {
        anim = anims.get(vehId);
        if (!anim || anim.poly !== d.poly) {
          anim = { poly: d.poly, buffer: [], arrowEl: anim?.arrowEl };
          anims.set(vehId, anim);
        }
        pushSample(anim.buffer, d.sObs, now);
        hasPlayback = true;
      } else {
        anims.delete(vehId);
      }

      const existing = markers.get(vehId);
      if (existing) {
        // 위치 갱신은 rAF 루프(지연 재생)가 담당한다. 폴리라인 없는 차량만 raw GPS로 즉시 배치.
        if (!anim) existing.setPosition(new naver.maps.LatLng(d.lat, d.lng));
      } else {
        // 신규 마커: 폴리라인이 있으면 첫 재생 지점(도로 위)과 heading으로, 아니면 raw GPS로 생성.
        const playTime = playClockRef.current.t ?? now - TARGET_LAG_MS;
        const s = anim ? sampleAt(anim.buffer, playTime) : null;
        const start =
          anim && s !== null
            ? pointAtDistance(anim.poly, s)
            : { lat: d.lat, lng: d.lng, heading: undefined as number | undefined };
        markers.set(
          vehId,
          new naver.maps.Marker({
            map,
            position: new naver.maps.LatLng(start.lat, start.lng),
            icon: createBusMarkerIcon({
              routeName: d.routeName,
              color: d.color,
              heading: start.heading,
            }),
          }),
        );
      }
    }

    // 재생할 버퍼가 있으면 rAF 루프를 기동한다(멈춰 있었다면 다시 시작).
    if (hasPlayback) startAnimation();
  }, [mapReady, busRoutes, showBuses, routePolylines, startAnimation]);

  useEffect(() => {
    const markers = busMarkersRef.current;
    const anims = busAnimRef.current;
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      playClockRef.current = { t: null, last: 0 };
      for (const marker of markers.values()) {
        marker.setMap(null);
      }
      markers.clear();
      anims.clear();
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
