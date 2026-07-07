# 지도 센터 이동 정책

지도 중심(center) 이동은 **여러 파일에 흩어진 cross-cutting 불변식**이다. 어느 한 파일만 봐서는 전체 의도가 드러나지 않으므로 여기에 규칙으로 둔다. 센터링을 건드리는 작업(예: "내 위치로" 재중심 버튼) 전에 반드시 확인한다.

## 불변식

> 센터는 아래 **허용 트리거에서만** 이동한다. 그 외에는 **절대 이동하지 않는다** — 특히 사용자의 수동 pan/zoom을 존중한다.

핵심 규칙: **centering effect는 "값 변화"에만 반응해야 한다.** 매 렌더 새 객체/배열을 넘겨 effect가 재실행되면 폴링·상태 변경 리렌더마다 지도가 튕긴다. 안정 참조(useMemo)나 primitive 의존성을 쓴다.

## 허용 트리거

| 트리거             | 코드                                                                             | 동작                                                                                                              | 빈도                 |
| ------------------ | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- |
| 앱 시작(지도 생성) | `shared/ui/naver/NaverMap.tsx` 생성 시 `center`                                  | 마운트 시점 `location`으로 센터, zoom 17                                                                          | 1회                  |
| 내 위치 확정       | `shared/ui/naver/NaverMap.tsx` `panTo(center)` (deps `[center.lat, center.lng]`) | `useUserLocation`의 `getCurrentPosition`(1회성, watchPosition 아님) 응답으로 `location`이 바뀌면 그 위치로 panTo  | 사실상 시작 시 1회   |
| 정류장 선택        | `widgets/bus-map/ui/BusMapWidget.tsx` `panTo(target/position)`                   | 선택 정류장으로 센터(바텀시트가 가리면 `bottomInset/2`만큼 아래로 보정). 의존성은 **안정 참조 `selectedStation`** | 선택이 바뀔 때만 1회 |

## 금지 (센터 이동 안 함)

- 사용자 수동 pan/zoom → 유지
- 노선 선택·버스 마커/폴리라인 갱신 → 오버레이만 갱신, 패닝 없음
- 버스 위치 **5초 폴링**·정류장 도착정보 15초 폴링 등 **폴링 리렌더** → 패닝 없음 (노선 경로는 24시간 캐시라 폴링 자체가 없음)
- `bottomInset` 변화(시트 드래그) 단독 → 패닝 없음 (inset은 ref로만 읽음)

## 주의 (과거 회귀 사례)

- `BusMapWidget`의 정류장 패닝 effect는 `selectedStation` prop에 의존한다. MapPage가 이 객체를 **매 렌더 새 리터럴**로 넘기면, 노선 선택 시 5초 폴링 리렌더마다 effect가 재실행돼 지도가 정류장으로 되돌아간다. → MapPage에서 `useMemo`로 안정 참조를 넘겨 "정류장이 실제로 바뀔 때만" 패닝하도록 한다.
- `NaverMap`의 `center` 추적 effect는 deps가 primitive(`[center.lat, center.lng]`)라 참조가 바뀌어도 값이 같으면 패닝하지 않는다. 이 패턴을 유지한다.

## 관련 파일

- `apps/web/src/shared/ui/naver/NaverMap.tsx` — 초기 센터 + 내 위치 추적 패닝
- `apps/web/src/widgets/bus-map/ui/BusMapWidget.tsx` — 정류장 선택 패닝
- `apps/web/src/pages/map/ui/MapPage.tsx` — 정류장 객체 안정 참조 제공
- `apps/web/src/features/user-location/hooks/useUserLocation.ts` — `location` 소스(1회성)
