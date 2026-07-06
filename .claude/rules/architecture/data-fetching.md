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

## 현재 구조와 지향점

**현재:** `entities/<domain>/api`는 순수 fetch 함수를 export한다(예:
`getBusPositions(busRouteId): Promise<BusPosition[]>`). 컴포넌트/훅에서 이 함수를
`useQuery`의 `queryFn`으로 직접 넘긴다.

```ts
// entities/bus/api/busPositionApi.ts (실제)
export const getBusPositions = (busRouteId: string): Promise<BusPosition[]> => …
```

**지향(권장):** 질의 키·`queryFn`·옵션이 여러 곳에서 반복되면 `queryOptions` 팩토리로
한 곳에 모아 재사용·타입추론을 얻는다. 신규 질의는 이 형태를 우선한다.

```ts
// 지향 형태 — <리소스>QueryOptions 네이밍
export const busPositionsQueryOptions = (routeId: string) =>
  queryOptions({
    queryKey: ['bus', 'positions', routeId],
    queryFn: () => getBusPositions(routeId),
    // 폴링이 필요하면 refetchInterval을 여기 둔다
  })
```

> 규칙 정립과 기존 코드 정렬은 별개다. 위 팩토리 형태는 표준으로 문서화하되, 기존
> fetch-함수 방식 코드를 일괄 리팩터링하지는 않는다(승인 후 별도 작업).

- **질의 키**는 `[도메인, 리소스, ...파라미터]` 순의 배열로 구조화한다.
- 폴링 주기(`refetchInterval`) 등 질의별 정책은 질의 정의부에 둔다.
- fetch 함수(`get<리소스>`)는 `api` 세그먼트에서 HTTP 클라이언트(`shared/api`)를 통해 호출한다.

## 실시간 폴링

- 버스 위치·경로는 약 **15초 주기 폴링**으로 갱신한다(공공 API는 일반 GPS + 약 5초 갱신).
- 폴링 리렌더가 **지도 센터를 움직여서는 안 된다**. 안정 참조(`useMemo`)/primitive
  의존성으로 effect 재실행을 막는다 →
  [`docs/map-center-policy.md`](../../docs/map-center-policy.md).

## 선(先)검증

질의를 새로 만들기 전, 응답 필드·좌표계·값의 의미를 **실제 호출로** 확인한다.
추측 금지. 도구: `.claude/scripts/probe-bus-api.sh` (상세: `docs/dev-workflow.md`).

## 계약 변경 시

질의 키 구조·응답 타입 등 **계약 변경은 되돌리기 어려운 경계**다. 넓게 퍼진 변경은
작게 쪼개고 경계에서 확인받는다 ([Working Style](../../docs/dev-workflow.md#working-style)).
