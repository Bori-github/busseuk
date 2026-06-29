# 개발 워크플로

기능 개발은 아래 **5단계 루프**를 따른다. 핵심 요약은 `CLAUDE.md`에 있고, 이 문서는 각 단계의 상세와 실제 사례를 담는다.

> 전제: `CLAUDE.md`의 "Working Style"(한 번에 하나씩 작은 커밋, 나눠서 확인받기)을 따른다.

---

## 1. 선(先)검증 — 설계 전에 데이터로 확인

설계·구현 전에 **실제 API/데이터를 직접 호출**해 가정을 검증한다. 응답 필드·좌표계·값의 의미를 추측하지 않는다. 공개 API 응답은 명세(`.claude/docs/api/`)와 다를 수 있다.

도구: `.claude/scripts/probe-bus-api.sh` (키는 `.env.local`에서 읽고 커밋하지 않음)

```bash
.claude/scripts/probe-bus-api.sh /buspos/getBusPosByRtid    busRouteId=100100118
.claude/scripts/probe-bus-api.sh /busRouteInfo/getRoutePath busRouteId=100100118
```

실제 사례:
- **명세 ≠ 응답**: 위치 API 명세상 `tmX/tmY`(WGS84)가 실제로는 `null`. 좌표는 `gpsX`(경도)/`gpsY`(위도)를 써야 함.
- **필드 의미 확인**: `rtDist`는 버스별 오프셋이 아니라 **노선 총거리**(모든 차량이 동일 값)였음 → 위치 계산에 못 씀.
- **수치는 측정으로**: "GPS를 노선 폴리라인에 투영하면 오차 대부분 0.1~0.7m" 는 실데이터 15대로 측정해 확인한 값.

## 2. 갭 분석 — 가능/불가능을 먼저 구분

레퍼런스/목표 대비, 우리 데이터·환경으로 **할 수 있는 것과 없는 것**을 명확히 나눠 먼저 알린다.

실제 사례(카카오 초정밀 버스 레퍼런스):
- 불가능: 전용 GNSS 기반 10cm/3초 정밀도 (공개 API는 일반 GPS + 5초 갱신)
- 가능: 노선 투영 + 보간 애니메이션으로 "도로 위를 부드럽게 달리는 버스" UX 재현

## 3. 페이즈 로드맵 — 작은 커밋, 토대부터

작업을 작은 커밋 단위로 쪼개고, **테스트 가능한 순수 함수 등 토대부터** 만든다. FSD 레이어 순서(`shared → entities → features → widgets → pages`)를 고려한다.

실제 사례(초정밀 버스):
1. 폴리라인 투영 유틸 (shared/lib, 순수 함수 — 유닛테스트로 검증)
2. 폴링 주기 단축 (entities/bus)
3. heading 회전 마커 (shared/ui)
4. 위젯 투영 + rAF 보간 애니메이션 (widgets)
5. 버스 선택 → 상세/내비 패널 (features 신규)

## 4. 단계별 검증 — 통과 + 확인받기

각 단계에서 다음을 **레포 루트에서** 통과시킨다. TypeScript·vitest는 `apps/web`에만 설치돼 있으므로 `pnpm --filter web`로 실행한다(루트에서 `npx tsc`/`npx vitest`를 직접 부르면 실패하거나 잘못된 설정으로 돈다):

```bash
pnpm --filter web lint
pnpm --filter web exec tsc --noEmit -p tsconfig.app.json   # 타입체크
pnpm --filter web test                                      # 테스트 (vitest run)
```

- 변경에 대한 테스트를 함께 추가한다 (예: `polyline.test.ts`).
- 기존 무관한 에러(예: 다른 미완성 기능의 타입 에러)는 내 변경과 구분해 보고한다.
- 되돌리기 어렵거나 위험한 경계(스키마/계약 변경, 파일 삭제, 외부 전송, 커밋)에서는 확인을 받는다.

## 5. 정직한 보고 — 한계 명시

수행하지 못한 검증을 한계로 명시한다.

실제 사례: 네이버맵 마커/폴리라인의 실제 렌더링은 브라우저가 필요해 코드만으로 단정하지 않음 → "dev 서버로 직접 확인 필요"로 보고. 또한 "안 보이던" 원인이 버그가 아니라 **심야 시간 운행 차량 0대**(데이터)였음을 데이터로 확인 후 정정.

---

## 관련

- 핵심 요약: `CLAUDE.md` → "개발 워크플로"
- API 명세: `.claude/docs/api/`
- 라이브 검증 스크립트: `.claude/scripts/`
