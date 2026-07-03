# .claude/rules — 프로젝트 컨벤션

이 폴더는 버쓱(busseuk) 코드베이스의 **규칙(convention)** 을 관심사별로 나눠 문서화한다.
각 문서는 "이렇게 되어 있다"는 서술이 아니라 **지향하는 표준(prescriptive)** 을 담는다.
기존 코드가 규칙과 다르면 문서를 먼저 신뢰하고, 코드 정렬은 별도 작업으로 분리한다.

## 폴더 구성 (관심사별)

| 폴더 | 관심사 | 문서 |
| --- | --- | --- |
| [`architecture/`](architecture/) | 시스템 구조·레이어·데이터 흐름 | `overview.md` · `fsd.md` · `data-fetching.md` · `styling.md` |
| [`code-style/`](code-style/) | 언어·프레임워크 코딩 스타일·품질 | `typescript.md` · `react.md` · `code-quality.md` |
| [`tooling/`](tooling/) | 린트·포맷·git 훅 등 도구 정책 | `eslint.md` · `prettier.md` · `husky.md` |

## 관련 문서

규칙과 별개로 유지되는 상세·정책 문서는 [`.claude/docs/`](../docs/) 에 있다.

- [`docs/dev-workflow.md`](../docs/dev-workflow.md) — 기능 개발 5단계 루프 상세·사례
- [`docs/map-center-policy.md`](../docs/map-center-policy.md) — 지도 센터 이동 불변식
- [`docs/api/`](../docs/api/) — 서울 버스 API 명세

## 우선순위

규칙이 충돌할 때의 우선순위:

1. `CLAUDE.md`의 Working Style (원자적·작은 단위·확인 경계)
2. `docs/`의 도메인 정책 (센터 이동, API 검증)
3. 이 폴더의 관심사별 규칙
