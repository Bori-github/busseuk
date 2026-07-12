import { describe, expect, it } from 'vitest';

import { listVariants } from './motion';

/** listVariants가 만든 컨테이너 variant에서 자식 간 지연(초)을 꺼낸다. */
const staggerOf = (itemCount: number) => {
  const visible = listVariants(itemCount).visible;
  if (typeof visible !== 'object' || visible === null || !('transition' in visible)) {
    throw new Error('visible variant에 transition이 없다');
  }
  return (visible.transition as { staggerChildren: number }).staggerChildren;
};

/** 마지막 항목이 등장을 시작하는 시각(초). */
const lastItemDelay = (itemCount: number) => staggerOf(itemCount) * (itemCount - 1);

describe('listVariants', () => {
  it('항목이 적으면 기본 간격(0.03초)을 그대로 쓴다', () => {
    expect(staggerOf(5)).toBe(0.03);
    expect(staggerOf(10)).toBe(0.03);
  });

  it('항목이 많아도 전체 연출이 0.3초를 넘지 않는다', () => {
    // 상한이 없으면 200개 × 0.03초 = 6초. 그동안 화면 밖 항목은 투명하게 남아
    // 스크롤한 사용자에게 빈칸으로 보인다.
    for (const count of [25, 50, 200, 1000]) {
      expect(lastItemDelay(count)).toBeLessThanOrEqual(0.3);
    }
  });

  it('항목이 0개여도 0으로 나누지 않는다', () => {
    expect(Number.isFinite(staggerOf(0))).toBe(true);
  });

  it('항목 수가 늘수록 간격이 좁아진다(순차 등장 자체는 유지)', () => {
    expect(staggerOf(200)).toBeLessThan(staggerOf(20));
    expect(staggerOf(200)).toBeGreaterThan(0);
  });
});
