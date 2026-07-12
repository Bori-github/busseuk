# UI 애니메이션 라이브러리 정책

이 앱의 UI 애니메이션은 **framer-motion 하나만** 쓴다. **GSAP은 도입하지 않는다** —
실제로 구현·측정한 뒤 채택하지 않기로 결정했다(근거: 아래 "GSAP 미채택").

지도 버스 마커의 이동·회전은 이 문서가 아니라
[bus-animation-policy.md](bus-animation-policy.md)가 단일 출처다(도메인 로직이라 성격이 다르다).

## 채택: framer-motion

`app/App.tsx`에서 `LazyMotion(domAnimation, strict)` + `MotionConfig(reducedMotion="user")`로
감싼다. `strict`는 무거운 `motion` 대신 경량 `m` 컴포넌트만 허용해 번들을 줄인다.

| 지점                           | 쓰는 것                                             |
| ------------------------------ | --------------------------------------------------- |
| `SearchOverlay` 진입/퇴장      | `AnimatePresence` + `m.div` 페이드                  |
| 검색·최근검색·노선 리스트 진입 | `staggerChildren` variants (`shared/lib/motion.ts`) |
| 버튼·체크박스 탭 피드백        | `whileTap`                                          |

**`domAnimation` 피처셋을 벗어나지 않는다.** `layoutId`·`drag`는 `domMax`가 필요해 번들이
커지므로, 그걸 요구하는 연출은 도입 전에 비용을 먼저 따진다.

번들 실측(gzip): 도입 전 144.60 kB → 현재 172.39 kB (**+27.8 kB**).

## BottomSheet — 라이브러리를 쓰지 않는다

`shared/ui/BottomSheet`는 포인터 이벤트 + CSS transition으로 직접 구현한다.

peek↔full은 **transform이 아니라 `height`를 움직인다.** 시트 높이가 곧 본문
(`BottomSheet.Content`, `overflow-y-auto`)의 스크롤 영역 높이이기 때문이다. transform 모델로
바꾸면 peek 상태에서 화면 밖까지 스크롤되어 UX가 깨진다. **이 모델은 의도된 것이므로
"라이브러리가 transform만 지원한다"는 이유로 바꾸지 않는다.**

드래그 목적지 판정은 **거리 + 속도**로 한다. 최근 구간의 포인터 이동으로 속도(px/ms)를 내고,
손을 뗀 속도로 조금 더 갔을 지점을 임계값과 비교한다. 거리만 보면 짧고 빠른 플릭이 임계값에
못 미쳐 무시된다(체감상 "안 먹는다"). 상수의 현재 값은 `BottomSheet/context.ts`가 단일 출처다.

## GSAP 미채택 — 근거

BottomSheet의 height 드래그에 GSAP(`Draggable` + `InertiaPlugin`)을 실제로 구현하고 브라우저에서
측정한 결과, **성능 이득이 없고 번들만 늘어** 채택하지 않았다.

### 성능: 차이 없음

노선 23개 정류장(가장 무거운 조건), 실측 60Hz, 300px 드래그 위/아래 각 3회.

| 지표               | CSS transition | GSAP    |
| ------------------ | -------------- | ------- |
| 프레임 간격 중앙값 | 16.7 ms        | 16.7 ms |
| p95                | 17.5 ms        | 17.6 ms |
| 50 ms 초과 프레임  | 0건            | 0건     |

**둘 다 60fps를 유지한다.** `height` 변경 1회당 레이아웃 비용도 최악 0.2 ms(프레임 예산의 약 1%)라,
애초에 프레임을 흘릴 만한 부하가 아니다. "height는 레이아웃을 유발하니 무겁다"는 일반론은
이 앱 규모(시트 안 20여 줄)에서 성립하지 않는다.

### 비용: 번들 +43 kB

gzip 172.26 → 215.62 kB (**전체 +49%**). GSAP 코어 + `Draggable` + `InertiaPlugin`.

### GSAP이 준 유일한 가치는 의존성 없이 얻을 수 있었다

속도 기반 플릭 판정 하나였고, 기존 포인터 코드에 속도 계산 **약 20줄**을 더해 동일하게
구현했다. 43 kB를 지불할 근거가 없다.

### 애초에 이 앱에는 GSAP이 살 자리가 없다

이 앱의 인터랙션 어휘는 **나타남·사라짐·드래그·스크롤**이고, 이는 framer-motion의 영역이다.
GSAP의 강점과 겹치는 지점이 없다:

- **타임라인 안무** — 여러 요소가 시간축으로 얽히는 연출이 없다. 인트로 스플래시 같은 걸
  "GSAP을 쓰려고" 만드는 것은 순서가 거꾸로다.
- **SVG/canvas·MotionPath** — 유일한 후보인 지도 버스 마커는 5초 주기 **실측 데이터의 재생**이다.
  트윈으로 위치를 지어내면 오버슈트·백트래킹이 생긴다. 성능이 아니라 **정확성** 문제라 금지다
  ([bus-animation-policy.md](bus-animation-policy.md)).
- **ScrollTrigger** — 스크롤로 전개되는 긴 페이지가 없다.

## 다시 검토해도 되는 조건

아래 중 하나가 실제로 생기면 그때 다시 따진다. **그 전에는 재론하지 않는다.**

- 여러 요소를 정밀한 시간축으로 안무해야 하는 화면이 생긴다(되감기·배속·구간 점프 포함).
- SVG/canvas 기반 시각화가 생기고, 그 위 애니메이션이 DOM 밖 값에 걸린다.
- 스크롤 위치에 애니메이션을 붙들어 매는 화면이 생긴다.

## 정직한 보고 기준

- 드래그·속도·연출은 **jsdom에 레이아웃이 없어 자동 테스트로 검증되지 않는다.** 브라우저 수동
  확인으로 대체하고, 그 사실을 PR·커밋에 명시한다.
- 성능 개선을 주장하려면 **측정치를 함께 낸다.** 근거 없는 "부드러워졌다"는 쓰지 않는다.
- 번들 증감은 실측치(gzip)로 기록한다.

## 관련

- [bus-animation-policy.md](bus-animation-policy.md) — 지도 버스 마커 보간(도메인 로직)
- [map-center-policy.md](map-center-policy.md) — BottomSheet `bottomInset`이 지도 패닝에 영향
- [dev-workflow.md](dev-workflow.md) — 선검증·갭분석·정직한 보고
