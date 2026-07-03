---
paths:
  - "apps/web/src/**/*.{ts,tsx}"
---

# 코드 품질 — 변경하기 쉬운 코드 4원칙

토스 [Frontend Fundamentals](https://frontend-fundamentals.com/code-quality/code/)의 4원칙을
이 저장소 맥락으로 정리한다. 목표는 **"변경하기 쉬운 코드"** — 읽기 쉽고, 예측 가능하고,
함께 바뀔 것은 모여 있고, 서로 영향은 좁은 코드.

> **메타 규칙(가장 중요):** 네 원칙은 자주 **충돌**한다(가독성 위한 중복 허용 ↔ 응집도,
> 공통화 ↔ 결합도). 하나의 정답은 없고 **위험·맥락에 따라 우선순위**를 정한다 — `CLAUDE.md`의
> 위험 기반 작업 원칙과 같다. 아래는 **판단 기준이지 기계적 하드룰이 아니다** → 그래서 린트/훅으로
> 강제하지 않고, 리뷰와 사람의 판단으로 다룬다.

## 1. 가독성 — 읽는 사람의 맥락을 줄인다

- 동시에 실행되지 않는 코드는 분리하고, 구현 세부는 추상화하며, 성격이 다른 로직은 나눈다.
- 복잡한 조건·매직 넘버는 **이름 붙여** 의도를 드러낸다(예: `if (isBusApproaching)`, `const MIN_ZOOM = 10`).
- 위→아래로 읽히게 시점 이동을 줄이고, 중첩 삼항은 피한다.
- 이 저장소: 좌표 투영·보간 같은 로직은 이름 있는 순수 함수로 `shared/lib`에 둔다 →
  [typescript.md](typescript.md) "순수 함수 우선".

## 2. 예측 가능성 — 이름·시그니처만으로 동작을 예상하게

- 같은 종류의 함수는 **반환 타입을 통일**한다(예: 모든 `get<리소스>`는 `Promise<T[]>`).
- 이름과 다른 일을 하는(숨은 부수효과) 함수를 만들지 않는다.
- 이 저장소: 네이밍(`get<리소스>` fetch·`use` 훅 접두사)은 → [typescript.md](typescript.md) 네이밍,
  질의 키·`queryOptions` 형태는 → [data-fetching.md](../architecture/data-fetching.md).

## 3. 응집도 — 함께 바뀔 코드는 함께 둔다

- 동시에 수정되는 파일은 같은 곳에 모으고(colocation), 매직 넘버는 쓰는 곳 근처에서 상수화한다.
- 이 저장소: **FSD 슬라이스/세그먼트가 곧 응집 단위**다 → [fsd.md](../architecture/fsd.md).
  한 기능의 `ui`/`model`/`api`를 한 슬라이스에 모으고 `index.ts`(Public API)로만 노출한다.

## 4. 결합도 — 바뀔 때 영향 범위를 좁힌다

- 책임을 하나씩 분리하고, **이득이 있으면 중복을 허용**한다(억지 공통화가 결합을 키운다).
- props drilling을 줄인다(합성·컨텍스트·상태 위치 재고).
- 이 저장소: 레이어 단방향 참조·슬라이스 경계가 결합도 가드다 → [fsd.md](../architecture/fsd.md).
  상태·로직을 훅으로 분리하는 규칙은 → [react.md](react.md).

## 검증

이 원칙들은 **정성적이라 린트로 못 잡는다.** 기계 규칙(포맷·func-style·FSD 경계·미사용)은
prettier/eslint 훅과 CI가 이미 담당한다(→ [tooling/eslint.md](../tooling/eslint.md),
[.claude/hooks/README.md](../../hooks/README.md)). 이 4원칙은 **변경을 리뷰할 때 사람이 판단**한다 —
코드 리뷰나 `/code-review`에서 이 문서를 기준으로 점검하고, 트레이드오프의 최종 판단은 사람이 한다.
