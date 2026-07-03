/**
 * 노선 폴리라인 위에 좌표를 투영하기 위한 유틸.
 *
 * 서울 버스 위치 API의 raw GPS는 도로를 살짝 벗어나거나 폴 사이 점프가 발생한다.
 * 이를 노선 경로(getRoutePath) 폴리라인에 투영하면 항상 도로 위에 위치하고,
 * 시작점으로부터의 누적거리(distanceAlong)를 얻어 보간 애니메이션·heading·속도 계산에 쓸 수 있다.
 *
 * 거리 계산은 서울 권역(약 37.5°N)에서 등거리 근사(equirectangular)로 충분히 정확하다.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const M_PER_DEG = 111_320;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export interface RoutePolyline {
  points: LatLng[];
  /** 각 점까지의 시작점 기준 누적거리(m). points와 길이가 같다. */
  cumulative: number[];
  /** 전체 길이(m) */
  total: number;
  /** 평면 근사에 사용할 기준 위도의 경도 스케일(m/deg) */
  lngScale: number;
}

export interface ProjectionResult {
  /** 폴리라인 위로 스냅된 좌표 */
  lat: number;
  lng: number;
  /** 시작점 기준 누적거리(m) */
  distanceAlong: number;
  /** 투영된 구간 인덱스 (points[index] ~ points[index+1]) */
  segmentIndex: number;
  /** 입력 좌표와 스냅 좌표 사이 거리(m) — 노선 이탈 정도 */
  errorMeters: number;
  /** 진행 방향. 정북 0°, 시계방향 증가 */
  heading: number;
}

export interface ProjectionOptions {
  /**
   * 직전 관측의 누적거리(m). 지정 시 이 위치 ± windowMeters 구간을 우선 탐색해,
   * 순환·왕복 노선에서 지리적으로 가까운 반대편 다리로 락온되는 것을 막는다.
   * 근방에 후보가 없으면(힌트가 낡음) 전역 탐색으로 폴백한다.
   */
  nearDistance?: number;
  /** nearDistance 기준 탐색 반경(m). 폴 간격 최대 이동거리보다 넉넉해야 한다. */
  windowMeters?: number;
}

/** nearDistance 미지정 시/기본 탐색 반경(m). 5초 폴 사이 이동거리(≤수백 m)를 여유 있게 덮는다. */
const DEFAULT_PROJECTION_WINDOW_M = 400;

const planarX = (lng: number, lngScale: number) => lng * lngScale;
const planarY = (lat: number) => lat * M_PER_DEG;

const segmentBearing = (a: LatLng, b: LatLng, lngScale: number): number => {
  const dx = planarX(b.lng, lngScale) - planarX(a.lng, lngScale);
  const dy = planarY(b.lat) - planarY(a.lat);
  const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
  return (deg + 360) % 360;
};

/** 좌표 배열로부터 누적거리를 미리 계산한 폴리라인을 만든다. 노선 로드 시 1회만 호출한다. */
export const buildRoutePolyline = (points: LatLng[]): RoutePolyline => {
  const refLat = points.length > 0 ? points[0].lat : 37.5;
  const lngScale = M_PER_DEG * Math.cos(toRad(refLat));

  const cumulative: number[] = [0];
  for (let i = 1; i < points.length; i += 1) {
    const dx = planarX(points[i].lng, lngScale) - planarX(points[i - 1].lng, lngScale);
    const dy = planarY(points[i].lat) - planarY(points[i - 1].lat);
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }

  return {
    points,
    cumulative,
    total: cumulative.length > 0 ? cumulative[cumulative.length - 1] : 0,
    lngScale,
  };
};

/** 좌표를 폴리라인 위 가장 가까운 지점으로 투영한다. */
export const projectToPolyline = (poly: RoutePolyline, target: LatLng, options?: ProjectionOptions): ProjectionResult => {
  const { points, cumulative, lngScale } = poly;

  if (points.length === 0) {
    return {
      lat: target.lat,
      lng: target.lng,
      distanceAlong: 0,
      segmentIndex: 0,
      errorMeters: 0,
      heading: 0,
    };
  }
  if (points.length === 1) {
    return {
      lat: points[0].lat,
      lng: points[0].lng,
      distanceAlong: 0,
      segmentIndex: 0,
      errorMeters: 0,
      heading: 0,
    };
  }

  const tx = planarX(target.lng, lngScale);
  const ty = planarY(target.lat);

  const near = options?.nearDistance;
  const window = options?.windowMeters ?? DEFAULT_PROJECTION_WINDOW_M;

  // restrict=true면 near ± window 구간에 걸치는 세그먼트만 후보로 본다(연속성).
  const scan = (restrict: boolean) => {
    let best = {
      errorMeters: Infinity,
      segmentIndex: 0,
      lat: points[0].lat,
      lng: points[0].lng,
      distanceAlong: 0,
    };

    for (let i = 0; i < points.length - 1; i += 1) {
      if (restrict && near !== undefined && (cumulative[i + 1] < near - window || cumulative[i] > near + window)) {
        continue;
      }

      const ax = planarX(points[i].lng, lngScale);
      const ay = planarY(points[i].lat);
      const bx = planarX(points[i + 1].lng, lngScale);
      const by = planarY(points[i + 1].lat);

      const vx = bx - ax;
      const vy = by - ay;
      const segLen2 = vx * vx + vy * vy;
      const t = segLen2 === 0 ? 0 : Math.max(0, Math.min(1, ((tx - ax) * vx + (ty - ay) * vy) / segLen2));

      const footX = ax + vx * t;
      const footY = ay + vy * t;
      const err = Math.hypot(tx - footX, ty - footY);

      if (err < best.errorMeters) {
        best = {
          errorMeters: err,
          segmentIndex: i,
          lat: points[i].lat + (points[i + 1].lat - points[i].lat) * t,
          lng: points[i].lng + (points[i + 1].lng - points[i].lng) * t,
          distanceAlong: cumulative[i] + (cumulative[i + 1] - cumulative[i]) * t,
        };
      }
    }
    return best;
  };

  // 직전 위치 근방을 우선 탐색하고, 근방에 후보가 없으면 전역 탐색으로 폴백한다.
  let best = scan(near !== undefined);
  if (best.errorMeters === Infinity) best = scan(false);

  return {
    ...best,
    heading: segmentBearing(points[best.segmentIndex], points[best.segmentIndex + 1], lngScale),
  };
};

/** 시작점 기준 누적거리(m) 위치의 좌표와 진행 방향을 반환한다. 보간 애니메이션에 사용. */
export const pointAtDistance = (poly: RoutePolyline, distance: number): { lat: number; lng: number; heading: number } => {
  const { points, cumulative, lngScale, total } = poly;

  if (points.length === 0) return { lat: 0, lng: 0, heading: 0 };
  if (points.length === 1) {
    return { lat: points[0].lat, lng: points[0].lng, heading: 0 };
  }

  const clamped = Math.max(0, Math.min(total, distance));

  // 누적거리 배열에서 구간을 이진 탐색으로 찾는다.
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] < clamped) lo = mid + 1;
    else hi = mid;
  }
  const i = Math.max(0, lo - 1);

  const segLen = cumulative[i + 1] - cumulative[i];
  const t = segLen === 0 ? 0 : (clamped - cumulative[i]) / segLen;

  return {
    lat: points[i].lat + (points[i + 1].lat - points[i].lat) * t,
    lng: points[i].lng + (points[i + 1].lng - points[i].lng) * t,
    heading: segmentBearing(points[i], points[i + 1], lngScale),
  };
};
