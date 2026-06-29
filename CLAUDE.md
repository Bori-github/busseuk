# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Style

- 변경은 논리적으로 완결되는 가장 작은 단위로 나눠 진행하고, 각 단위마다 검증(lint·타입·테스트)을 통과시킨다.
- 신규·계약 변경·미검증 영역은 더 작게 쪼개 결정 경계에서 확인받는다. 기계적·저위험 변경은 큰 배치로 한 번에 처리한다.
- 단, 중간 상태가 깨지는 분할은 하지 않는다 — 원자적이면 여러 파일을 함께 바꾼다. ("커밋 입도"와 "확인 빈도"는 별개로 본다.)

## 개발 워크플로

기능 개발은 다음 5단계 루프를 따른다. 상세·사례는 [.claude/docs/dev-workflow.md](.claude/docs/dev-workflow.md) 참고.

1. **선(先)검증** — 설계 전에 실제 API/데이터를 직접 호출해 가정을 확인한다. 추측 금지(예: 위치 API의 `tmX/tmY`는 실제로 `null`, 좌표는 `gpsX/gpsY`). 근거 없는 수치는 쓰지 않는다.
2. **갭 분석** — 목표 대비 가능한 것/불가능한 것을 먼저 구분해 알린다.
3. **페이즈 로드맵** — 작은 커밋 단위로 쪼개고, **테스트 가능한 토대부터** 만든다.
4. **단계별 검증** — 각 단계에서 `pnpm lint`·타입체크·테스트를 통과시키고, 되돌리기 어려운 경계에서는 확인을 받는다.
5. **정직한 보고** — 수행하지 못한 검증(예: 브라우저 렌더 확인)은 한계로 명시한다.

라이브 API 검증 스크립트는 `.claude/scripts/` 참고. 서비스 키는 `.env.local`에서 읽으며 절대 커밋하지 않는다.

## Commands

모든 명령은 루트(`busseuk/`)에서 실행합니다.

```bash
pnpm dev        # 개발 서버 실행 (http://localhost:5173)
pnpm build      # 전체 빌드
pnpm lint       # 린트 검사
```

특정 앱만 실행할 경우:

```bash
pnpm --filter web dev
pnpm --filter web build
```

## Environment

- Node.js: `22.18.0` (`.nvmrc` 참고)
- pnpm: `10.29.2` (`package.json` `packageManager` 필드)

## Architecture

**모노레포 구조**: pnpm workspace + Turborepo

- `apps/web` — 메인 웹 앱 (React 19 + Vite 8 + TypeScript)
- `packages/` — 공유 패키지 (현재 비어있음)

**웹 개요**: 서울시 실시간 버스 위치 정보 서비스. 네이버맵 JS SDK로 지도를 렌더링하며, 서울 열린데이터광장 API로 버스 위치·정류장·도착 정보를 조회합니다.

**FSD (Feature-Sliced Design)**: `apps/web/src/`는 FSD 레이어 구조를 따릅니다. 상위 레이어는 하위 레이어만 참조할 수 있습니다.

```
app/       ← QueryClientProvider, 글로벌 설정
pages/     ← MapPage (단일 페이지)
widgets/   ← BusMap, StopBottomSheet
features/  ← selectBusStop, trackBusLocation
entities/  ← bus, busStop, route 모델
shared/    ← API 호출, 공통 유틸, UI 기본 요소
```

참조 방향: `app → pages → widgets → features → entities → shared`

**스타일링**: Tailwind CSS v4 (`@tailwindcss/vite` 플러그인 방식). `tailwind.config.js` 없이 `index.css`의 `@import "tailwindcss"`로 동작합니다.

**데이터 페칭**: TanStack Query v5. `main.tsx`에서 `QueryClient`를 전역 설정(`staleTime: 10s`, `retry: 1`)합니다.

**CORS**: 서울 버스 API(`ws.bus.go.kr`)는 HTTP 전용으로 브라우저에서 직접 호출 시 CORS 오류가 발생합니다. 개발 환경에서는 `vite.config.ts`의 `server.proxy`로, 프로덕션에서는 별도 프록시 서버(Vercel Functions 등)로 처리합니다.

**API 명세**: 서울 버스 API 상세 명세는 `.claude/docs/api/` 참고
