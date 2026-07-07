---
paths:
  - 'apps/web/**'
---

# 아키텍처 개요

버쓱은 **서울시 실시간 버스 위치 정보 서비스**다. 네이버맵 JS SDK로 지도를 그리고,
서울 열린데이터광장 / 공공데이터포털 API로 버스 위치·정류장·도착 정보를 조회한다.

## 기술 스택

| 영역          | 선택                                   | 비고                                   |
| ------------- | -------------------------------------- | -------------------------------------- |
| 런타임        | Node.js `22.18.0`                      | `.nvmrc`                               |
| 패키지 매니저 | pnpm `10.29.2`                         | `package.json` `packageManager`        |
| 모노레포      | pnpm workspace + Turborepo             | `pnpm-workspace.yaml`, `turbo.json`    |
| 프레임워크    | React 19 + Vite 8 + TypeScript         | `apps/web`                             |
| 라우팅        | react-router-dom v7                    | 단일 페이지(MapPage)                   |
| 데이터 페칭   | TanStack Query v5                      | [`data-fetching.md`](data-fetching.md) |
| 스타일        | Tailwind CSS v4 (`@tailwindcss/vite`)  | [`styling.md`](styling.md)             |
| 지도          | Naver Maps JS SDK (`@types/navermaps`) |                                        |
| 테스트        | Vitest + Testing Library               | `apps/web`에만 설치                    |

## 모노레포 구조

```
busseuk/
├─ apps/
│  └─ web/          메인 웹 앱 (React 19 + Vite 8)
├─ packages/        공유 패키지 (디렉터리 아직 없음 — 필요 시 생성)
├─ turbo.json       파이프라인(dev/build/lint)
└─ pnpm-workspace.yaml
```

- 모든 명령은 **루트에서** 실행한다: `pnpm dev`(개발 서버 http://localhost:5173) · `pnpm build` · `pnpm lint`.
- 특정 앱만: `pnpm --filter web <script>`.
- TypeScript·Vitest는 `apps/web`에만 설치돼 있다. 타입체크·테스트는 반드시
  `pnpm --filter web ...` 로 실행한다 (루트에서 `npx tsc`/`npx vitest` 직접 호출 금지).

## 앱 내부 구조

`apps/web/src`는 Feature-Sliced Design을 따른다 → [`fsd.md`](fsd.md).

## 외부 의존과 제약

- **CORS**: 서울 버스 API(`ws.bus.go.kr`)는 HTTP 전용이라 브라우저 직접 호출 시 CORS
  오류가 난다. 개발은 `vite.config.ts`의 `server.proxy`(`/api/bus`), 프로덕션은 별도
  프록시 서버(Vercel Functions 등)로 우회한다.
- **좌표계 주의**: 위치 API 명세의 `tmX/tmY`(WGS84)는 실제 응답에서 `null`. 좌표는
  `gpsX`(경도)/`gpsY`(위도)를 쓴다. (근거: `docs/dev-workflow.md`)
- **지도 센터**: 센터 이동은 cross-cutting 불변식 → 반드시
  [`docs/map-center-policy.md`](../../docs/map-center-policy.md) 확인 후 수정.

## 시크릿·환경변수

- 환경변수는 `apps/web/.env.local`(`VITE_` prefix)에서 읽는다. **세 변수 모두 필수**이며,
  `shared/config/env.ts`가 검증한다(없으면 앱 시작 시 throw):
  - `VITE_NAVER_MAP_CLIENT_ID` — 네이버맵 Client ID
  - `VITE_BUS_API_SERVICE_KEY` — 공공데이터 포털 인증키
  - `VITE_BUS_API_BASE_URL` — 버스 API 베이스 URL. 개발은 Vite 프록시 경로 `/api/bus`,
    프로덕션은 배포한 프록시 주소.
- 라이브 API 검증 스크립트(`.claude/scripts/probe-bus-api.sh`)도 `.env.local`을 읽는다.
- `.env*`는 **절대 커밋하지 않는다** (`.gitignore` 확인).
