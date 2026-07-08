---
paths:
  - 'apps/web/**'
  - '.prettierrc.json'
---

# Prettier (포맷)

코드 포맷은 **Prettier**가 단독으로 담당한다. 세미콜론·따옴표·줄바꿈·들여쓰기 등
"어떻게 보이는가"는 사람이 손대지 않고 Prettier에 맡긴다. (규칙 위반 여부를 따지는
ESLint와 역할이 분리된다 → [eslint.md](eslint.md).)

## 설정

루트 `.prettierrc.json`:

```json
{
  "singleQuote": true,
  "printWidth": 140
}
```

- `singleQuote: true` — 작은따옴표.
- `printWidth: 140` — 한 줄 최대 폭. 나머지(세미콜론·`trailingComma: all`·`tabWidth: 2`
  등)는 Prettier 기본값을 따른다.
- 포맷 제외 대상은 루트 `.prettierignore`(빌드 산출물·잠금파일 등).

## ESLint와 충돌하지 않는 이유

`apps/web/eslint.config.js`에는 **스타일/포맷 규칙(semi·quotes·indent 등)이 없다.**
따라서 Prettier와 ESLint가 같은 줄을 두고 다투지 않는다. `eslint-config-prettier` 없이도
안전하다. (포맷 규칙을 ESLint에 새로 추가하지 말 것 — 포맷은 Prettier 소관.)

## 적용 경로 (세 곳이 동일 결과)

같은 `.prettierrc.json`을 쓰므로 아래 세 지점의 포맷 결과가 일치한다.

1. **에디터 저장 시** — VS Code/Cursor의 `esbenp.prettier-vscode`가 프로젝트 설정을 우선
   적용(사용자 `prettier.*`는 설정 파일이 없을 때만 fallback).
2. **커밋 시** — `lint-staged`가 스테이징 파일에 `prettier --write` ([husky.md](husky.md)).
3. **수동** — `pnpm exec prettier --write "apps/web/**/*.{ts,tsx,css}"`.

세 경로 모두 `apps/web` 하위 `.{ts,tsx,css}`를 대상으로 한다(lint-staged 글롭과 동일 범위라
`vite.config.ts` 등 `src` 밖 파일도 함께 포맷된다). `.prettierignore`로 제외한 대상은 공통 적용.

## 확인

```bash
pnpm exec prettier --check "apps/web/**/*.{ts,tsx,css}"
```

## 설정을 바꿀 때

`printWidth` 등을 바꾸면 `apps/web` 하위 대상 파일 전체가 재포맷돼 큰 diff가 난다. 이런 변경은
**포맷 전용 커밋으로 분리**하고, 바꾼 뒤 `lint`·타입체크·`test`·`build`를 통과시킨다.
에디터 사용자 설정(`prettier.*`)도 함께 맞춰 세 경로의 결과를 일치시킨다.
