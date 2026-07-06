---
paths:
  - "apps/web/src/**/*.{ts,tsx}"
---

# React 코드 스타일

## 컴포넌트

- 함수형 컴포넌트 + 화살표 표현식(`func-style`)으로 작성한다.
- Props 타입은 `type`으로 선언하고 컴포넌트 바로 위에 둔다.
- 컴포넌트는 렌더에 집중하고, 비즈니스 로직·상태는 훅(`model`/`hooks` 세그먼트)으로 뺀다.

## 훅

- `eslint-plugin-react-hooks`(recommended) 규칙을 지킨다: 의존성 배열 정확히, 조건부 훅 금지.
- 커스텀 훅은 `use` 접두사, 슬라이스의 `model/` 또는 `hooks/` 세그먼트에 둔다
  (예: `features/user-location/hooks/useUserLocation`).
- `react-refresh/only-export-components`(vite)를 지킨다 — 컴포넌트 파일에서 컴포넌트 외
  값을 함께 export하지 않는다.

## useEffect — 값 변화에만 반응

**effect는 "참조"가 아니라 "값"의 변화에 반응해야 한다.** 매 렌더 새 객체/배열을 deps로
넘기면 폴링·상태 변경 리렌더마다 effect가 재실행된다.

- 안정 참조가 필요하면 `useMemo`로 감싸 넘긴다.
- primitive 의존성(`[center.lat, center.lng]`)을 우선한다.
- 특히 **지도 센터 이동 effect**는 이 규칙이 불변식이다 — 트리거·회귀 사례·예시는
  [`docs/map-center-policy.md`](../../docs/map-center-policy.md)가 단일 출처. 센터링을 건드리기 전 반드시 확인.

## 지도 SDK 연동

- 네이버맵 SDK는 `shared/lib/loadNaverMapSDK.ts`로 로드하고, 지도 프리미티브는
  `shared/ui/naver`에 둔다.
- 오버레이(마커·폴리라인) 갱신은 지도 인스턴스를 재생성하지 않고 오버레이만 갱신한다
  (센터·줌 유지).
