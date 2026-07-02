# 여러 정류장의 버스 노선 선택 유지 + 태그 UI

## 배경

현재 버스 노선은 정류장 도착정보 바텀시트 안의 체크박스로만 선택할 수 있고, 선택 상태(`selectedRoutes`)가 바텀시트 열림/닫힘과 정류장 선택에 강하게 묶여 있다. 그 결과:

- 바텀시트를 닫으면 선택한 노선이 모두 사라진다 (`handleStationInformationSheetClose`의 `setSelectedRoutes([])`).
- 다른 정류장을 선택하면 이전 노선이 사라진다 (`handleSelectStation`의 `setSelectedRoutes([])`).

즉 "여러 정류장에 걸쳐 노선을 골라 지도에서 함께 추적"하는 것이 불가능하다. 지도 렌더링(`busRoutes` → `BusMapWidget`)은 이미 `selectedRoutes`만 보고 바텀시트와 독립적으로 동작하므로, **선택 상태의 수명을 바텀시트/정류장에서 분리**하고, 바텀시트가 닫혀도 선택된 노선을 **검색창 하단 태그 UI**로 노출하면 목표를 달성할 수 있다.

## 목표 UX

- 여러 정류장에서 노선을 선택해도 모두 유지된다(전역 최대 5개, 기존 `MAX_SELECTED_ROUTES` 유지).
- 바텀시트를 닫아도 선택된 노선은 지도에 계속 표시되고, 검색창 하단에 태그로 노출된다.
- 각 태그는 `노선명 + 제거(X) 버튼` 형태이며, 제거 버튼은 해당 노선을 선택 해제한다.
- 선택된 노선이 없으면 태그 UI를 렌더링하지 않는다.

## 변경 사항

### 1. `SelectedRoute` 타입을 `entities/bus`로 이동 (FSD 정리)

`SelectedRoute`는 기존에 `features/station-information/ui/StationInformationBottomSheet.tsx`에 선언되어 있었다. 여러 정류장에 걸친 "선택된 노선"은 특정 정류장 feature에 종속되지 않는 도메인 개념이므로 엔티티로 승격한다. 이렇게 하면 새 태그 리스트 feature가 sibling feature를 참조하지 않고 `entities`만 의존할 수 있다.

- `apps/web/src/entities/bus/model/types.ts` — `SelectedRoute` 인터페이스 추가.
- `apps/web/src/entities/bus/index.ts` — `export type { SelectedRoute }` 추가.
- `features/station-information/ui/StationInformationBottomSheet.tsx` — 로컬 선언 제거, `@entities/bus`에서 import.
- `features/station-information/index.ts` — `SelectedRoute` 재export 제거.
- `pages/map/ui/MapPage.tsx` — import 출처를 `@features/station-information` → `@entities/bus`로 변경.

### 2. 선택 상태 수명 분리 (멀티 정류장 + 유지의 핵심)

`apps/web/src/pages/map/ui/MapPage.tsx`:

- `handleSelectStation`: `setSelectedRoutes([]);` **제거** → 새 정류장을 골라도 기존 선택 유지.
- `handleStationInformationSheetClose`: `setSelectedRoutes([]);` **제거** → 바텀시트를 닫아도 선택 유지.
- `setSelectedStation(null)`은 그대로 둔다: 검색창의 정류장명 표시와 지도 정류장 마커는 "지금 보고 있는 정류장" 개념이므로 유지된 노선 태그와 독립적으로 초기화되는 게 자연스럽다.

이 두 줄 제거만으로 지도 위 폴리라인/버스 마커는 계속 표시된다(`busRoutes` useMemo가 `selectedRoutes` 기반, `BusMapWidget`은 sheet와 무관).

바텀시트 재오픈 시 체크박스는 전역 `selectedRouteIds`를 반영하므로, 다른 정류장에서 이미 고른 노선이 그 정류장 도착목록에 있으면 체크된 상태로 보인다(정상 동작).

### 3. 태그 리스트 컴포넌트 신설

새 feature: `apps/web/src/features/selected-routes/`

- `ui/SelectedRouteTagList.tsx` — `routes: SelectedRoute[]`, `onRemove: (route: SelectedRoute) => void` props.
  - `routes.length === 0`이면 `return null`.
  - `flex flex-wrap gap-2` 컨테이너에 태그 매핑.
  - 각 태그: `getRouteTypeColor(route.routeType)`(from `@entities/bus`)로 배경색을 준 `rounded-full` pill + `route.busRouteAbrv` 텍스트 + `XIcon`(from `@shared/icons`) 제거 버튼.
  - 기존 배지 스타일 선례: `StationInformationBottomSheet.tsx`(색상 pill), X 버튼 선례: `features/search/ui/StationSearchItem.tsx`, `shared/ui/InputSearch.tsx`.
  - 제거 버튼에 `aria-label`(예: `` `${route.busRouteAbrv} 노선 선택 해제` ``) 부여, `onClick={() => onRemove(route)}`.
- `index.ts` — `export { SelectedRouteTagList }`.

### 4. MapPage에 태그 리스트 배치

`apps/web/src/pages/map/ui/MapPage.tsx`:

