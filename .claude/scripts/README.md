# scripts

개발 워크플로 1단계 **선검증**(설계 전 실제 API/데이터 확인)에 쓰는 스크립트 모음.

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
