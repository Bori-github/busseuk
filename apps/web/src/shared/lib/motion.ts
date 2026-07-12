import type { Variants } from 'framer-motion';

/** 항목 하나당 기본 지연(초). 항목이 적을 때의 도미노 간격. */
const STAGGER_STEP = 0.03;

/**
 * 목록 전체가 등장을 마치는 데 걸리는 최대 시간(초).
 *
 * 상한이 없으면 지연이 항목 수에 비례해 늘어난다. 순차 등장은 항목을 '안 그리는' 게 아니라
 * '그려놓고 투명하게 두는' 것이라, 결과가 많을 때 사용자가 아래로 스크롤하면 아직 차례가
 * 오지 않은 항목들이 빈칸으로 보인다. (실측: 검색 결과 200개에서 6.5초간 화면이 비었다.)
 * 정류소명 검색 API에는 개수 제한 파라미터가 없어 서버가 이를 막아주지 않는다.
 */
const MAX_STAGGER_DURATION = 0.3;

/**
 * 리스트 컨테이너. 마운트 시 자식을 순차 등장시킨다.
 * 자식은 variant 이름(hidden/visible)으로 상태를 상속받으므로 별도 전달이 필요 없다.
 *
 * 항목이 많으면 간격을 줄여 전체 연출을 MAX_STAGGER_DURATION 안에 끝낸다. 화면 밖 항목의
 * 순차 등장은 어차피 아무도 보지 못하므로, 뷰포트 안의 연출만 지키면 충분하다.
 */
export const listVariants = (itemCount: number): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: Math.min(STAGGER_STEP, MAX_STAGGER_DURATION / Math.max(itemCount, 1)),
    },
  },
});

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

/** 누를 수 있는 요소의 공통 탭 피드백 */
export const TAP_SCALE = { scale: 0.97 };
