# 네이버 지도 MapOptions 레퍼런스

- **출처**: https://navermaps.github.io/maps.js.ncp/docs/naver.maps.html#.MapOptions

---

| 필드명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| `background` | string | - | 지도 배경 이미지 URL 또는 CSS 색상값 |
| `baseTileOpacity` | number | - | 기본 타일 불투명도 (0~1) |
| `bounds` | Bounds \| BoundsLiteral | null | 초기 좌표 경계 |
| `center` | Coord \| CoordLiteral | 서울시청 | 초기 중심 좌표 |
| `disableDoubleClickZoom` | boolean | false | 더블 클릭 확대 비활성화 |
| `disableDoubleTapZoom` | boolean | false | 한 손가락 더블 탭 확대 비활성화 |
| `disableKineticPan` | boolean | true | 관성 이동 효과 비활성화 |
| `disableTwoFingerTapZoom` | boolean | false | 두 손가락 더블 탭 축소 비활성화 |
| `draggable` | boolean | true | 지도 드래그 이동 허용 |
| `keyboardShortcuts` | boolean | true | 키보드 방향키 이동 허용 |
| `logoControl` | boolean | true | NAVER 로고 표시 |
| `logoControlOptions` | LogoControlOptions | - | 로고 컨트롤 옵션 |
| `mapDataControl` | boolean | true | 저작권 컨트롤 표시 |
| `mapDataControlOptions` | MapDataControlOptions | - | 저작권 컨트롤 옵션 |
| `mapTypeControl` | boolean | false | 지도 유형 컨트롤 표시 |
| `mapTypeControlOptions` | MapTypeControlOptions | - | 지도 유형 컨트롤 옵션 |
| `mapTypeId` | string | NORMAL | 초기 지도 유형 ID |
| `mapTypes` | MapTypeRegistry | - | 지도 유형 컬렉션 (커스텀 오버레이 등에 사용) |
| `maxBounds` | Bounds \| BoundsLiteral | null | 이동 가능한 최대 좌표 경계 |
| `maxZoom` | number | - | 최대 줌 레벨 |
| `minZoom` | number | - | 최소 줌 레벨 |
| `padding` | padding | {top:0, right:0, bottom:0, left:0} | 뷰포트 안쪽 여백 (px) |
| `pinchZoom` | boolean | true | 핀치 제스처 확대/축소 허용 |
| `resizeOrigin` | Position | CENTER | 지도 크기 조정 시 고정 원점 |
| `scaleControl` | boolean | true | 축척 컨트롤 표시 |
| `scaleControlOptions` | ScaleControlOptions | - | 축척 컨트롤 옵션 |
| `scrollWheel` | boolean | true | 마우스 스크롤 확대/축소 허용 |
| `size` | Size \| SizeLiteral | - | 초기 지도 크기 |
| `overlayZoomEffect` | null \| string | null | 오버레이 줌 효과 대상 |
| `tileSpare` | number | 0 | 여유 로딩 타일 수 |
| `tileTransition` | boolean | true | 타일 전환 페이드 인 효과 |
| `tileDuration` | number | 300~600 | 타일 전환 효과 지속 시간 (ms) |
| `zoom` | number | **16** | 초기 줌 레벨 (클수록 확대) |
| `zoomControl` | boolean | false | 줌 컨트롤 표시 |
| `zoomControlOptions` | ZoomControlOptions | - | 줌 컨트롤 옵션 |
| `zoomOrigin` | Coord \| CoordLiteral | null | 줌 효과 시 고정 기준 좌표 |
| `blankTileImage` | null \| string | null | 빈 타일 이미지 URL |
| `gl` | boolean | false | GL 벡터맵 활성화 (gl 서브모듈 필요) |
| `customStyleId` | string | - | Style Editor 커스텀 스타일 ID |
