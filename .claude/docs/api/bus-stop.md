# 서울특별시 정류소정보조회 API

- **Base URL**: `http://ws.bus.go.kr/api/rest/stationinfo`
- **갱신 주기**: 매일 새벽 5시
- 인증·응답형식·제한 → [_auth-limits.md](_auth-limits.md)
- 공통 응답 구조 → [_response-structure.md](_response-structure.md)

---

## 엔드포인트

### 1. `getLowStationByName` — 명칭별 교통약자전용 정류소 목록조회

> 검색어에 해당하는 **저상버스가 운행되는** 정류소 목록을 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `stSrch` | ✅ | 정류소명 검색어 (예: `서부경찰서`) |
| `resultType` | - | `xml` \| `json` (기본 xml) |

**응답 필드**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `stId` | `111000213` | 정류소 고유 ID |
| `stNm` | `서부경찰서` | 정류소명 |
| `arsId` | `12271` | 정류소 번호 |
| `tmX` | `126.9553...` | 경도 WGS84 |
| `tmY` | `37.5381...` | 위도 WGS84 |
| `posX` | `196057.69...` | GRS80 경도 |
| `posY` | `448750.08...` | GRS80 위도 |

**요청 예제**

```
GET /getLowStationByName
  ?serviceKey={인증키}
  &stSrch=서부경찰서
  &resultType=json
```

---

### 2. `getRouteByStation` — 정류소별 경유노선 목록조회

> `arsId`(정류소 번호)로 해당 정류소를 경유하는 **모든 노선 목록**을 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `arsId` | ✅ | 정류소 번호 (예: `12121`) |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `busRouteId` | `100100344` | 노선 ID |
| `busRouteNm` | `7211` | 노선명 (DB관리용) |
| `busRouteAbrv` | `7211` | 노선 약칭 (안내용) |
| `firstBusTm` | `20150717041000` | 금일 첫차 시간 |
| `lastBusTm` | `20150717224400` | 금일 막차 시간 |
| `firstBusTmLow` | `20150717230000` | 금일 저상버스 첫차 시간 |
| `lastBusTmLow` | `20150717224400` | 금일 저상버스 막차 시간 |

**요청 예제**

```
GET /getRouteByStation
  ?serviceKey={인증키}
  &arsId=12121
  &resultType=json
```

---

### 3. `getStationByPos` — 좌표기반 근접정류소 목록조회

> WGS84 좌표와 반경 범위 내의 **주변 정류소 목록**을 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `tmX` | ✅ | 기준점 경도 WGS84 (예: `126.95584930`) |
| `tmY` | ✅ | 기준점 위도 WGS84 (예: `37.53843986`) |
| `radius` | ✅ | 검색 반경 (m, 예: `500`) |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `stId` | `102900092` | 정류소 고유 ID |
| `stationNm` | `도원삼성래미안아파트단지내` | 정류소명 |
| `arsId` | `03737` | 정류소 번호 |
| `gpsX` | `126.9553881353` | 경도 WGS84 |
| `gpsY` | `37.5381983039` | 위도 WGS84 |
| `posX` | `196057.692...` | GRS80 경도 |
| `posY` | `448750.080...` | GRS80 위도 |
| `dist` | `48` | 기준점으로부터 거리 (m) |
| `stationTp` | `0` | `0`:공용, `1`:일반형 시내, `2`:좌석형 시내, `3`:직행좌석형, `4`:일반형 시외, `5`:좌석형 시외, `6`:고속형 시외, `7`:마을버스 |

**요청 예제**

```
GET /getStationByPos
  ?serviceKey={인증키}
  &tmX=126.95584930
  &tmY=37.53843986
  &radius=500
  &resultType=json
```

> 지도에서 현재 위치 기반 주변 정류소를 표시할 때 사용합니다.

---

### 4. `getStationByName` — 명칭별 정류소 목록조회

> 검색어에 해당하는 **정류소 목록**을 조회 (저상 미운행 포함)

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `stSrch` | ✅ | 정류소명 검색어 (**한글 URL 인코딩 필수**) |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `stId` | `222000453` | 정류소 고유 ID |
| `stNm` | `가곡초교` | 정류소명 |
| `arsId` | `12345` | 정류소 번호 |
| `tmX` | `127.3068660534` | 경도 WGS84 |
| `tmY` | `37.6840791833` | 위도 WGS84 |
| `posX` | `227064.570...` | GRS80 경도 |
| `posY` | `464982.909...` | GRS80 위도 |

**요청 예제**