- 기존 `absolute top-4 left-4 right-4 z-10` 컨테이너에 `flex flex-col gap-2` 추가.
- 검색 버튼 `</button>` 바로 다음에 `<SelectedRouteTagList routes={selectedRoutes} onRemove={handleToggleRoute} />` 추가.
- `handleToggleRoute`는 이미 "선택된 노선이면 제거"하는 토글이므로 그대로 `onRemove`로 재사용한다.
- 이 블록은 `!isSearchOpen` 조건 하에 있으므로(전체화면 검색 오버레이는 `z-20`), 검색 중에는 자동으로 가려진다.

### 5. 줌 레벨 안내 메시지 (버스 마커 미노출 안내)

버스 마커는 줌 `BUS_MARKER_MIN_ZOOM(17)` 이상에서만 표시되고, 그 미만에서는 폴리라인만 보이고 마커가 사라진다(`BusMapWidget.tsx`의 `showBuses`). 선택한 노선이 있는데 줌이 낮아 마커가 안 보이면 사용자는 "버스가 없는 것"과 구분하지 못하므로, 안내 메시지를 노출한다.

- 조건: `selectedRoutes.length > 0 && !busesVisible`일 때만 노출. 마커 노출 가능 상태(`busesVisible === true`)면 미노출.
- `busesVisible`는 이미 MapPage 상태로 존재하며 `BusMapWidget`의 `onBusVisibilityChange`(줌≥17)로 갱신된다 — 추가 상태 없이 그대로 활용.
- 배치: 검색창 하단 태그 리스트 영역(같은 `flex flex-col gap-2` 컨테이너) 안, 태그 아래에 작은 안내 배너로 렌더.
- 문구 예: `"지도를 확대하면 실시간 버스 위치가 표시됩니다"`. 다크 테마 톤(`text-xs`, `bg-black/…`, `text-gray-…`, `rounded`)으로 눈에 거슬리지 않게.
- 구현: `features/selected-routes`에 작은 컴포넌트(예: `BusZoomHint`)로 두거나 MapPage에서 인라인 렌더. 노출 여부(`selectedRoutes.length > 0 && !busesVisible`)는 MapPage에서 계산.

## 재사용하는 기존 코드

- `handleToggleRoute` (`MapPage.tsx`) — 태그 제거 = 이미 선택된 노선 토글이므로 그대로 사용.
- `getRouteTypeColor` (`entities/bus/model/routeType.ts`) — 태그 배경색.
- `XIcon` (`@shared/icons`), 다크 테마 Tailwind 컨벤션(`bg-black`/`text-white`/`text-gray-400`, `rounded-full`, `shadow-md`).

## 영향 없음 확인

- `busPositionsQueryOptions`/`routePathQueryOptions` + `useQueries` + `busRoutes` useMemo: `selectedRoutes`만 의존 → 수명 분리 후에도 그대로 지도 구동.
- `MAX_SELECTED_ROUTES = 5`(`StationInformationBottomSheet.tsx`): 전역 상한으로 유지(태그 제거 시 카운트 감소해 재선택 가능).
- 폴링 수명 변화: 기존에는 시트를 닫으면 `selectedRoutes=[]`가 되어 위치 폴링이 완전히 멈췄지만, 이제 닫아도 선택된 노선(최대 5개)의 위치 폴링(5s)이 유지된다. "닫아도 계속 추적"이라는 기능 목표상 의도된 동작이며, `busesVisible`(줌≥17) 게이팅으로 억제되고 상한(5개)이 동일해 최악치 부하는 기존과 같다.

## 권장 사항 (적대적 검증 도출 → 반영 완료)

적대적 검증에서 도출된 UX 개선안. 개발 중 반영을 결정했고 둘 다 구현했다.

- **전역 5개 상한 안내** ✅: cap이 정류장 단위가 아니라 전역이라, 한 정류장에서 5개를 채운 뒤 다른 정류장을 열면 미선택 체크가 막힌다. → cap 도달 시 미선택 체크박스를 비활성화하고 안내 문구를 노출해 원인을 드러냈다(`StationInformationBottomSheet`).
- **태그에서 도착정보 재확인 동선** ✅: 각 선택 노선에 출처 정류장을 함께 저장하고, 태그의 노선번호를 누르면 그 정류장의 도착정보 시트를 다시 연다(`SelectedRouteTagList` `onReopen` → MapPage `handleReopenStation`).

## 검증

1. `pnpm lint` + 타입체크 통과.
2. `pnpm dev` 실행 후 브라우저에서:
   - 정류장 A에서 노선 1개 선택 → 바텀시트 닫기 → 검색창 하단에 태그 노출 + 지도에 폴리라인/마커 유지 확인.
   - 정류장 B 검색·선택 → A에서 고른 노선 태그가 유지된 채 B의 노선도 추가 선택 가능한지 확인(멀티 정류장).
   - 태그의 X 버튼 클릭 → 해당 노선 선택 해제 + 지도에서 제거 확인.
   - 모든 노선 제거 시 태그 UI가 사라지는지 확인.
   - 전역 5개 상한 초과 시 기존 토스트 동작 확인.
   - 노선 선택 후 줌을 17 미만으로 축소 → "지도를 확대하면…" 안내 메시지 노출, 다시 17 이상으로 확대 → 메시지 사라짐. 선택 노선이 없으면 어떤 줌에서도 메시지 미노출.
3. 한계: 브라우저 실제 렌더/네이버맵 SDK 동작은 수동 확인 영역으로, 자동 테스트 범위 밖.
