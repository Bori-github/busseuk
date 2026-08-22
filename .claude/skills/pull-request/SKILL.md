---
name: pull-request
description: 현재 브랜치의 변경으로 Pull Request를 만든다. 본문 작성, 다이어그램 판단, 제목·라벨, 검증값, 데모 첨부, 생성까지 다룬다. 사용자가 "PR 만들어줘", "PR 올려줘", "풀리퀘", "풀리퀘스트", "피알", "PR 초안"이라고 하면 이 스킬을 쓴다. base 브랜치를 지정하면 그 브랜치로, 없으면 `main`으로 만든다.
---

# PR

현재 브랜치의 변경으로 Pull Request를 생성한다.

- 본문 구조와 각 섹션의 요구사항: [`.github/pull_request_template.md`](../../../.github/pull_request_template.md)
- 통과해야 하는 CI 게이트: [검증 매트릭스](../../docs/verification-matrix.md)

PR 본문은 리뷰어가 코드를 열지 않고도 무엇을·왜·어떻게 바꿨는지 재구성할 수 있어야 한다.

## 절차

### 1. base 결정

인자로 받은 브랜치를 쓰고, 없으면 `main`으로 한다. `origin/<base>`가 있으면 그것을 기준으로
삼는다. 현재 브랜치가 base와 같으면 PR로 만들 변경이 없음을 알리고 중단한다.

### 2. 맥락 수집

- `git log origin/<base>..HEAD --oneline` — 커밋 목록에서 변경 의도를 파악한다
- `git diff origin/<base>..HEAD --stat` — 변경 파일 범위를 확인한다
- 커밋 본문과 `.claude` 문서 변경에서 결정 사항과 기존 규칙에서 벗어난 지점을 찾는다

### 3. 본문 작성

`.github/pull_request_template.md`를 읽고 각 섹션을 diff와 커밋을 근거로 채운다.

- `범위`의 "의도적으로 안 한 것 / 후속"과 `검증`은 diff로 알 수 없는 정보이므로 비워 두지
  않는다.
- diff·커밋·`.claude` 문서에서 읽을 수 있는 내용은 중복해서 적지 않는다. 의도, 제외한 범위,
  검증 결과, 규칙에서 벗어난 지점 위주로 쓴다.
- 변경한 파일·컴포넌트·훅·타입은 실제 식별자 이름으로 지목하고, 핵심 분기와 엣지 케이스,
  실패 경로를 문장으로 설명한다.
- API 응답·좌표 등의 근거는 실측값을 그대로 인용한다.
- 확인되지 않은 내용은 추정해서 적지 않고 사용자에게 확인한다.

### 4. 다이어그램 (mermaid)

다음 중 하나에 해당하면 본문에 포함하고, 해당하지 않으면 넣지 않는다.

- 여러 레이어를 가로지르는 흐름. 폴링 → 보간 → 마커 렌더처럼 `entities`·`widgets`·`shared`를
  관통하는 경로 → `sequenceDiagram`
- 상태 기계. 전이가 3개 이상이고 잘못된 전이가 버그가 되는 경우(예: 바텀시트 peek↔full↔닫힘,
  드래그·진입·퇴장) → `stateDiagram-v2`
- 결정론적 분기. 순서가 곧 규칙인 경우(예: 지도 센터 이동 판정) → `flowchart TD`

작성 기준:

- 정책 문서에 이미 다이어그램이 있으면 링크한다.
- 레이아웃은 세로(`flowchart TD`)로 그려 PR 컬럼 폭에서 가로 스크롤이 생기지 않게 한다.
- FSD 레이어 구조도(`.claude/rules/architecture/fsd.md`에 있음)와 파일 나열형 다이어그램은
  넣지 않는다.

### 5. 제목

지배적 변경으로 type을 정하고 커밋과 같은 형식(Conventional Commits + 한국어 요약)으로 쓴다.
squash 병합 시 이 제목이 `main`의 커밋 메시지가 된다.

### 6. 라벨

변경 유형은 본문이 아니라 라벨로 표시한다. 라벨 이름은 커밋 prefix와 같다
(`feat`·`fix`·`docs`·`refactor`·`perf`·`test`·`build`·`ci`·`chore`).

