---
paths:
  - 'apps/web/**/*.{ts,tsx}'
---

# TypeScript / JS 코드 스타일

린트로 강제되는 항목은 [`tooling/eslint.md`](../tooling/eslint.md)에 근거가 있다. 여기서는
저장소 전반의 스타일 컨벤션을 모은다.

## 함수 선언 — 표현식(화살표) 우선

`func-style: ['error', 'expression', { allowArrowFunctions: true }]`.

```ts
// ✅ 화살표 함수 표현식
export const toRad = (deg: number) => (deg * Math.PI) / 180

// ❌ 함수 선언문 (린트 에러)
export function toRad(deg: number) { … }
```

예외: `*.d.ts`에서는 `func-style`을 끈다(선언문 허용).

## 타입 전용 import 분리

타입만 가져올 땐 `import type`을 쓴다(런타임 번들에서 제거·의도 명확).

```ts
import type { BusPosition } from '@entities/bus';
import { getBusPositions } from '@entities/bus';
```

## import 별칭 — 레이어별 절대경로

슬라이스 경계를 넘는 import는 상대경로 대신 **레이어별 별칭**을 쓴다. 별칭은
`tsconfig.app.json`의 `paths`에 정의돼 있다(`@/`가 아니라 레이어명 기반):

`@app/*` · `@pages/*` · `@widgets/*` · `@features/*` · `@entities/*` · `@shared/*`

```ts
import { cn } from '@shared/lib';
import { getBusPositions } from '@entities/bus';
```

슬라이스 내부에서만 상대경로를 허용한다(`fsd/no-relative-imports`).

## 미사용 심볼 금지

`tsconfig`의 `noUnusedLocals`/`noUnusedParameters`를 켠다. 미사용 변수·파라미터를 남기지
않는다. 의도적으로 안 쓰는 파라미터는 `_` 접두사로 표시한다.

## 포맷 — Prettier에 맡긴다

세미콜론·따옴표·줄바꿈·들여쓰기 등 포맷은 **손대지 않는다.** Prettier가 단독으로 정리한다
(`singleQuote`, `printWidth: 140` 등 → [tooling/prettier.md](../tooling/prettier.md)). 커밋 시
`lint-staged`가 `prettier --write`로 자동 적용하고, 에디터 저장 시에도 동일하게 포맷된다.

- import 순서는 `fsd/ordered-imports`(warn, `eslint --fix`로 자동 정렬)를 따른다. 슬라이스
  경계는 절대경로/별칭, 슬라이스 내부만 상대경로(`fsd/no-relative-imports`).

## 네이밍

| 대상           | 규칙                                       | 예                                         |
| -------------- | ------------------------------------------ | ------------------------------------------ |
| 컴포넌트·타입  | PascalCase                                 | `BusMapWidget`, `BusPosition`              |
| 변수·함수·훅   | camelCase (훅은 `use` 접두사)              | `busClient`, `useUserLocation`             |
| 상수           | 상황에 맞게 (모듈 상수는 UPPER_SNAKE 허용) | `DEFAULT_ZOOM`                             |
| API fetch 함수 | `get<리소스>`                              | `getBusPositions`, `getStationInformation` |
| 파일           | 컴포넌트는 PascalCase, 그 외 camelCase     | `NaverMap.tsx`, `polyline.ts`              |

## 순수 함수 우선

좌표 투영·보간 같은 로직은 **부수효과 없는 순수 함수**로 `shared/lib`에 두고 유닛 테스트로
검증한다(예: `polyline.ts` ↔ `polyline.test.ts`). React·지도 의존을 로직에 섞지 않는다.
