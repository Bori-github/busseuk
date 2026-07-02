# 애니메이션 라이브러리 도입 계획 (Framer Motion + GSAP)

> 목적: "복잡한 인터랙션"을 정당한 지점에 도입한다. **두 라이브러리를 각자의 강점 지점에
> 배치**해 적극 활용하되, 오버엔지니어링과 회귀 위험을 피한다.
> 상태: 계획만. 코드 변경 전.
> 이력: 초안은 BottomSheet 단독 Framer 마이그레이션 → 적대적 검증으로 뒤집힘(아래 "적대적 검증" 참조).

## 큰 원칙: 크기 vs 위치로 라이브러리를 가른다

- **크기(height)를 바꾸는 인터랙션 → GSAP.** 임의 숫자 속성을 애니메이션하고, `Draggable`을
  제스처 트래커로 분리할 수 있어 height 드래그에 자연스럽다.
- **위치(transform)를 옮기고 마운트/레이아웃을 다루는 선언형 인터랙션 → Framer Motion.**
  `AnimatePresence`·`layoutId`·variants가 React 결에 맞는다.

### 절대 규칙
**같은 DOM 엘리먼트에 두 라이브러리를 동시에 걸지 않는다.** 둘 다 `transform`/`style`을 직접
쓰므로 같은 노드에서 서로 덮어쓴다. → **컴포넌트 단위로 소유권을 100% 분리**한다.
바텀시트 = GSAP 전담(아래로 밀어 닫기 포함), 검색/오버레이/리스트 = Framer 전담.

---

## 역할 분담 (적용/비적용)

| 지점 | 라이브러리 | 근거 |
|---|---|---|
| `shared/ui/BottomSheet` peek↔full 높이 드래그·스냅·fling·drag-to-dismiss | **GSAP** | height 애니메이션 + `Draggable`(제스처) + `InertiaPlugin`(관성). Framer의 transform 벽이 없는 유일 지점 |
| 검색 버튼 → `SearchOverlay` shared-layout 확장 | **Framer** | `layoutId` FLIP은 Framer 시그니처. 첫 "복잡한 인터랙션" 쇼케이스 |
| `SearchOverlay` 진입/퇴장 | **Framer** | `AnimatePresence`. 지금 조건부 마운트라 트랜지션 없음(MapPage.tsx:147) |
| 검색/노선 리스트 stagger 진입 | **Framer** | `staggerChildren` variants |
| 버튼 탭·체크박스 토글 마이크로 인터랙션 | **Framer** | `whileTap`/`whileHover` |
| (선택) 앱 첫 진입 인트로 시퀀스 | **GSAP** | `timeline` 순차 연출 — GSAP 타임라인 강점을 쓰는 순수 지점(신규 기능) |
| `widgets/bus-map` 버스 마커 이동 / `busInterpolation.ts` | ❌ **둘 다 금지** | 실시간 재생 버퍼 도메인 로직. 트윈 시 오버슈트·백트래킹 회귀 |
| 마커 화살표 회전 (`createBusMarkerIcon.ts:54`) | ❌ 현행 유지 | 이미 CSS transition. 마커 DOM은 Naver SDK 소유(React 밖) |

---

## 적대적 검증 요약 (왜 BottomSheet가 무거운가)

초안은 "BottomSheet를 Framer로 옮기면 코드가 줄고 저위험"이라 봤으나, 검증 결과 뒤집혔다:

- **A1. Framer `drag`/`animate={{y}}`는 transform 전용.** 그런데 시트의 peek↔full은
  `height`를 키우는 인터랙션(`BottomSheetRoot.tsx:168-181`). Framer로는 재설계(transform 모델)
  또는 `useMotionValue`로 수동 구동해야 함 → "코드 감소" 주장 붕괴.
- **A2. height 모델은 스크롤 정합을 위해 의도된 것.** `BottomSheet.Content`가 `flex-1
  overflow-y-auto`(parts.tsx:67)라 시트 높이 = 스크롤 영역 높이. transform 모델로 바꾸면
  peek에서 화면 밖까지 스크롤되는 UX 붕괴.
- **A3. 드래그·진입·퇴장 상태가 `dragTranslateY`/`isExiting`/`isOpening`을 공유**(line 234-235,
  265-266). 반쪽 마이그레이션은 깨진 중간 상태 → CLAUDE.md "중간 상태가 깨지는 분할 금지" 위반.
  → **원자적 전체 재작성**이 강제됨.
- **B. Phase 동등-동작에서 멈추면 순손해**(번들만 늘고 사용자 이득 0). 작동·디버깅된 코드를
  버리는 비용도 계상해야 함.

**→ GSAP은 A1(transform 벽)이 없어 이 시트에 더 적합.** 단 A2는 무관(회피), A3·엣지 재검증은
GSAP도 동일(명령형 React 통합 비용으로 형태만 바뀜). 그래서 BottomSheet는 GSAP으로 하되
**스파이크로 먼저 검증** 후 진행한다.

---

## 0. 선(先)검증 — 착수 전 반드시 확인 (추정 금지)

- [ ] `framer-motion`·`gsap`의 **React 19.2 호환 버전** 확정.
- [ ] **GSAP `Draggable`·`InertiaPlugin` 라이선스/포함 여부** 현재 버전에서 확인
      (최근 전 플러그인 무료화됐으나 추정하지 않음).
