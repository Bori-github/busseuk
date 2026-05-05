# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**웹 개요**: 서울시 실시간 버스 위치 정보 서비스. 카카오맵 JS SDK로 지도를 렌더링하며, 서울 열린데이터광장 API로 버스 위치·정류장·도착 정보를 조회합니다.

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
