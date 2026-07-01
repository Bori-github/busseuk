import { describe, expect, it } from 'vitest';

import type { Sample } from './busInterpolation';
import {
  advancePlayTime,
  hasPendingPlayback,
  JITTER_TOLERANCE_M,
  MAX_CATCHUP_RATE,
  playbackRate,
  pruneBuffer,
  pushSample,
  sampleAt,
  SNAP_THRESHOLD_M,
  STALE_GAP_MS,
  TARGET_LAG_MS,
} from './busInterpolation';

describe('pushSample', () => {
  it('일반 관측을 순서대로 쌓는다', () => {
    const buf: Sample[] = [];
    pushSample(buf, 100, 1000);
    pushSample(buf, 150, 6000);
    expect(buf).toEqual([
      { s: 100, t: 1000 },
      { s: 150, t: 6000 },
    ]);
  });

  it('급점프는 버퍼를 리셋해 스냅한다', () => {
    const buf: Sample[] = [{ s: 100, t: 1000 }];
    pushSample(buf, 100 + SNAP_THRESHOLD_M + 1, 6000);
    expect(buf).toEqual([{ s: 100 + SNAP_THRESHOLD_M + 1, t: 6000 }]);
  });

  it('오랜 공백(탭 백그라운드 등)은 버퍼를 리셋한다', () => {
    const buf: Sample[] = [{ s: 100, t: 1000 }];
    pushSample(buf, 130, 1000 + STALE_GAP_MS + 1);
    expect(buf).toHaveLength(1);
    expect(buf[0].s).toBe(130);
  });

  it('미세 후퇴(지터)는 정지로 눌러 무시한다', () => {
    const buf: Sample[] = [{ s: 200, t: 1000 }];
    pushSample(buf, 200 - (JITTER_TOLERANCE_M - 1), 6000);
    expect(buf[1].s).toBe(200);
  });

  it('큰 후퇴(실제 역방향)는 유지한다', () => {
    const buf: Sample[] = [{ s: 200, t: 1000 }];
    pushSample(buf, 150, 6000);
    expect(buf[1].s).toBe(150);
  });
});

describe('sampleAt', () => {
  const buf: Sample[] = [
    { s: 100, t: 1000 },
    { s: 200, t: 6000 },
  ];

  it('빈 버퍼는 null', () => {
    expect(sampleAt([], 3000)).toBeNull();
  });

  it('가장 오래된 샘플 이전이면 그 샘플에 고정', () => {
    expect(sampleAt(buf, 0)).toBe(100);
  });

  it('가장 최신 샘플 이후(언더런)면 최신 샘플에 고정(예측 안 함)', () => {
    expect(sampleAt(buf, 999999)).toBe(200);
  });

  it('두 실측 사이는 선형 보간한다', () => {
    // 중간 시각 3500 → (3500-1000)/(6000-1000)=0.5 → 150
    expect(sampleAt(buf, 3500)).toBeCloseTo(150, 6);
  });

  it('보간값은 최신 실측을 절대 넘지 않는다(백트래킹 없음)', () => {
    const s = sampleAt(buf, 5999)!;
    expect(s).toBeLessThanOrEqual(200);
    expect(s).toBeGreaterThan(100);
  });
});

describe('pruneBuffer', () => {
  it('renderTime 하위 브래킷 하나만 남기고 오래된 샘플을 버린다', () => {
    const buf: Sample[] = [
      { s: 0, t: 1000 },
      { s: 100, t: 6000 },
      { s: 200, t: 11000 },
    ];
    pruneBuffer(buf, 7000); // 6000이 하위 브래킷
    expect(buf).toEqual([
      { s: 100, t: 6000 },
      { s: 200, t: 11000 },
    ]);
  });

  it('renderTime이 모든 샘플보다 이르면 그대로 둔다', () => {
    const buf: Sample[] = [
      { s: 0, t: 5000 },
      { s: 100, t: 10000 },
    ];
    pruneBuffer(buf, 1000);
    expect(buf).toHaveLength(2);
  });
});

describe('playbackRate', () => {
  it('지연이 목표 이하면 등속(1배)', () => {
    expect(playbackRate(TARGET_LAG_MS)).toBe(1);
    expect(playbackRate(TARGET_LAG_MS - 1000)).toBe(1);
  });

  it('목표 초과분만큼 빨라진다', () => {
    expect(playbackRate(TARGET_LAG_MS + 500)).toBeGreaterThan(1);
  });

  it('상한을 넘지 않는다', () => {
    expect(playbackRate(TARGET_LAG_MS + 100_000)).toBe(MAX_CATCHUP_RATE);
  });
});

describe('advancePlayTime', () => {
  it('배속을 반영해 전진한다', () => {
    expect(advancePlayTime(1000, 100, 1, 999999)).toBe(1100);
    expect(advancePlayTime(1000, 100, 1.1, 999999)).toBeCloseTo(1110, 6);
  });

  it('최신 실측 시각을 넘지 않는다(되돌아감·언더런 오버슈트 방지)', () => {
    expect(advancePlayTime(1000, 5000, 1.15, 1200)).toBe(1200);
  });
});

describe('hasPendingPlayback', () => {
  const buf: Sample[] = [{ s: 0, t: 5000 }];
  it('renderTime이 최신 샘플보다 이르면 재생할 구간이 남음', () => {
    expect(hasPendingPlayback(buf, 4000)).toBe(true);
  });
  it('renderTime이 최신 샘플을 지났으면 재생 완료', () => {
    expect(hasPendingPlayback(buf, 6000)).toBe(false);
  });
  it('빈 버퍼는 false', () => {
    expect(hasPendingPlayback([], 0)).toBe(false);
  });
});