- [ ] **jsdom/vitest**에서 두 라이브러리 동작 확인. Framer `AnimatePresence`의
      `onExitComplete`(→`onClose`) 발화 여부. 미발화 시 `MotionGlobalConfig.skipAnimations`
      또는 `duration:0` 분기. GSAP은 `useGSAP` cleanup·StrictMode 이중 실행 확인.
- [ ] **번들 baseline**: 도입 전 `pnpm build` 사이즈 기록(정직한 수치만).
- [ ] `prefers-reduced-motion` 대응(Framer `useReducedMotion` / GSAP은 분기).

## 갭 분석 — 보존해야 하는 공개 계약 (BottomSheet)

내부 구현만 교체하고 아래는 유지:

- `BottomSheet` props: `open, onOpenChange, onClose, peekHeight?, className?, handleClassName?`
- 컴파운드: `BottomSheet.Header/Title/Close/Content` (parts.tsx)
- 컨텍스트 값: `{ titleId, requestClose, isInteractive }` — parts가 의존
- `PEEK_HEIGHT_RATIO` export (`@shared/ui`) — MapPage.tsx:125 `bottomInset` 계산에 사용
- 접근성: `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-hidden`, 백드롭
- `onClose`는 **퇴장 애니메이션 완료 후** 호출 (현재 `onTransitionEnd`)
- 검증 대상 테스트: `StationInformationBottomSheet.test.tsx`, `MapPage.station-information.test.tsx`

---

## 페이즈 로드맵 (작은 커밋, 각 단계 lint·타입·test 통과)

저위험 Framer로 공통 리스크(번들·React19·jsdom)를 먼저 소진하고, 무거운 GSAP 바텀시트는
스파이크 검증 후 진입한다.

### Phase 1 — 선검증 + 의존성 토대
- `pnpm --filter web add framer-motion gsap`
- 테스트 setup 애니메이션 skip, 번들 baseline 측정, React19 호환 확정.
- 검증: 기존 전체 테스트 그린(UI 변경 없음).
- 커밋: `chore(deps): framer-motion·gsap 추가 및 테스트 환경 설정`

### Phase 2 — [Framer] SearchOverlay 진입/퇴장
- MapPage `{isSearchOpen && ...}`(MapPage.tsx:147)를 `AnimatePresence`로 감싸 슬라이드/페이드.
- 저위험. Framer 학습 vehicle.
- 커밋: `feat(search): 검색 오버레이 진입/퇴장 트랜지션(framer-motion)`

### Phase 3 — [Framer] 검색 버튼 → 오버레이 shared-layout 확장
- 상단 검색 버튼(MapPage.tsx:132)과 `SearchOverlay`를 `layoutId`로 연결(FLIP 확장).
- 첫 "복잡한 인터랙션" 쇼케이스.
- 커밋: `feat(search): 검색 버튼→오버레이 공유 레이아웃 확장`

### Phase 4 — [Framer] 리스트 stagger + 마이크로 인터랙션
- SearchList / 노선 리스트 진입 stagger, 버튼·체크박스 `whileTap`.
- 커밋: `feat(ui): 리스트 진입 stagger·탭 마이크로 인터랙션`

### Phase 5 — [GSAP] BottomSheet 스파이크(검증용, 폐기 가능)
- height 드래그를 `Draggable`(제스처) + `gsap.quickSetter('height')`로 프로토타입.
- **스크롤 정합(A2)·스냅(`snapMidpoint`)·`useGSAP` cleanup/StrictMode** 확인.
- 통과 못 하면 여기서 중단하고 현행 시트 유지(회귀 방지).

### Phase 6 — [GSAP] BottomSheet 정식 재작성 (원자적 단일 커밋)
- `BottomSheetRoot.tsx` 전체 재작성. 공개 계약(갭 분석) 보존.
- `InertiaPlugin` fling + 스냅 + drag-to-dismiss(아래로) 모두 GSAP 소유.
- **되돌리기 어려운 경계 → 확인받기.**
- 검증: 두 테스트 그린 + 브라우저 수동 스모크(터치 포함).
- 커밋: `refactor(ui): BottomSheet를 GSAP 드래그·스냅·관성으로 재구현`

### Phase 7 — (선택) [GSAP] 앱 인트로 타임라인
- 첫 진입 스플래시/온보딩을 `gsap.timeline`으로 순차 연출(신규 기능).

---

## 정직한 보고 항목 (완료 시 명시)

- jsdom에서 애니메이션 skip 처리 시 "닫힘/드래그 애니메이션 자체는 자동 테스트 미검증,
  브라우저 수동 확인" 명시.
- 번들 사이즈 증가 실측치(두 라이브러리 각각). `LazyMotion`/`m`, GSAP 부분 임포트로 최소화.
- 브라우저 렌더·터치 확인은 수동 → 한계로 기록.
- Phase 5 스파이크가 A2(스크롤) 문제를 못 풀면 BottomSheet 미진행 사실을 그대로 보고.

## 관련
- 지도 센터 정책: `.claude/docs/map-center-policy.md` (BottomSheet `bottomInset`이 패닝에 영향)
- 개발 워크플로: `.claude/docs/dev-workflow.md`
