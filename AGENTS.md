# busseuk 에이전트 인덱스

이 문서는 busseuk에서 작업하는 에이전트(Claude Code·Cursor·Codex 등)가 가장 먼저 읽는
진입점이다. 규칙·설명·정책·수치·명령은 아래 링크된 상세 문서를 단일 출처로 두며, 규칙을
바꿀 때도 이 인덱스가 아니라 상세 문서를 갱신한다.

`.claude/rules/` 문서는 "이렇게 되어 있다"가 아니라 **지향하는 표준(prescriptive)** 이다.
기존 코드가 규칙과 다르면 문서를 먼저 신뢰하고, 코드 정렬은 별도 작업으로 분리한다.

## docs (`.claude/docs/`)

- [dev-workflow.md](.claude/docs/dev-workflow.md) — Working Style·기능 개발 5단계 루프
- [project-structure.md](.claude/docs/project-structure.md) — FSD 배치·테스트 배치
- [verification-matrix.md](.claude/docs/verification-matrix.md) — 영역별 검증 방법·게이트
- [pr-checklist.md](.claude/docs/pr-checklist.md) — PR 평가 기준·설명 양식 (GitHub 양식: [pull_request_template.md](.github/pull_request_template.md))
- [map-center-policy.md](.claude/docs/map-center-policy.md) — 지도 센터 이동 불변식
- [api/](.claude/docs/api/) — 서울 버스 API 응답·계약
- [naver-map/map-options.md](.claude/docs/naver-map/map-options.md) — 네이버맵 MapOptions 레퍼런스

## rules (`.claude/rules/`)

- [architecture/overview.md](.claude/rules/architecture/overview.md) — 기술 스택·버전·루트 명령·환경·모노레포·CORS·시크릿
- [architecture/fsd.md](.claude/rules/architecture/fsd.md) — 레이어·참조 방향·슬라이스 규칙
- [architecture/data-fetching.md](.claude/rules/architecture/data-fetching.md) — TanStack Query
- [architecture/styling.md](.claude/rules/architecture/styling.md) — Tailwind CSS v4
- [code-style/](.claude/rules/code-style/) — TypeScript·React·코드 품질
- [tooling/](.claude/rules/tooling/) — ESLint·Prettier·Husky

## 규칙 우선순위 (충돌 시)

1. [Working Style](.claude/docs/dev-workflow.md#working-style) — 원자적·작은 단위·확인 경계
2. [docs](#docs-claudedocs) 도메인 정책 — 센터 이동, API 검증 등
3. [rules](#rules-clauderules) 관심사별 규칙