```
GET /getStationByName
  ?serviceKey={인증키}
  &stSrch=%EA%B0%80%EA%B3%A1%EC%B4%88%EA%B5%90
  &resultType=json
```

> `stSrch` 파라미터는 반드시 한글을 URL 인코딩해서 전송해야 합니다.

---

### 5. `getBustimeByStation` — 정류소 노선별 첫차·막차 조회

> `arsId` + `busRouteId`로 해당 정류소의 특정 노선 **첫차·막차 시간**을 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `arsId` | ✅ | 정류소 번호 (예: `12713`) |
| `busRouteId` | ✅ | 노선 ID (예: `100100118`) |
| `resultType` | - | `xml` \| `json` |

**응답 필드**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `arsId` | `12173` | 정류소 번호 |
| `stationNm` | `증산중학교입구` | 정류소명 |
| `busRouteId` | `100100118` | 노선 ID |
| `busRouteNm` | `753` | 노선명 (DB관리용) |
| `busRouteAbrv` | `753` | 노선 약칭 (안내용) |
| `firstBusTm` | `061011` | 첫차 시간 (`HHMMSS` 형식) |
| `lastBusTm` | `003451` | 막차 시간 (`HHMMSS` 형식) |

**요청 예제**

```
GET /getBustimeByStation
  ?serviceKey={인증키}
  &arsId=12713
  &busRouteId=100100118
  &resultType=json
```

---

### 6. `getLowStationByUid` — 교통약자용 고유번호별 정류소 도착예정정보 목록조회

> `arsId`로 해당 정류소의 **저상버스만** 필터링한 도착예정정보를 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `arsId` | ✅ | 정류소 번호 (예: `02105`) |
| `resultType` | - | `xml` \| `json` |

**응답 필드 (정류소 정보)**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `stId` | `101000013` | 정류소 고유 ID |
| `stnNm` | `서울역서부` | 정류소명 |
| `arsId` | `02105` | 정류소 번호 |

**응답 필드 (노선별 도착 정보 — 노선 수만큼 반복)**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `busRouteId` | `110000002` | 노선 ID |
| `busRouteAbrv` | `173` | 노선 약칭 (안내용) |
| `rtNm` | `173` | 노선명 (DB관리용) |
| `firstTm` | `0400` | 첫차 시간 (`HHMM` 형식) |
| `arrmsg1` / `arrmsg2` | `3분후[1번째 전]` | 도착정보 메시지 |
| `vehId1` / `vehId2` | `110027464` | 도착예정 버스 ID |
| `sectOrd1` / `sectOrd2` | `71` | 현재 구간 순번 |
| `stationNm1` / `stationNm2` | `손기정체육공원` | 버스 최종 정류소명 |
| `traTime1` / `traTime2` | `220` | 여행시간 (초) |
| `traSpd1` / `traSpd2` | `14` | 여행속도 (km/h) |
| `isArrive1` / `isArrive2` | `0` | `0`:운행중, `1`:도착 |
| `isLast1` / `isLast2` | `0` | `0`:막차아님, `1`:막차 |
| `busType1` / `busType2` | `1` | `0`:일반, `1`:저상, `2`:굴절 |
| `repTm1` / `repTm2` | `2019-01-09 16:34:56.0` | 최종 보고 시간 |
| `rerdieDiv1` / `rerdieDiv2` | `2` | `1`:잔여좌석, `2`:재차인원, `4`:혼잡도 |
| `rerideNum1` / `rerideNum2` | `2` | 재차인원 수 |
| `congestion1` / `congestion2` | `3` | `3`:여유, `4`:보통, `5`:혼잡 |

**요청 예제**

```
GET /getLowStationByUid
  ?serviceKey={인증키}
  &arsId=02105
  &resultType=json
```

---

### 7. `getStationByUid` — 고유번호별 정류소 항목조회 ⭐

> `arsId`로 해당 정류소를 경유하는 **모든 노선의 도착예정정보**를 조회
>
> 가장 자주 쓰이는 핵심 API — **정류소 클릭 시 사이드 패널** 구현에 사용

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `arsId` | ✅ | 정류소 번호 (예: `12121`) |
| `resultType` | - | `xml` \| `json` |

**응답 필드 (정류소 정보)**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `stId` | `101000344` | 정류소 고유 ID |
| `stNm` | `불광역3.6호선` | 정류소명 |
| `arsId` | `12121` | 정류소 번호 |
| `stationTp` | `3` | `0`:공용, `1`:일반형 시내, `2`:좌석형 시내, `3`:직행좌석형, `4`:일반형 시외, `5`:좌석형 시외, `6`:고속형 시외, `7`:마을버스 |

