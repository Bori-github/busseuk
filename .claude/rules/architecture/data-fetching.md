---
paths:
  - "apps/web/src/**/*.{ts,tsx}"
---

# 데이터 페칭 — TanStack Query v5

버스 위치·정류장·도착 정보는 모두 서버 상태다. **TanStack Query v5**로 다룬다.

## 전역 설정

`QueryClient`는 `app/providers`에서 한 번 생성해 `QueryClientProvider`로 주입한다.
기본값:

- `staleTime: 10_000` (10초) — 실시간성이 있는 데이터라 짧게.
- `retry: 1` — 공공 API 실패 시 1회만 재시도.

컴포넌트에서 개별 `QueryClient`를 만들지 않는다.

## 구조 — `queryOptions` 팩토리 표준 (적용 완료)

질의는 `queryOptions` 팩토리로 정의한다. 이 표준은 이미 코드 전체에 적용돼 있다.

- **fetch 함수**(`get<리소스>`)는 `api` 세그먼트에 둔다. HTTP 클라이언트(`shared/api`)를
  통해 호출하는 순수 함수다(예: `entities/bus/api/busPositionApi.ts`).
- **`queryOptions` 팩토리와 질의 키 팩토리**는 `model` 세그먼트에 둔다
  (`model/queries.ts`·`model/queryKeys.ts`) — [fsd.md](fsd.md) 세그먼트 규칙.
- 컴포넌트/훅은 팩토리를 스프레드해 쓰고, 화면 로컬 옵션(`enabled` 게이팅,
  `placeholderData` 등)만 소비처에서 덧붙인다.

```ts
// entities/bus/model/queries.ts (실제) — <리소스>QueryOptions 네이밍
export const busPositionsQueryOptions = (busRouteId: string, enabled = true) =>
  queryOptions({
    queryKey: busQueryKeys.position(busRouteId),
    queryFn: () => getBusPositions(busRouteId),
    enabled,
    staleTime: 0,
    refetchInterval: 5_000, // 폴링 등 질의별 정책은 정의부에 둔다
  });
```

- **질의 키**는 `model/queryKeys.ts`의 키 팩토리로 `[도메인, 리소스, ...파라미터]` 구조를
  만든다(예: `busQueryKeys.position(busRouteId)` → `['bus', 'position', busRouteId]`).
- 폴링 주기(`refetchInterval`)·`staleTime` 등 질의별 정책은 팩토리 정의부에 둔다.

## 실시간 폴링

- 버스 위치는 **5초 주기 폴링**(`refetchInterval: 5_000`)으로 갱신한다 — 공공 API 갱신
  주기(약 5초)와 동일하게 맞춘 값. 버스 마커가 보이지 않을 때는 `enabled` 게이팅으로
  폴링을 멈춰 호출 쿼터를 아낀다.
- 노선 경로는 매일 새벽 5시에만 갱신되므로 폴링하지 않고 긴 `staleTime`(24시간)으로 캐싱한다.
- 정류장 도착정보는 시트가 열려 있는 동안 **15초 주기 폴링**으로 갱신한다.
- 폴링 리렌더가 **지도 센터를 움직여서는 안 된다**. 안정 참조(`useMemo`)/primitive
  의존성으로 effect 재실행을 막는다 →
  [`docs/map-center-policy.md`](../../docs/map-center-policy.md).

## 선(先)검증

질의를 새로 만들기 전, 응답 필드·좌표계·값의 의미를 **실제 호출로** 확인한다.
추측 금지. 도구: `.claude/scripts/probe-bus-api.sh` (상세: `docs/dev-workflow.md`).

## 계약 변경 시

질의 키 구조·응답 타입 등 **계약 변경은 되돌리기 어려운 경계**다. 넓게 퍼진 변경은
작게 쪼개고 경계에서 확인받는다 ([Working Style](../../docs/dev-workflow.md#working-style)).
