# 버스 마커 애니메이션(지연 재생 보간) 정책

버스 마커의 부드러운 이동은 **여러 파일에 걸친 cross-cutting 설계**다
([map-center-policy.md](map-center-policy.md)와 같은 이유로 문서로 승격).
이 문서는 **불변식과 결정 근거**의 단일 출처이고, 상수의 **현재 값과 세부 튜닝 근거**는
각 코드 주석을 단일 출처로 둔다(값을 여기 복제하지 않는다 — 드리프트 방지).

## 모델 요약

폴링(버스 위치 5초 주기)으로 받은 실측을 차량별 `{s(노선 누적거리 m), t(관측시각)}` 버퍼에
쌓고, 화면은 실시간보다 약간 뒤인 **재생 클럭(playTime)** 을 둬 클럭을 사이에 두는 **두 실측을
선형 보간**해 재생한다. 좌표·heading은 노선 폴리라인 위 누적거리로부터 얻는다.

```text
5초 폴 → raw GPS → 폴리라인 투영(s) → 버퍼 push → rAF 루프가 playTime 기준 보간 → 마커 이동·회전
```

## 불변식 (바꾸려면 사용자 논의 필요)

1. **예측(extrapolation) 금지.** 재생 클럭은 최신 실측 시각을 절대 넘지 않는다(클램프).
   미래 추정은 감속 시 오버슈트→백트래킹(마커가 되돌아옴)을 만들기 때문에 원천 금지한다.
   데이터가 끊기면 마커는 **그 자리에 정지(freeze)** 하는 것이 올바른 동작이다.
2. **재생 클럭은 목표 지연을 유지하고, 초과 지연은 캐치업(>1배속)으로만 회수한다.**
   목표 지연을 폴 간격과 같게 두면 지터에 언더런(스터터)이 생기므로 폴 간격보다 크게 둔다
   (`TARGET_LAG_MS` — 근거는 `busInterpolation.ts` 주석).
3. **비정상 관측은 보간하지 않고 스냅한다.** 한 폴 사이 이동거리가 임계
   (`SNAP_THRESHOLD_M`, 실데이터 측정 기반) 초과, 또는 관측 공백이 임계(`STALE_GAP_MS`)
   초과면 버퍼를 리셋한다. 미세 후퇴(`JITTER_TOLERANCE_M` 이하)는 정지로 처리한다.
4. **투영 이탈이 크면 raw GPS를 쓴다.** raw GPS를 폴리라인에 투영할 때 이탈이 임계
   (`BusMapWidget.tsx`의 `MAX_SNAP_ERROR_M`)를 넘으면(우회·U턴·노이즈) 투영을 버린다 —
   도로선 위 엉뚱한 지점에 스냅되는 것보다 raw 표시가 낫다. 투영 시 직전 관측 s를 힌트로
   넘겨 순환·왕복 노선에서 반대편 구간 락온을 막는다.
5. **보간 모델(`busInterpolation.ts`)은 순수 모듈로 유지한다.** naver/React 의존을 넣지
   않는다 — 유닛테스트 가능성이 이 설계의 검증 수단이다.
6. **애니메이션은 지도 센터를 움직이지 않는다** → [map-center-policy.md](map-center-policy.md).
7. **쿼터 절약 게이팅과 한 몸이다.** 버스 마커가 안 보이는 줌(`BUS_MARKER_MIN_ZOOM` 미만)
   에서는 위치 폴링 자체를 끈다(`enabled` 게이팅). 폴링 재개 시 오랜 공백은 불변식 3의
   `STALE_GAP_MS` 리셋이 흡수한다.

## 금지 (과거에 배제한 설계)

- ~~속도 기반 미래 예측~~ → 오실레이션(불변식 1).
- ~~폴 즉시 마커 순간이동~~ → 5초마다 점프하는 UX. 지연 재생이 이를 해소한 설계다.
- ~~프레임마다 전체 버퍼/DOM 재탐색~~ → 화살표 DOM 핸들·최신 실측 시각은 캐시한다
  (rAF 루프 성능, `BusMapWidget.tsx` 주석).

## 관련 파일

- `apps/web/src/widgets/bus-map/lib/busInterpolation.ts` — 보간 모델·상수(단일 출처)·근거 주석
- `apps/web/src/widgets/bus-map/lib/busInterpolation.test.ts` — 모델 유닛테스트
- `apps/web/src/widgets/bus-map/ui/BusMapWidget.tsx` — rAF 루프·투영·마커 반영·줌 게이팅
- `apps/web/src/shared/lib/polyline.ts` — 폴리라인 투영·`pointAtDistance` (순수 유틸)
- `apps/web/src/entities/bus/model/queries.ts` — 위치 5초 폴링·`enabled` 게이팅

## 검증

- 보간 모델: `busInterpolation.test.ts` (vitest — CI 게이트).
- 실제 렌더(부드러움·정지·스냅): 브라우저 수동 확인 —
  [검증 매트릭스](verification-matrix.md) "네이버맵 실제 렌더" 항목과 동일한 한계.
