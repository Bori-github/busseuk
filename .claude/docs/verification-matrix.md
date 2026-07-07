# 검증 매트릭스

busseuk의 각 영역이 **무엇으로 검증되는지**를 추적하는 표다. 목표는 "나중에 확인하자"가
아니라, 각 변경이 어느 게이트를 통과해야 하는지 먼저 정해 두고 빠진 검증을 한계로 드러내는
것이다.

방어선은 피드백 속도 순으로 세 겹이다(자세한 시점·설계 근거는
[.claude/hooks/README.md](../hooks/README.md)·[husky.md](../rules/tooling/husky.md) 참고).

| 게이트                   | 시점                   | 담당                | 권위     |
| ------------------------ | ---------------------- | ------------------- | -------- |
| Claude 훅(`prettier.sh`) | 편집 직후(PostToolUse) | 포맷 자동정리       | 보조     |
| Claude 훅(`eslint.sh`)   | 턴 종료 시(Stop)       | 규칙 위반 보고      | 보조     |
| husky `pre-commit`       | git 커밋 시            | 변경 파일 포맷+린트 | 보조     |
| CI (`test.yml`)          | PR→main                | lint·build·test     | **권위** |

## 현재 자동 검증되는 영역

| 영역                 | 검증 방법                                                     | 강제 지점                                                      | 산출물          |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- | --------------- |
| 포맷                 | `pnpm exec prettier --check "apps/web/src/**/*.{ts,tsx,css}"` | 편집 시 `prettier.sh`, 커밋 시 lint-staged `prettier --write`  | 없음            |
| 린트 규칙            | `pnpm --filter web lint` (eslint flat config)                 | CI `Lint` step, 커밋 시 `eslint --fix`, 턴 종료 시 `eslint.sh` | 없음            |
| FSD 레이어 경계      | `eslint-plugin-fsd-lint` (위 lint에 포함)                     | 위와 동일                                                      | 없음            |
| 타입 안전성          | `tsc -b` (`pnpm --filter web build`에 포함)                   | CI `Build` step                                                | 없음            |
| 빌드                 | `pnpm --filter web build` (`tsc -b && vite build`)            | CI `Build` step                                                | `apps/web/dist` |
| 단위·컴포넌트 테스트 | `pnpm --filter web exec vitest run` (jsdom)                   | CI `Run tests` step                                            | 없음            |

CI 워크플로(`.github/workflows/test.yml`)는 PR→main에서 Install → Lint → Build → Run tests를
순서대로 강제한다. **품질의 권위 있는 게이트는 CI**이고, 훅·husky는 그 앞단의 빠른 보조다.

### 테스트 커버리지 현황

vitest는 검증 대상 파일 옆에 co-locate 한다([project-structure.md](project-structure.md)).
현재 자동 테스트가 있는 영역:

- `shared/lib/polyline` — polyline 디코딩
- `shared/api/busClient` — API 클라이언트
- `shared/ui/naver/createBusMarkerIcon` — 마커 아이콘 생성
- `entities/station/api/getStationInformation` — 정류장 정보 조회
- `features/station-information`·`features/search` — 컴포넌트(jsdom)
- `features/user-location/hooks/useUserLocation` — 위치 훅
- `widgets/bus-map/lib/busInterpolation` — 버스 위치 보간
- `pages/map` — 정류장 정보 통합 흐름

## 반자동/수동 검증 영역

불가 이유는 다음 의미로 쓴다.

- `수동`: 자동 러너 없이 사람이 확인한다.
- `환경 의존`: 실제 서비스 키·외부 API·브라우저처럼 실행 환경에 따라 결과가 달라진다.

| 영역                | 검증 방법                                           | 상태           | 비고                                                                                                                                 |
| ------------------- | --------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 서울 버스 API 계약  | `.claude/scripts/probe-bus-api.sh`로 실제 응답 확인 | 수동·환경 의존 | 서비스 키는 `.env.local`에서 읽고 커밋하지 않는다. 개발 워크플로의 **선(先)검증** 단계([dev-workflow.md](dev-workflow.md)).          |
| 네이버맵 실제 렌더  | `pnpm dev` 후 브라우저 확인                         | 수동           | 지도·마커·센터링이 의도대로 그려지는지는 자동화 없음. 완료 처리 전 한계로 보고한다.                                                  |
| 지도 센터 이동 정책 | 코드 리뷰 + 수동 확인                               | 수동           | 불변식은 [map-center-policy.md](map-center-policy.md)가 단일 출처. lint로 못 잡는다.                                                 |
| CORS 프록시         | `pnpm dev`에서 실제 요청 확인                       | 수동·환경 의존 | 개발은 `vite.config.ts` `server.proxy`, 프로덕션은 별도 프록시.                                                                      |
| 의미/네이밍 컨벤션  | 코드 리뷰                                           | 수동           | `import type`·네이밍·TanStack Query·Tailwind 규칙 등 lint에 인코딩되지 않은 항목은 리뷰 몫([eslint.md](../rules/tooling/eslint.md)). |

## 아직 없는 검증 (구현 전)

- **E2E**: 브라우저 자동화(Playwright 등) 경로가 없다. 지도 상호작용·검색·바텀시트 흐름은
  현재 컴포넌트 테스트(jsdom)까지만 자동화되고 실제 브라우저 렌더는 수동이다.
- **시각 회귀**: 지도/마커 스크린샷 골든 비교가 없다.

이 영역의 기능을 완료 처리하기 전에는, **어떤 수동 검증을 했고 나중에 자동화하려면 어떤 경계가
필요한지**를 [PR 체크리스트](pr-checklist.md)의 `한계 / 미검증` 항목에 남긴다.
