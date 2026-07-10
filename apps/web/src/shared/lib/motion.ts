import type { Variants } from 'framer-motion';

/**
 * 리스트 컨테이너. 마운트 시 자식을 순차 등장시킨다.
 * 자식은 variant 이름(hidden/visible)으로 상태를 상속받으므로 별도 전달이 필요 없다.
 */
export const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};

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
