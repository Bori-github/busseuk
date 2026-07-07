# 파일/폴더 구조

busseuk 모노레포의 폴더 구조와 배치 원칙이다. FSD 레이어 규칙 자체는
[아키텍처/FSD](../rules/architecture/fsd.md)를 단일 출처로 두고, 이 문서는 **실제 어디에
무엇이 있는지**를 추적한다. 코드와 달라지면 이 문서를 함께 갱신한다.

## 원칙

- `apps/web/src`는 FSD 레이어(`app → pages → widgets → features → entities → shared`)를
  따르고, 참조는 상위→하위 단방향이다. 이 경계는 `eslint-plugin-fsd-lint`가 강제한다.
- 슬라이스 공개 API는 `index.ts`(barrel)로 노출하고, 슬라이스 내부 파일을 우회 import 하지
  않는다(`fsd/no-public-api-sidestep`).
- 한 슬라이스가 서로 무관한 책임을 갖기 시작하면 파일을 목적별(`api`·`model`·`ui`·`hooks`·
  `lib`)로 나눈다.
- 테스트(`*.test.ts(x)`)는 검증 대상 파일 옆에 co-locate 한다.
- 공유 패키지가 필요해지면 `packages/`에 두고 `apps/web`에서 workspace 의존으로 참조한다
  (`packages/` 디렉터리는 아직 없다 — 워크스페이스 글롭만 선언돼 있고, 첫 공유 패키지를
  만들 때 생성한다).

## 모노레포 구조

```text
busseuk/
  apps/
    web/                 메인 웹 앱 (React 19 + Vite 8 + TypeScript)
  packages/              공유 패키지 (디렉터리 아직 없음 — 필요 시 생성)
  .claude/               에이전트용 규칙·문서·훅·스크립트
  .github/workflows/     CI (test.yml — lint·build·test)
  AGENTS.md              에이전트 진입점(인덱스)
  CLAUDE.md              AGENTS.md로 향하는 얇은 포인터
```

루트 명령·환경·프록시 정책은 [architecture/overview.md](../rules/architecture/overview.md)를 단일 출처로 둔다.

## 웹 소스 구조 (FSD)

```text
apps/web/src/
  app/                 앱 초기화 — 진입점, 프로바이더, 레이아웃
    providers/           전역 프로바이더(QueryClient 등)
    layouts/             공통 레이아웃
  pages/               라우트 단위 화면
    map/ui/              지도 페이지
  widgets/             페이지를 구성하는 독립 UI 블록
    bus-map/
      ui/                지도·마커 렌더 컴포넌트
      lib/               버스 위치 보간 등 위젯 로컬 로직
  features/            사용자 상호작용 단위 기능
    search/              정류장/노선 검색 (model·ui)
    selected-routes/     선택한 노선 표시 (ui)
    station-information/  정류장 상세/도착 정보 (ui)
    user-location/       현재 위치 (hooks)
  entities/            도메인 모델·API
    bus/                 버스 위치 (api·model)
    station/             정류장/노선 (api·model)
  shared/              레이어 무관 공용 코드
    api/                 API 클라이언트(axios 기반 busClient 등)
    config/              환경/상수
    lib/                 순수 유틸(polyline 등)
    ui/                  공용 컴포넌트(BottomSheet, naver 지도 래퍼 등)
    icons/               아이콘
    types/               공용 타입
    test/                테스트 헬퍼(queryWrapper 등)
```

진입점은 `src/app/index.tsx`다(`src/main.tsx`는 존재하지 않는다).

정적 자원은 `apps/web/public/`(favicon.svg·icons.svg)에 둔다. 소스 내 정적 자원 세그먼트
(`shared/assets` 등)는 현재 없으며, 필요해지면 사용하는 슬라이스 기준으로 배치를 결정한다.

## 테스트 배치

테스트는 별도 트리로 모으지 않고 **검증 대상 파일 옆에** 둔다. 공용 헬퍼만 `shared/test`에 둔다.

```text
shared/lib/polyline.test.ts
shared/api/busClient.test.ts
entities/station/api/getStationInformation.test.ts
features/.../ui/*.test.tsx
widgets/bus-map/lib/busInterpolation.test.ts
pages/map/ui/MapPage.station-information.test.tsx
shared/test/queryWrapper.tsx   # QueryClientProvider로 감싸는 테스트 래퍼
```

vitest 설정은 `apps/web/vite.config.ts`의 `test` 블록에 있다(`environment: 'jsdom'`).

## .claude 구조

```text
.claude/
  rules/               관심사별 컨벤션(architecture·code-style·tooling) — 목록은 AGENTS.md
  docs/                상세·정책 문서 — 목록은 AGENTS.md
  hooks/               Claude Code 검증 훅(prettier.sh·eslint.sh) — 설계·레퍼런스는 README
  scripts/             라이브 API 검증 스크립트(probe-bus-api.sh)
  commands/            사용자 슬래시 커맨드(create-issue.md)
```

## 새 코드를 추가할 때

- 기능이 어느 레이어에 속하는지 먼저 판단한다([fsd.md](../rules/architecture/fsd.md)의 배치 기준).
- 슬라이스를 새로 만들면 `index.ts`로 공개 API를 노출한다.
- 테스트를 함께 추가하고(같은 폴더), `pnpm --filter web exec vitest run`으로 통과시킨다.
- 검증 경로(lint·타입·테스트)는 [검증 매트릭스](verification-matrix.md)를 따른다.
