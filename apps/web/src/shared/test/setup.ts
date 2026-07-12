import { MotionGlobalConfig } from 'framer-motion';

// jsdom에는 실제 레이아웃/페인트가 없어 애니메이션 프레임이 무의미하고,
// 진입/퇴장 트랜지션이 테스트 타이밍(가짜 타이머 등)과 얽혀 flaky의 원인이 된다.
// 애니메이션을 즉시 완료 처리해 최종 상태만 검증한다(연출 자체는 브라우저에서 수동 확인).
MotionGlobalConfig.skipAnimations = true;
