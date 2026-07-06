---
paths:
  - ".husky/**"
  - "package.json"
  - ".github/workflows/**"
---

# Husky (git 훅)

커밋 시점에 자동으로 품질 게이트를 걸어, 포맷·린트가 어긋난 코드가 커밋되지 않게 한다.
Claude Code의 훅([`.claude/hooks/`](../../hooks/README.md))이 "Claude가 코드를 만질 때" 검증이라면,
husky는 "git 커밋 시" 검증으로 서로 보완한다(Claude 훅의 시점·self-gate·토큰 설계는
[`.claude/hooks/README.md`](../../hooks/README.md) 참고).

> **현재 상태: 설치·배선 완료.** `husky@9` + `lint-staged@17`이 루트에 설치돼 있고,
> `.husky/pre-commit`이 동작한다. 아래는 현재 구성 그대로다.

## 구성

모노레포 루트(git 루트)에 설치돼 있다.

- 루트 `package.json`
  ```jsonc
  {
    "scripts": {
      "prepare": "husky"        // clone 후 pnpm install 시 훅 자동 설치
    },
    "lint-staged": {
      "apps/web/**/*.{ts,tsx}": [
        "prettier --write",
        "pnpm --filter web exec eslint --fix"
      ],
      "apps/web/**/*.css": ["prettier --write"]
    }
  }
  ```
- `.husky/pre-commit`
  ```sh
  pnpm exec lint-staged
  ```

## 동작

`git commit` 시 `lint-staged`가 **스테이징된 `apps/web` 파일만** 대상으로:

1. `prettier --write` — 포맷 자동 정리 (설정: 루트 `.prettierrc.json`, [prettier.md](prettier.md))
2. `pnpm --filter web exec eslint --fix` — import 정렬 자동수정 + 규칙 위반 시 커밋 차단

수정된 결과는 자동으로 다시 스테이징된다. 전체가 아닌 변경 파일만 보므로 빠르다.

## 모노레포 주의점 (실제로 겪은 것)

- lint-staged는 글롭을 **git 루트 기준**으로 매칭한다. 그래서 config는 **루트
  `package.json`**에 두고 글롭도 `apps/web/**`처럼 루트 기준으로 쓴다. (config를 `apps/web`에
  중첩하고 `src/**`로 쓰면 매칭되지 않았다.)
- eslint는 flat config를 cwd에서 찾으므로, `pnpm --filter web exec eslint`로 **cwd를
  `apps/web`으로** 맞춰 실행한다(그래야 `apps/web/eslint.config.js`를 찾는다).

## pre-push는 두지 않는다

타입체크·테스트는 CI가 강제한다([검증 매트릭스](../../docs/verification-matrix.md)). 커밋마다
무거운 pre-push를 걸면 마찰만 커지고 CI와 중복된다. husky는 커밋 시점의 빠른 포맷·린트 보조로 한정한다.

## 원칙

- **pre-commit은 빠르게** — 변경 파일만 `prettier --write` + `eslint --fix`.
- 훅은 우회 가능하다: 긴급 시 `git commit --no-verify`. 상시 우회는 금지.
  (도구 자체를 도입/변경해 lint-staged 설정이 일시적으로 비는 커밋 등, 검증이 무의미한
  경우에만 예외적으로 우회한다.)
- 명령은 `apps/web`에 설치된 도구를 쓰므로 eslint는 `pnpm --filter web exec`로 실행한다.
