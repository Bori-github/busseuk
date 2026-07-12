# scripts

반복되는 확인·작업을 손으로 다시 조립하지 않도록 스크립트로 굳혀 둔 것들.
**정확히 따라야 하는 절차는 문서가 아니라 스크립트로 둔다** — 문서는 잘못 읽히지만 스크립트는 돌려볼 수 있다.

| 스크립트                                       | 쓰임                                   |
| ---------------------------------------------- | -------------------------------------- |
| [`probe-bus-api.sh`](#probe-bus-apish)         | 선(先)검증 — 버스 API 응답을 직접 확인 |
| [`record-demo.sh`](#record-demosh)             | PR 데모 영상 녹화                      |
| [`verify-video.sh`](#verify-videosh)           | 올리기 전 영상 프레임 확인 (개인정보)  |
| [`upload-attachment.sh`](#upload-attachmentsh) | GitHub CDN 업로드 → 마크다운 URL       |

## probe-bus-api.sh

서울 버스 공개 API(`ws.bus.go.kr`)를 직접 호출해 응답을 확인한다. 명세(`.claude/docs/api/`)와 실제 응답이 다를 수 있으므로(예: 위치 API의 `tmX/tmY`는 `null`, 좌표는 `gpsX/gpsY`) 가정은 항상 이걸로 검증한다.

```bash
.claude/scripts/probe-bus-api.sh <endpoint-path> [key=value ...]

# 예시
.claude/scripts/probe-bus-api.sh /buspos/getBusPosByRtid      busRouteId=100100118
.claude/scripts/probe-bus-api.sh /busRouteInfo/getRoutePath   busRouteId=100100118
.claude/scripts/probe-bus-api.sh /stationinfo/getStationByUid arsId=12390
```

- 서비스 키는 `apps/web/.env.local` 의 `VITE_BUS_API_SERVICE_KEY` 에서 읽는다. `BUS_API_SERVICE_KEY` 환경변수로도 주입 가능.
- **키는 절대 커밋하지 않는다** (`.env.local` 은 `.gitignore` 처리됨). 스크립트에 키를 하드코딩하지 말 것.
- `serviceKey`·`resultType=json` 은 자동으로 붙는다.

---

## PR 데모 (record → verify → upload)

동작이 바뀐 PR에 붙일 데모를 만드는 3단계. 절차는 [`/pr` 9단계](../commands/pr.md)가 호출한다.

```bash
pnpm --filter web dev &                                            # 개발 서버

.claude/scripts/record-demo.sh /tmp/demo.webm /tmp/scenario.js /tmp/mocks.js
.claude/scripts/verify-video.sh /tmp/demo.webm                     # 프레임을 눈으로 확인
.claude/scripts/upload-attachment.sh /tmp/demo.webm                # → CDN URL
```

### record-demo.sh

`.claude/scripts/record-demo.sh <출력.webm> <시나리오.js> [목.js]`

브라우저를 몰아 시나리오를 실행하며 실제 프레임률로 녹화한다. 감추는 것:

- `--headed` 로 실행 — 지도가 WebGL(`gl: true`) 커스텀 스타일이라 헤드리스에서는 밝은 기본 지도로 폴백한다.
- `record start` → 목 주입 → 시나리오 → `record stop` 을 끊김 없이 실행 (나눠 호출하면 그 사이가 빈 화면으로 녹화된다).
- `record start` 는 새 컨텍스트를 만들므로 목은 **그 뒤에** 주입한다.

**시나리오는 파일로 넘긴다** — 셸 인라인은 따옴표 중첩으로 깨진다. `agent-browser eval` 은 최상위
`await` 를 지원하지 않으므로 `(async () => { ... })()` 로 감싸고 Promise 를 반환한다.

### verify-video.sh

`.claude/scripts/verify-video.sh <영상.webm> [프레임수]`

영상에서 프레임을 뽑아 PNG 로 저장한다. **CDN 에 올린 파일은 삭제할 수 없으므로 올리기 전에 반드시 전부 확인한다.**
브라우저가 WebM 을 재생하므로, 개발 서버로 서빙해 재생 위치를 옮겨가며 스크린샷을 찍는다.

이 앱에서 화면에 남을 수 있는 것:

- **최근 검색 기록** (`localStorage` 의 `busseuk:recent-searches`) — 지도를 다른 곳으로 옮겨도 **검색 기록이 생활권을 드러낸다.** 녹화 전에 `localStorage.clear()` 로 비운다.
- **정류장·도착 데이터** — 공개 정보 기반 목으로 채운다.

실제 GPS 위치는 화면에 찍히지 않는다 — `agent-browser` 에서 위치 권한이 거부되고, 앱이 서울시청으로 폴백한다(`useUserLocation`).

### upload-attachment.sh

`.claude/scripts/upload-attachment.sh <파일>` → 마크다운용 CDN URL

리포에 바이너리를 커밋하지 않고 PR 에 데모를 붙이는 경로다. GitHub 로그인은 브라우저 프로필
(`~/.claude/browser-profiles/github`)에 저장된 것을 쓴다 — **프로필을 지정하지 않으면 빈 프로필을 보고
"미로그인" 으로 오판한다.** 인증이 없으면 스크립트가 한 번만 실행할 로그인 명령을 안내한다.
