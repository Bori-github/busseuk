---
paths:
  - "apps/web/**/*.{ts,tsx}"
  - "apps/web/eslint.config.js"
---

# ESLint 규칙

설정 파일: `apps/web/eslint.config.js` (Flat Config). 실행: `pnpm --filter web lint`
(또는 루트 `pnpm lint`). 이 문서는 **각 규칙의 근거와 정책**을 설명한다.

> 이 문서는 컨벤션 근거를 정리한 것이다. 규칙 추가·변경(설정 파일 수정)은 별도 승인 후 진행한다.

- **강제 지점**: CI(`.github/workflows/test.yml`, PR→main)에서 `pnpm --filter web lint`로
  강제되고, 커밋 시 `lint-staged`가 변경 파일에 `eslint --fix`를 돌린다([husky.md](husky.md)).
- **포맷은 다루지 않는다**: 세미콜론·따옴표 등 포맷 규칙은 이 설정에 없다. 포맷은 Prettier
  소관이라 둘이 충돌하지 않는다([prettier.md](prettier.md)).

## 확장(extends)

| 프리셋 | 목적 |
| --- | --- |
| `@eslint/js` recommended | JS 기본 |
| `typescript-eslint` recommended | TS 타입 인지 린트 |
| `eslint-plugin-react-hooks` (flat recommended) | 훅 의존성·규칙 |
| `eslint-plugin-react-refresh` (vite) | HMR 안전(컴포넌트만 export) |

## 커스텀 규칙

### `func-style: ['error', 'expression', { allowArrowFunctions: true }]`

함수 선언문 대신 화살표 함수 표현식을 강제한다. 근거·예시:
[`code-style/typescript.md`](../code-style/typescript.md).
`*.d.ts`에서는 이 규칙을 **끈다**.

### FSD 경계 (`eslint-plugin-fsd-lint`)

`src/**/*.{ts,tsx}`(단, `src/main.tsx` 제외)에 적용. 레이어·슬라이스 규칙을 강제한다 →
[`architecture/fsd.md`](../architecture/fsd.md).

| 규칙 | 레벨 | 의미 |
| --- | --- | --- |
| `fsd/forbidden-imports` | error | 상위→하위 단방향 위반 금지 |
| `fsd/no-relative-imports` | error | 슬라이스 경계 넘는 상대경로 금지 |
| `fsd/no-public-api-sidestep` | error | 슬라이스 `index.ts` 우회 import 금지 |
| `fsd/no-cross-slice-dependency` | error | 같은 레이어 다른 슬라이스 직접 참조 금지 |
| `fsd/no-ui-in-business-logic` | error | 비즈니스 로직에 UI import 금지 |
| `fsd/no-global-store-imports` | error | 전역 스토어 직접 import 금지 |
| `fsd/ordered-imports` | warn | import 정렬 |

## 무시 대상

- `globalIgnores(['dist'])` — 빌드 산출물.
- `src/main.tsx` — FSD 규칙에서 제외하도록 설정돼 있으나, **실제 진입점은
  `src/app/index.tsx`이며 `src/main.tsx` 파일은 존재하지 않는다**. 이 ignore는 진입점이
  옮겨진 뒤 남은 stale 항목으로, 정리(`src/app/index.tsx`로 교체하거나 제거) 대상이다.

## 규칙을 바꾸고 싶다면

1. 이 문서에 **근거**(왜 필요/불필요한지)를 먼저 남긴다.
2. `apps/web/eslint.config.js`를 수정한다.
3. `pnpm --filter web lint`로 저장소 전체 영향 범위를 확인한다.
4. 기존 코드가 새 규칙과 충돌하면, 규칙 도입과 코드 정렬을 **별도 커밋**으로 나눈다.
