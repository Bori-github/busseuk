# .claude/hooks — Claude Code 검증 훅

Claude Code가 코드를 만질 때 컨벤션([`../rules/`](../rules/README.md))을 자동으로 지키게 하는
훅이다. husky(git 커밋 시)·CI(PR 시)와 **시점이 다른 보조 게이트**다. 파일명은 실행하는
도구를 그대로 따른다(`prettier.sh`, `eslint.sh`).

| 게이트 | 시점 | 담당 | 권위 |
| --- | --- | --- | --- |
| 이 훅(`prettier.sh`) | Claude **편집 직후** | 포맷 자동정리 | 보조 |
| 이 훅(`eslint.sh`) | Claude **턴 종료 시** | 규칙 위반 보고 | 보조 |
| husky `pre-commit` | **git 커밋 시** | 포맷+린트(변경 파일) | 보조 |
| CI (`test.yml`) | **PR→main** | lint·타입·테스트 | **권위** |

> 훅은 "Claude가 만드는 코드를 깨끗하게 유지"하는 편의 장치다. **품질의 최종 권위는 CI**이고,
> 타입체크·테스트는 여기 넣지 않는다(무겁고 CI와 중복).

## 등록 방식 (중요)

훅은 이 디렉터리에 파일을 두는 것만으로 동작하지 않는다. **[`../settings.json`](../settings.json)의
`hooks` 키**에 등록해야 발화한다(Claude Code의 훅은 `settings.json`으로 배선된다). 이 폴더는
스크립트 *보관소*일 뿐이다.

## 1. `prettier.sh` — PostToolUse (편집 시점 포맷)

- **언제**: `Edit`/`Write`/`MultiEdit` 도구 호출 **직후마다**(matcher로 제한).
- **무엇**: 워킹트리에서 변경된 `apps/web/**`의 `.ts,.tsx,.css`를 찾아 `prettier --write`.
- **토큰**: `exit 0` + stdout 없음 → Claude 컨텍스트에 안 들어감 → **0 토큰**. 조용히 정리만 한다.
- **효과**: lint-staged가 커밋 시 하는 포맷을 편집 시점으로 앞당겨, 편집이 늘 포맷된 상태 유지.

## 2. `eslint.sh` — Stop (턴 종료 시 검증)

- **언제**: Claude가 한 턴(당신의 프롬프트 1개에 대한 에이전트 루프 전체)을 마칠 때 **1회**.
  - Stop 훅은 matcher를 지원하지 않아 **변경이 없어도 매 턴 무조건 발화**한다. 그래서
    스크립트가 **self-gate**한다 → `git`으로 `apps/web`의 변경 `.ts,.tsx`가 없으면 즉시
    `exit 0`. **순수 대화 턴은 0 토큰.**
- **무엇**: 변경 파일만 `pnpm --filter web exec eslint`로 검사. 자동수정 불가한 위반
  (`func-style`, `import type`, **FSD 경계**, 미사용 심볼 등)을 잡는다. 포맷은 1번이 이미 처리.
- **위반 시**: `exit 2`로 위반 목록을 stderr에 실어 Claude에 피드백 → **같은 턴에서 수정**.
  **토큰은 위반이 있을 때만** 발생한다.
- **루프 방지**: 입력 JSON에 `stop_hook_active`가 참이면(= Stop 훅 때문에 이어달리는 중)
  다시 막지 않고 통과시킨다.
- **경고(warn) 규칙**: `fsd/ordered-imports`(warn)은 여기서 막지 않는다. import 정렬은 커밋 시
  lint-staged의 `eslint --fix`가 자동 정리한다.
- **검사 범위**: `eslint.config.js`에 인코딩된 error 규칙만 잡는다. 문서(`rules/`)의 컨벤션 중
  네이밍·`import type`·TanStack Query·Tailwind·map-center 같은 의미/아키텍처 규칙은 lint에
  없으면 여기서 안 잡히고 리뷰 몫으로 남는다.
- **인프라 가드**: `pnpm`이 PATH에 없거나 의존성이 설치되지 않았으면(예: `pnpm install` 전의
  fresh clone) **조용히 통과(exit 0)**한다. 도구 부재는 "위반"이 아니라 "실행 불가"이므로,
  toolchain이 다른 팀원이 매 턴 거짓 차단되는 것을 막는다.

## 설계 근거 (왜 이 시점인가)

훅 출력이 토큰을 쓰는 건 **실패해서 Claude 컨텍스트로 피드백될 때뿐**이다(`exit 0`의 stdout은
컨텍스트에 안 들어간다). 그래서:

- **자동수정 가능한 것(포맷)**은 편집 즉시 **조용히**(0 토큰) 고친다 → `PostToolUse`.
- **수정 불가한 위반**은 가장 낮은 빈도로 · **변경이 있는 턴에만** · **실패만** 보고한다 →
  `Stop` + self-gate. 편집마다(`PostToolUse`) 린트하면 같은 위반을 중복 보고하고 tsc/eslint를
  N번 돌려 낭비다.

## 우회 / 끄기

- **일시 우회**: `eslint.sh`는 자문(advisory)이라 커밋을 막지 못한다. 정말 급하면
  훅을 잠시 끄거나 `settings.json`에서 해당 항목을 제거한다.
- **완전 비활성화**: `../settings.json`의 `hooks`에서 해당 블록을 지운다.

## 이식성 메모

- macOS 기본 `/bin/bash`가 3.2라 스크립트는 **POSIX `sh`**로 작성했다(`mapfile`·연관배열 미사용).
- JSON 파서(jq) 의존을 피하려 훅 입력을 파싱하지 않고 **git으로 변경 파일을 탐색**한다.
- `prettier`/`eslint`는 `pnpm exec`로 실행한다(Claude Code를 실행한 셸 환경의 PATH를 상속).
  `pnpm`/의존성이 없으면 두 훅 모두 **하드블록하지 않고 조용히 스킵**한다(prettier는 `|| true`,
  eslint는 인프라 가드).