`style`·`hotfix`는 prefix 없이 라벨로만 쓴다. 포맷은 Prettier가 자동 처리하고, 긴급 수정은
`fix`로 커밋하되 라벨로 구분한다.

### 7. 검증

통과 여부가 아니라 결과값을 적는다.

```text
❌ - [x] 테스트 통과
✅ pnpm --filter web test: 82 passed
```

```bash
pnpm --filter web lint
pnpm --filter web build   # tsc -b + vite
pnpm --filter web test
```

- 테스트는 건수, 번들은 `pnpm build` 출력의 gzip 실측치, 성능은 측정 단위와 조건을 함께 적는다.
- 성능·크기 개선을 주장하려면 측정치를 제시한다. 측정하지 않았으면 "한계 / 미검증 / 비고"에
  측정하지 않았다고 적는다.
- 버그 수정과 신규 로직은 실패하는 테스트를 먼저 작성한다.
- 자동 검증이 불가능한 항목은 무엇을 왜 어떻게 수동으로 확인했는지 적는다. 애니메이션 연출·
  드래그 제스처·프레임률은 jsdom에 레이아웃·페인트가 없어 자동 테스트로 검증되지 않으므로
  "스크린샷 / 데모" 첨부로 대체한다.
- 실행하지 못한 항목은 그 이유를 적는다.

### 8. 선(先)검증

버스 API·데이터에 대한 가정이 있으면 [`.claude/scripts/probe-bus-api.sh`](../../scripts/)로
실제 호출해 확인한다. (전례: 명세의 `tmX/tmY`가 실제 응답에서 `null`이었고 좌표는
`gpsX/gpsY`였다.)

### 9. 스크린샷 / 데모

사용자에게 보이는 동작이 바뀐 PR에 첨부한다. UI·동작 변경이 없는 PR(문서·리팩터링·내부 정리)은
생략한다.

정지 화면은 스크린샷으로 첨부하고, 움직임(연출·드래그·전환)은 영상으로 녹화한다. 짧은 전환의
중간 프레임이 빠지면 흐름만 남고 연출은 증명되지 않으므로, 프레임이 실제 속도로 담겨야 한다.
브라우저 자동화의 GIF 녹화 도구는 동작 1개당 프레임 1개만 캡처하므로 쓰지 않는다.

절차는 다음과 같다. `--headed`·프로필·프레임 추출 등의 세부는
[`.claude/scripts/`](../../scripts/)가 처리한다.

1. 시나리오를 JS 파일로 작성한다. 셸 인라인은 따옴표 중첩으로 깨진다. `agent-browser eval`은
   최상위 `await`를 지원하지 않으므로 `(async () => { ... })()`로 감싼다. 목이 필요하면 별도
   파일로 두고, 목에서 `localStorage.clear()`를 먼저 호출한다.
2. 녹화 — `pnpm --filter web dev` 실행 후
   `.claude/scripts/record-demo.sh <출력.webm> <시나리오.js> [목.js]`
3. 검증 — `.claude/scripts/verify-video.sh <파일>`로 프레임을 추출해 전부 확인한다.
4. 업로드 — `.claude/scripts/upload-attachment.sh <파일>`로 CDN URL을 받는다.
5. 받은 URL을 "스크린샷 / 데모" 섹션에 넣는다. 영상은 URL만 두면 GitHub이 플레이어로 렌더한다.
   파일은 저장소에 커밋하지 않는다.

업로드에 쓰는 GitHub API는 비공개이며 올린 파일은 CDN에서 삭제할 수 없다. 추출한 프레임을
사용자에게 보여주고 승인받은 뒤에 업로드한다.

### 10. 확인 후 생성

초안(제목·본문·라벨)을 사용자에게 보여주고 승인받은 뒤에 실행한다.

```bash
git push -u origin <branch>          # 원격에 없을 때만. 승인 후
gh pr create --base <base> --title "…" --body "…" --assignee @me
gh pr edit --add-label <label>
```

담당자는 `@me`(현재 인증 사용자)로 배정하고 계정명을 하드코딩하지 않는다.

## 규칙

- `main`에 직접 푸시하지 않는다.
- 저장소 식별자(GitHub 계정·URL)를 본문에 하드코딩하지 않는다.
- PR 본문에 `- [ ]` 체크리스트를 만들지 않는다. 템플릿에 없는 구조를 추가하지 않는다.
