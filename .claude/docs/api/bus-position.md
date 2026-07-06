# 서울특별시 버스위치정보조회 API

- **Base URL**: `http://ws.bus.go.kr/api/rest/buspos`
- **갱신 주기**: 매 5초
- 인증·응답형식·제한 → [_auth-limits.md](_auth-limits.md)
- 공통 응답 구조 → [_response-structure.md](_response-structure.md)

> ⚠️ **명세 ≠ 실측**: 명세상 WGS84 좌표인 `tmX`/`tmY`는 **실제 응답에서 `null`로 온다**
> (선검증 실측). 좌표는 `getBusPosByRtid`의 `gpsX`(경도)/`gpsY`(위도, WGS84)를 사용한다
> → [dev-workflow.md](../dev-workflow.md) §선검증.

---

## 엔드포인트

### 1. `getBusPosByRouteSt` — 노선별 특정 구간 접근버스 목록

> 노선ID + 구간(시작/종료 정류소 순번)으로 차량 위치 조회

```
GET /getBusPosByRouteSt
  ?serviceKey={인증키}
  &busRouteId=100100118
  &startOrd=1
  &endOrd=13
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `busRouteId` | ✅ | 노선 ID (예: `100100118`) |
| `startOrd` | ✅ | 시작 정류소 순번 |
| `endOrd` | ✅ | 종료 정류소 순번 |
| `resultType` | - | `xml` \| `json` (기본 xml) |

**응답 필드**

| 필드 | 설명 |
| --- | --- |
| `vehId` | 버스 ID |
| `plainNo` | 차량번호 (예: `서울75사2644`) |
| `busType` | `0`: 일반, `1`: 저상, `2`: 굴절 |
| `routeId` | 노선 ID |
| `lastStnId` | 최종정류장 ID |
| `sectOrd` | 구간 순번 |
| `sectDist` | 구간 옵셋거리 (km) |
| `stopFlag` | `0`: 운행중, `1`: 도착 |
| `sectionId` | 구간 ID |
| `dataTm` | 제공시간 (예: `20190109160221`) |
| `tmX` / `tmY` | 맵매칭 좌표 WGS84 — **실측상 `null`, 사용 금지(상단 경고 참고)** |
| `posX` / `posY` | 맵매칭 좌표 GRS80 |

---

### 2. `getBusPosByRtid` — 노선 전체 버스위치 목록

> 노선ID로 해당 노선 전체 차량 위치 조회

```
GET /getBusPosByRtid
  ?serviceKey={인증키}
  &busRouteId=100100118
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `busRouteId` | ✅ | 노선 ID |
| `resultType` | - | `xml` \| `json` |

**응답 필드** (`getBusPosByRouteSt` 공통 필드 포함)

| 필드 | 설명 |
| --- | --- |
| `fullSectDist` | 정류소 간 거리 (km) |
| `rtDist` | 노선 옵셋거리 (km) |
| `gpsX` / `gpsY` | GPS 좌표 WGS84 |
| `lastStTm` | 종점까지 남은 시간 (초) |
| `nextStTm` | 다음 정류소까지 남은 시간 (초) |
| `nextStId` | 다음 정류소 ID |
| `lastStnId` | 최종정류소 고유 ID |
| `congetion` | `0`: 없음, `3`: 여유, `4`: 보통, `5`: 혼잡 (Routetype=6이면 잔여좌석수, `99`: 없음) |

---

### 3. `getBusPosByVehId` — 특정 차량 위치 조회

> 차량ID로 단일 차량 위치 조회

```
GET /getBusPosByVehId
  ?serviceKey={인증키}
  &vehId=111033115
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `vehId` | ✅ | 차량 ID |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 설명 |
| --- | --- |
| `vehId` | 버스 ID |
| `plainNo` | 차량번호 |
| `busType` | `0`: 일반, `1`: 저상, `2`: 굴절 |
| `lastStnId` | 최종정류소 고유 ID |
| `sectOrd` | 정류소 순번 |
| `stopFlag` | `0`: 운행중, `1`: 도착 |
| `dataTm` | 제공시간 |
| `tmX` / `tmY` | 맵매칭 좌표 WGS84 — **실측상 `null`, 사용 금지(상단 경고 참고)** |
| `posX` / `posY` | 맵매칭 좌표 GRS80 |
| `congetion` | `0`: 없음, `3`: 여유, `4`: 보통, `5`: 혼잡 |
| `isFullFlag` | `0`: 만차아님, `1`: 만차 |

---

### 4. `getLowBusPosByRouteSt` — 저상버스 특정 구간 접근버스 목록

> 노선ID + 구간으로 저상버스 차량 위치 조회

```
GET /getLowBusPosByRouteSt
  ?serviceKey={인증키}
  &busRouteId=100100118
  &startOrd=1
  &endOrd=15
  &resultType=json
```

**응답 필드** (`getBusPosByRouteSt` 공통 필드 포함)

| 필드 | 설명 |
| --- | --- |
| `congetion` | `0`: 없음, `3`: 여유, `4`: 보통, `5`: 혼잡 |
| `isFullFlag` | `0`: 만차아님, `1`: 만차 |

---

### 5. `getLowBusPosByRtid` — 저상버스 노선 전체 위치 목록

> 노선ID로 저상버스 전체 차량 위치 조회

```
GET /getLowBusPosByRtid
  ?serviceKey={인증키}
  &busRouteId=100100118
  &resultType=json
```

**응답 필드** (`getBusPosByRtid` 공통 필드 포함)

| 필드 | 설명 |
| --- | --- |
| `islastyn` | `0`: 막차아님, `1`: 막차 |
| `isrunyn` | `0`: 운행종료, `1`: 운행 |

---

## 오류 코드

→ [_error-codes.md](_error-codes.md)
