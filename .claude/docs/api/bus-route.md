# 서울특별시 버스노선정보조회 API

- **Base URL**: `http://ws.bus.go.kr/api/rest/busRouteInfo`
- **갱신 주기**: 매일 새벽 5시
- 인증·응답형식·제한 → [_auth-limits.md](_auth-limits.md)
- 공통 응답 구조 → [_response-structure.md](_response-structure.md)

**기본 호출 흐름**

```
① getBusRouteList   — 노선번호로 busRouteId 획득
② getRouteInfo      — busRouteId로 노선 기본정보 조회
③ getStaionByRoute  — busRouteId로 경유 정류소 목록 조회
④ getRoutePath      — busRouteId로 지도 폴리라인 좌표 조회
```

---

## 공통 응답 구조

```json
{
  "msgHeader": {
    "headerCd": "0",
    "headerMsg": "정상적으로 처리되었습니다.",
    "itemCount": 1
  },
  "msgBody": {
    "itemList": [...]
  }
}
```

---

## 엔드포인트

### 1. `getBusRouteList` — 노선번호 목록조회

> 노선번호 검색어로 해당하는 노선 목록 반환 (`busRouteId` 획득에 사용)

```
GET /getBusRouteList
  ?serviceKey={인증키}
  &strSrch=3
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `strSrch` | ✅ | 검색할 노선번호 (부분 검색 가능, 예: `3`) |
| `resultType` | - | `xml` \| `json` (기본 xml) |

**응답 필드**

| 필드 | 설명 |
| --- | --- |
| `busRouteId` | **노선 ID — 이후 API 호출에 사용** |
| `busRouteAbrv` | 노선 약칭 (안내용, 마을버스 제외) |
| `busRouteNm` | 노선명 (DB 관리용) |
| `routeType` | `1`:공항, `2`:마을, `3`:간선, `4`:지선, `5`:순환, `6`:광역, `7`:인천, `8`:경기, `9`:폐지, `0`:공용, `14`:한강 |
| `stStationNm` | 기점 정류소명 |
| `edStationNm` | 종점 정류소명 |
| `term` | 배차간격 (분) |
| `lastBusYn` | 막차운행여부 (`Y`/`N`) |
| `firstBusTm` | 금일 첫차 시간 (예: `20170809040000`) |
| `lastBusTm` | 금일 막차 시간 |
| `firstLowTm` | 금일 저상버스 첫차 시간 |
| `lastLowTm` | 금일 저상버스 막차 시간 |
| `length` | 노선 길이 (km) |

---

### 2. `getRouteInfo` — 노선 기본정보 항목조회

> `busRouteId`로 노선 기본정보 반환

```
GET /getRouteInfo
  ?serviceKey={인증키}
  &busRouteId=100100112
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `busRouteId` | ✅ | 노선 시스템 ID (예: `100100112`) |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 설명 |
| --- | --- |
| `busRouteId` | 노선 ID |
| `busRouteAbrv` | 노선 약칭 (안내용) |
| `busRouteNm` | 노선명 (DB 관리용) |
| `routeType` | 노선 유형 (getBusRouteList와 동일) |
| `stStationNm` | 기점 정류소명 |
| `edStationNm` | 종점 정류소명 |
| `term` | 배차간격 (분) |
| `firstBusTm` | 금일 첫차 시간 |
| `lastBusTm` | 금일 막차 시간 |
| `firstLowTm` | 금일 저상버스 첫차 시간 |
| `lastLowTm` | 금일 저상버스 막차 시간 |
| `corpNm` | 운수사명 및 연락처 (예: `서부운수 02-372-0221`) |
| `length` | 노선 길이 (km) |

**응답 예제 (XML)**

```xml
<ServiceResult>
  <msgHeader>
    <headerCd>0</headerCd>
    <headerMsg>정상적으로 처리되었습니다.</headerMsg>
  </msgHeader>
  <msgBody>
    <itemList>
      <busRouteAbrv>721</busRouteAbrv>
      <busRouteId>100100112</busRouteId>
      <busRouteNm>721</busRouteNm>
      <corpNm>서부운수 02-372-0221</corpNm>
      <edStationNm>건대입구역</edStationNm>
      <firstBusTm>20170809042000</firstBusTm>
    </itemList>
  </msgBody>
</ServiceResult>
```

---

### 3. `getStaionByRoute` — 노선별 경유 정류소 목록조회

> `busRouteId`로 해당 노선이 경유하는 정류소 전체 목록 반환

```
GET /getStaionByRoute
  ?serviceKey={인증키}
  &busRouteId=100100112
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `busRouteId` | ✅ | 노선 시스템 ID |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 설명 |
| --- | --- |
| `seq` | 정류소 순번 |
| `station` | 정류소 고유 ID |
| `stationNm` | 정류소 이름 |
| `stationNo` | 정류소 번호 |
| `arsId` | 정류소 고유번호 — `getStationByUid` 호출 시 사용 |
| `gpsX` / `gpsY` | 좌표 WGS84 (경도/위도) — 지도 마커에 사용 |
| `posX` / `posY` | 좌표 GRS80 |
| `direction` | 방향 (종점 방향 정류소명) |
| `section` | 구간 ID |
| `beginTm` | 해당 정류소 첫차 시간 (예: `04:20`) |
| `lastTm` | 해당 정류소 막차 시간 |
| `trnstnid` | 회차지 정류소 ID |
| `transYn` | 회차지 여부 (`Y`: 회차지, `N`: 아님) |
| `sectSpd` | 구간속도 |
| `busRouteId` | 노선 ID |

**응답 예제 (XML)**

```xml
<ServiceResult>
  <msgHeader>
    <headerCd>0</headerCd>
    <headerMsg>정상적으로 처리되었습니다.</headerMsg>
  </msgHeader>
  <msgBody>
    <itemList>
      <arsId>13285</arsId>
      <beginTm>04:20</beginTm>
      <busRouteId>100100112</busRouteId>
      <direction>건대입구역</direction>
      <gpsX>126.9107578536</gpsX>
      <gpsY>37.5813365733</gpsY>
      <lastTm>22:40</lastTm>
      <seq>1</seq>
      <station>112000202</station>
      <stationNm>서부운수기점</stationNm>
      <transYn>N</transYn>
    </itemList>
  </msgBody>
</ServiceResult>
```

---

### 4. `getRoutePath` — 노선경로 좌표 목록조회

> 노선의 지도상 형상 좌표 목록 반환 (폴리라인 렌더링에 사용)

```
GET /getRoutePath
  ?serviceKey={인증키}
  &busRouteId=100100112
  &resultType=json
```

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `busRouteId` | ✅ | 노선 시스템 ID |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 설명 |
| --- | --- |
| `no` | 좌표 순번 |
| `gpsX` | 경도 WGS84 — 지도 폴리라인 렌더링에 사용 |
| `gpsY` | 위도 WGS84 — 지도 폴리라인 렌더링에 사용 |

---

## 오류 코드

→ [_error-codes.md](_error-codes.md)
