import { describe, expect, it } from 'vitest';

import {
  buildRoutePolyline,
  pointAtDistance,
  projectToPolyline,
} from './polyline';

import type { LatLng } from './polyline';

const M_PER_DEG = 111_320;

// 서울 위도 근방에서 동쪽으로 뻗는 직선 경로 (위도 고정, 경도 증가)
const REF_LAT = 37.5;
const eastLine: LatLng[] = [
  { lat: REF_LAT, lng: 127.0 },
  { lat: REF_LAT, lng: 127.001 },
  { lat: REF_LAT, lng: 127.002 },
];

describe('buildRoutePolyline', () => {
  it('누적거리를 단조 증가로 계산하고 총길이를 채운다', () => {
    const poly = buildRoutePolyline(eastLine);

    expect(poly.cumulative).toHaveLength(3);
    expect(poly.cumulative[0]).toBe(0);
    expect(poly.cumulative[1]).toBeGreaterThan(0);
    expect(poly.cumulative[2]).toBeGreaterThan(poly.cumulative[1]);
    expect(poly.total).toBe(poly.cumulative[2]);
  });

  it('빈 배열도 안전하게 처리한다', () => {
    const poly = buildRoutePolyline([]);
    expect(poly.total).toBe(0);
    expect(poly.cumulative).toEqual([0]);
  });
});

describe('projectToPolyline', () => {
  it('노선에서 벗어난 점을 가장 가까운 지점으로 스냅한다', () => {
    const poly = buildRoutePolyline(eastLine);
    // 두 번째 점 부근에서 북쪽으로 약 1m 떨어진 점
    const offset = 1 / M_PER_DEG;
    const result = projectToPolyline(poly, {
      lat: REF_LAT + offset,
      lng: 127.001,
    });

    expect(result.lat).toBeCloseTo(REF_LAT, 6);
    expect(result.lng).toBeCloseTo(127.001, 6);
    expect(result.errorMeters).toBeGreaterThan(0.5);
    expect(result.errorMeters).toBeLessThan(2);
  });

  // 왕복(out-and-back) 노선: 동쪽 끝까지 갔다가 약 11m 북쪽으로 옮겨 서쪽으로 돌아온다.
  // 두 다리가 지리적으로 가까워, 힌트 없이는 관측이 반대편 다리로 스냅될 수 있다.
  const outAndBack: LatLng[] = [
    { lat: REF_LAT, lng: 127.0 },
    { lat: REF_LAT, lng: 127.002 }, // 동쪽 끝 (누적거리 ~176m)
    { lat: REF_LAT + 0.0001, lng: 127.002 }, // 약 11m 북쪽
    { lat: REF_LAT + 0.0001, lng: 127.0 }, // 서쪽으로 복귀(반대편 다리)
  ];

  it('힌트 없으면 지리적으로 가까운 반대편(복귀) 다리로 스냅될 수 있다', () => {
    const poly = buildRoutePolyline(outAndBack);
    // 복귀 다리(37.5001)에 더 가까운 점
    const global = projectToPolyline(poly, { lat: REF_LAT + 0.00008, lng: 127.001 });
    expect(global.segmentIndex).toBe(2); // 복귀 다리
  });

  it('직전 위치(nearDistance) 힌트를 주면 같은(진행) 다리에 머문다', () => {
    const poly = buildRoutePolyline(outAndBack);
    const hinted = projectToPolyline(
      poly,
      { lat: REF_LAT + 0.00008, lng: 127.001 },
      { nearDistance: 100, windowMeters: 80 }, // 진행 다리(0~176m) 근방만 후보
    );
    expect(hinted.segmentIndex).toBe(0); // 진행 다리 유지
  });

  it('힌트 근방에 후보가 없으면 전역 탐색으로 폴백한다', () => {
    const poly = buildRoutePolyline(outAndBack);
    const fallback = projectToPolyline(
      poly,
      { lat: REF_LAT + 0.00008, lng: 127.001 },
      { nearDistance: 999_999, windowMeters: 50 }, // 아무 세그먼트도 안 걸침
    );
    expect(Number.isFinite(fallback.errorMeters)).toBe(true);
    expect(fallback.errorMeters).toBeLessThan(50);
  });

  it('동쪽 진행 구간의 heading은 약 90°다', () => {
    const poly = buildRoutePolyline(eastLine);
    const result = projectToPolyline(poly, { lat: REF_LAT, lng: 127.0005 });

    expect(result.heading).toBeCloseTo(90, 0);
  });

  it('누적거리는 시작점 기준으로 증가한다', () => {
    const poly = buildRoutePolyline(eastLine);
    const near = projectToPolyline(poly, { lat: REF_LAT, lng: 127.0003 });
    const far = projectToPolyline(poly, { lat: REF_LAT, lng: 127.0017 });

    expect(far.distanceAlong).toBeGreaterThan(near.distanceAlong);
  });

  // 진행 방향 화살표의 핵심: 정북 0°/시계방향. 특히 서향은 atan2가 음수를 내고
  // (deg+360)%360으로 270°가 돼야 하는데, 동향(90°)만으로는 이 정규화 경로가 검증되지 않는다.
  it.each([
    ['북', { lat: REF_LAT + 0.001, lng: 127.0 }, 0],
    ['동', { lat: REF_LAT, lng: 127.001 }, 90],
    ['남', { lat: REF_LAT - 0.001, lng: 127.0 }, 180],
    ['서', { lat: REF_LAT, lng: 126.999 }, 270],
  ] as const)('%s향 구간의 heading은 %d°로 정규화된다', (_dir, end, expected) => {
    const poly = buildRoutePolyline([{ lat: REF_LAT, lng: 127.0 }, end]);
    const mid = pointAtDistance(poly, poly.total / 2);

    expect(mid.heading).toBeCloseTo(expected, 0);
  });
});

describe('pointAtDistance', () => {
  it('누적거리 위치의 좌표를 보간한다', () => {
    const poly = buildRoutePolyline(eastLine);
    const mid = pointAtDistance(poly, poly.total / 2);

    expect(mid.lat).toBeCloseTo(REF_LAT, 6);
    expect(mid.lng).toBeCloseTo(127.001, 5);
    expect(mid.heading).toBeCloseTo(90, 0);
  });

  it('범위를 벗어난 거리는 양 끝으로 클램프한다', () => {
    const poly = buildRoutePolyline(eastLine);

    const before = pointAtDistance(poly, -100);
    expect(before.lng).toBeCloseTo(127.0, 6);

    const after = pointAtDistance(poly, poly.total + 100);
    expect(after.lng).toBeCloseTo(127.002, 6);
  });
});