**응답 필드 (노선별 도착 정보 — 노선 수만큼 반복)**

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `busRouteId` | `100100344` | 노선 ID |
| `busRouteAbrv` | `7211` | 노선 약칭 (안내용) |
| `rtNm` | `7211` | 노선명 (DB관리용) |
| `routeType` | `4` | 노선 유형 코드 |
| `firstTm` | `0410` | 첫차 시간 (`HHMM` 형식) |
| `lastTm` | `2300` | 막차 시간 (`HHMM` 형식) |
| `Term` | `7` | 배차간격 (분) |
| `nextBus` | `10` | 다음버스 도착예정시간 (분) |
| `staOrd` | `25` | 요청 정류소 순번 |
| `adirection` | `신설동` | 방향 |
| `nxtStn` | `증산역` | 다음 정류소명 |
| `arrmsg1` / `arrmsg2` | `2분후[2번째 전]` | **도착정보 메시지 — UI에 바로 표시** |
| `vehId1` / `vehId2` | `110027464` | 도착예정 버스 ID |
| `plainNo1` / `plainNo2` | `서울74사2576` | 차량번호 |
| `sectOrd1` / `sectOrd2` | `71` | 현재 구간 순번 |
| `stationNm1` / `stationNm2` | `손기정체육공원` | 버스 최종 정류소명 |
| `traTime1` / `traTime2` | `151` | 여행시간 (초) |
| `traSpd1` / `traSpd2` | `27` | 여행속도 (km/h) |
| `isArrive1` / `isArrive2` | `0` | `0`:운행중, `1`:도착 |
| `isLast1` / `isLast2` | `0` | `0`:막차아님, `1`:막차 |
| `busType1` / `busType2` | `0` | `0`:일반, `1`:저상, `2`:굴절 |
| `isFullFlag1` / `isFullFlag2` | `0` | `0`:만차아님, `1`:만차 |
| `rerdieDiv1` / `rerdieDiv2` | `2` | `1`:잔여좌석, `2`:재차인원, `4`:혼잡도 |
| `rerideNum1` / `rerideNum2` | `12` | 재차인원 수 |
| `congestion1` / `congestion2` | `3` | `3`:여유, `4`:보통, `5`:혼잡 |
| `remndrNmpr1` / `remndrNmpr2` | `20` | 잔여좌석 수 |
| `sectNm` | `동명여고~서부시외버스터미널` | 구간명 |
| `deTourAt` | `00` | 우회여부 (`00`:정상, `11`:우회) |

**요청 예제**

```
GET /getStationByUid
  ?serviceKey={인증키}
  &arsId=12121
  &resultType=json
```

**응답 예제 (XML)**

```xml
<ServiceResult>
  <msgHeader>
    <headerCd>0</headerCd>
    <headerMsg>정상적으로 처리되었습니다.</headerMsg>
  </msgHeader>
  <msgBody>
    <itemList>
      <stId>101000344</stId>
      <stNm>불광역3.6호선</stNm>
      <arsId>12121</arsId>
      <busRouteId>100100344</busRouteId>
      <busRouteAbrv>7211</busRouteAbrv>
      <arrmsg1>2분후[2번째 전]</arrmsg1>
      <arrmsg2>12분후[9번째 전]</arrmsg2>
      <adirection>신설동</adirection>
      <busType1>0</busType1>
      <busType2>0</busType2>
      <isLast1>0</isLast1>
      <isLast2>0</isLast2>
      <deTourAt>00</deTourAt>
    </itemList>
  </msgBody>
</ServiceResult>
```

---

## API 선택 가이드

| 상황 | 추천 API |
| --- | --- |
| 정류소 이름으로 검색 | `getStationByName` |
| 현재 위치 주변 정류소 찾기 | `getStationByPos` |
| 정류소 클릭 → 전체 노선 도착정보 표시 | `getStationByUid` ⭐ |
| 특정 정류소의 경유 노선 목록만 필요 | `getRouteByStation` |
| 특정 정류소 + 노선의 첫차/막차 확인 | `getBustimeByStation` |
| 저상버스 전용 도착정보 | `getLowStationByUid` |

> `getStationByUid`는 단일 호출로 전체 노선 도착정보를 받아오므로, 정류소 사이드 패널 구현 시 가장 효율적입니다. `arsId`는 `getStationByPos` 또는 `getStaionByRoute`의 응답에서 획득합니다.

---

## 오류 코드

→ [_error-codes.md](_error-codes.md)
