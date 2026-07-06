---
paths:
  - "apps/web/src/**/*.{ts,tsx}"
---

# FSD (Feature-Sliced Design)

`apps/web/src`는 FSD 레이어 구조를 따른다. **상위 레이어는 하위 레이어만 참조**할 수 있다.
이 규칙은 `eslint-plugin-fsd-lint`로 강제된다 → [`tooling/eslint.md`](../tooling/eslint.md).

## 레이어와 참조 방향

```
app → pages → widgets → features → entities → shared
```

| 레이어 | 책임 | 실제 슬라이스 |
| --- | --- | --- |
| `app/` | Provider·라우터·글로벌 설정·레이아웃 | `providers/`, `layouts/`, `router.tsx`, `index.css` |
| `pages/` | 라우트 단위 화면 조합 | `map/` |
| `widgets/` | 독립적으로 완결된 UI 블록 | `bus-map/` |
| `features/` | 사용자 상호작용 단위 기능 | `search/`, `selected-routes/`, `station-information/`, `user-location/` |
| `entities/` | 도메인 모델·API·타입 | `bus/`, `station/` |
| `shared/` | 도메인 무관 재사용 코드 | `api/`, `config/`, `lib/`, `ui/`, `icons/`, `types/`, `test/` |

> **참조 방향은 단방향**이다. `features`는 `entities`/`shared`만, `entities`는 `shared`만
> import한다. 역방향(`entities`가 `features`를 참조 등)이나 같은 레이어의 다른 슬라이스
> 직접 참조는 금지.

## 슬라이스 구조 (segment)

한 슬라이스는 관심사별 세그먼트로 나눈다. 이 저장소에서 쓰는 세그먼트:

```
<slice>/
├─ ui/        컴포넌트
├─ model/     상태·훅·질의 정의(queryOptions·queryKeys)·순수 로직
├─ api/       요청 함수(fetch, get<리소스>)   (주로 entities)
├─ lib/       슬라이스 국소 유틸
└─ index.ts   ← Public API (배럴). 외부는 여기만 import
```

예) `entities/bus/{api,model}`, `widgets/bus-map/{ui,lib}`, `features/user-location/hooks`.

## Public API (배럴 규칙)

- 각 슬라이스는 **`index.ts`(Public API)** 로만 외부에 노출한다.
- 다른 슬라이스는 `index.ts`를 우회해 내부 파일을 직접 import하지 않는다
  (`fsd/no-public-api-sidestep`).
- 슬라이스 내부에서만 상대경로를 쓰고, 슬라이스 경계를 넘는 import는 절대경로/별칭을 쓴다
  (`fsd/no-relative-imports`, `vite-tsconfig-paths`).

## 배치 결정 가이드

새 코드를 어디에 둘지 헷갈릴 때:

1. **도메인(버스/정류장) 지식이 있는가?** → 없으면 `shared`.
2. **사용자 행동 하나에 대응하는 기능인가?** (검색, 위치 추적) → `features`.
3. **여러 feature/entity를 조합한 완결 UI 블록인가?** → `widgets`.
4. **도메인 데이터·모델·질의인가?** → `entities`.
5. **라우트 화면 전체 조합인가?** → `pages`.

애매하면 **더 낮은 레이어**에서 시작하고, 필요할 때 끌어올린다(순수 함수는 `shared/lib`부터).

## 검증

FSD 위반은 린트로 잡힌다:

```bash
pnpm --filter web lint
```
