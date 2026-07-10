# PR 체크리스트

모든 PR은 기능 구현 여부와 상관없이 이 문서의 관점으로 평가한다. GitHub PR 본문은
[`.github/pull_request_template.md`](../../.github/pull_request_template.md)를 사용하고, 이 문서는
템플릿 각 항목의 **기준과 해석**을 설명하는 단일 출처다.

> 포트폴리오 목표상 PR은 "무엇을·왜·어떻게" 바꿨는지 리뷰어가 코드를 열지 않고도 재구성할 수
> 있어야 한다. 시간 기록·테스트·리뷰를 항상 병행한다.

## 병합 전 통과 기준 (필수)

PR은 [검증 매트릭스](verification-matrix.md)의 CI 게이트를 통과해야 한다.

- `pnpm --filter web lint` — 린트·FSD 경계 위반 없음
- `pnpm --filter web build` — `tsc -b` 타입체크 + Vite 빌드 성공
- `pnpm --filter web test` — 테스트 통과

CI(`.github/workflows/test.yml`)가 PR→main에서 이 세 가지를 강제한다. 커밋 전 husky
`pre-commit`이 변경 파일에 `prettier --write` + `eslint --fix`를 돌린다([husky.md](../rules/tooling/husky.md)).

## 브랜치·커밋 규칙

- `main`에 직접 푸시하지 않는다. 항상 브랜치와 PR을 사용한다.
- 커밋 메시지는 conventional-commit prefix(`feat`/`fix`/`docs`/`test`/`refactor`/`build`/`ci`/`chore`)를 쓴다.
- 브랜치 이름은 `type/kebab-설명` 형식을 쓴다(예: `feat/station-arrival-sheet`).
- 변경은 논리적으로 완결되는 가장 작은 단위로 나눈다. 단, 중간 상태가 깨지는 분할은 하지 않는다
  ([Working Style](dev-workflow.md#working-style)).

## 전략 영향 평가

PR 설명에는 다음 질문에 대한 답이 있어야 한다.

```text
FSD 레이어 경계(app → pages → widgets → features → entities → shared 단방향)를 흐리지 않았는가?
슬라이스 공개 API(index.ts) 규칙을 지켰는가? 우회 import는 없는가?
데이터 페칭이 TanStack Query 규칙을 따르는가? (queryOptions·키 규칙)
지도 센터 이동이 map-center-policy 불변식을 지키는가? (해당 없으면 N/A)
서울 버스 API 가정을 실제 응답으로 선(先)검증했는가? 근거 없는 수치를 넣지 않았는가?
새 런타임 의존성이 추가되었다면 왜 지금 필요한가?
구현과 문서(.claude/rules·docs)가 같은 상태를 설명하는가?
```

## 사용자와 먼저 논의해야 하는 경우

PR 안에서 임의로 처리하지 않고 먼저 보고·논의한다.

- FSD 레이어 경계나 배치 원칙을 바꾸는 경우
- 지도 센터 이동 정책([map-center-policy.md](map-center-policy.md))을 바꾸는 경우
- 데이터 페칭·스타일링 규칙(TanStack Query, Tailwind)을 바꾸는 경우
- 새 런타임 의존성을 핵심 경로에 추가하는 경우
- ESLint 규칙을 추가·변경하는 경우([eslint.md](../rules/tooling/eslint.md))
- 실제 구현이 문서화된 전략과 달라지는 경우
- 자동 검증이 불가능한 구조를 받아들이는 경우(예: 테스트 불가 영역)
- 구현에 필요한 결정이 문서에 없고, 그 결정이 아키텍처·UX·의존성·API 계약에 영향을 주는 경우

한계를 숨기고 구현을 밀어붙이지 않는다. 예상하지 못한 한계나 문서와의 차이가 드러나면 즉시
보고한다.

## PR 설명 필수 항목

[`.github/pull_request_template.md`](../../.github/pull_request_template.md)의 항목을 **전부**
채운다. 해당 없는 항목도 비워 두지 말고 `N/A`로 명시하고 이유를 적는다. 각 항목의 의미:

- **개요** — 이 PR을 한 줄로 요약.
- **변경 사항** — 어떤 레이어/슬라이스를 변경했는지 실제 파일·컴포넌트·훅 이름으로. 동작을
  바꿨다면 Before → After.
- **선(先)검증** — API/데이터 가정을 어떻게 확인했는지. 실제 응답 값을 인용한다(추측 금지).
- **문서 정합성** — 관련 문서(.claude/rules·docs)를 함께 수정했는지, 안 했다면 왜 필요
  없었는지.
- **전략 영향 평가** — FSD 경계·슬라이스 공개 API·데이터 페칭·지도 정책과 충돌하는 부분,
  사용자 논의가 필요한 결정이 있었는지.
- **스크린샷** — UI 변경이 있으면 첨부.
- **한계 / 미검증** — 자동 검증이 안 된 영역(예: 브라우저 렌더 확인), 발견한 한계, 수동 검증
  방법.
- **체크리스트** — lint·build·vitest 통과, 선검증, 작은 커밋 단위 분리.

## 서술 수준

- 변경한 파일·컴포넌트·훅·타입을 **실제 식별자 이름**으로 짚고, 핵심 분기·엣지 케이스·실패
  경로를 글로 설명한다.
- 동작을 바꿨다면 **Before → After**를 대비해 적는다. API 응답·좌표 등 근거는 실측값을 그대로
  인용한다("추측 말고 캡처").
- 구조·흐름·상태 전이가 글로 설명하기 어려우면 GitHub가 렌더하는 ` ```mermaid ` 코드블록을
  넣는다. 레이아웃은 세로(`flowchart TD`)로 그려 PR 컬럼에서 가로 스크롤이 생기지 않게 한다.
