# /create-issue

기능 설명을 받아 구현 계획을 수립하고, 사용자 확인 후 GitHub 이슈를 생성합니다.

## 사용법

```
/create-issue <기능 설명> [--assignee <username>]
```

예시:
```
/create-issue 정류장 탭 시 바텀시트로 도착 정보 표시
/create-issue 정류장 탭 시 바텀시트로 도착 정보 표시 --assignee other-user
```

## 실행 절차

### 1단계 — 구현 계획 수립

아래 항목을 분석하여 구현 계획을 작성한다.

- 기능의 **배경과 목적** (왜 필요한가)
- **데이터 흐름** (컴포넌트/훅 → API → 렌더링)
- **FSD 레이어별 작업 목록** (entities → features → widgets → pages 순서)
  - 각 항목은 파일 단위로 구체적으로 작성
  - 기존 파일 수정인지 신규 파일인지 명시
- **결정 사항** (구현에서 선택이 필요한 부분과 그 이유)
- **참고** (관련 API 명세 경로, 이전 이슈 등)

### 2단계 — 사용자 확인

계획을 보여주고 다음을 질문한다.

> 위 계획으로 이슈를 생성할까요? 수정이 필요하면 말씀해주세요.

수정 요청이 있으면 반영 후 다시 확인한다. 확인이 되면 3단계로 진행한다.

### 3단계 — GitHub 이슈 생성

확인된 계획을 바탕으로 `gh issue create`를 실행한다.

- 제목: `feat: <기능 설명 요약>`
- 본문: `.github/ISSUE_TEMPLATE/feature.md` 형식에 맞춰 작성
- 어사이니: `--assignee` 옵션이 있으면 해당 username, 없으면 기본값 `Bori-github`
- 라벨: 기능 설명에 맞는 라벨을 아래 목록에서 선택해 지정한다
  - `feature` — 새 기능 구현
  - `fix` — 버그 수정
  - `refactor` — 동작 변경 없는 코드 개선
  - `test` — 테스트 추가·수정
  - `chore` — 의존성·설정 등 유지보수
  - `documentation` — 문서 변경
  - `ci` — CI/CD 설정 변경
  - `performance` — 성능 개선
  - `style` — 코드 스타일·포맷 변경
  - `hotfix` — 긴급 프로덕션 수정
- 생성 후 이슈 URL을 사용자에게 전달한다
