# 서울특별시 버스도착정보조회 API

- **Base URL**: `http://ws.bus.go.kr/api/rest/arrive`
- **갱신 주기**: 매 10초
- 인증·응답형식·제한 → [_auth-limits.md](_auth-limits.md)
- 공통 응답 구조 → [_response-structure.md](_response-structure.md)

---

## 공통 응답 필드 — 노선·정류소 정보

| 필드 | 샘플 | 설명 |
| --- | --- | --- |
| `stId` | `112000001` | 정류소 고유 ID |
| `stNm` | `북가좌동삼거리` | 정류소명 |
| `arsId` | `13001` | 정류소 번호 |
| `busRouteId` | `100100118` | 노선 ID |
| `busRouteAbrv` | `753` | 노선 약칭 (안내용) |
| `rtNm` | `753` | 노선명 (DB관리용) |
| `routeType` | `3` | `1`:공항, `2`:마을, `3`:간선, `4`:지선, `5`:순환, `6`:광역, `7`:인천, `8`:경기, `9`:폐지, `0`:공용, `14`:한강 |
| `staOrd` | `18` | 요청 정류소 순번 |
| `dir` | `사가정역` | 방향 (종점 방향 정류소명) |
| `firstTm` | `20170809042900` | 첫차 시간 |
| `lastTm` | `20170809224400` | 막차 시간 |
| `term` | `10` | 배차간격 (분) |
| `nextBus` | `N` | 막차운행여부 (`N`:막차아님, `Y`:막차) |
| `mkTm` | `2017-08-09 17:41:50.0` | 제공시각 |
| `deTourAt` | `00` | 우회여부 (`00`:정상, `11`:우회) |

## 공통 응답 필드 — 도착 예정 버스 (1번·2번 쌍)

버스는 `1` / `2` 접미사로 구분됩니다. 1번이 더 빨리 도착하는 버스입니다.

| 필드 패턴 | 설명 |
| --- | --- |
| `arrmsg1` / `arrmsg2` | **도착정보 메시지** — UI에 바로 표시 (예: `5분57초후[2번째 전]`) |
| `vehId1` / `vehId2` | 도착예정 버스 ID |
| `plainNo1` / `plainNo2` | 차량번호 (예: `서울74사2576`) |
| `busType1` / `busType2` | 차량유형 (`0`:일반, `1`:저상, `2`:굴절) |
| `traTime1` / `traTime2` | 여행시간 (초) |
| `traSpd1` / `traSpd2` | 여행속도 (km/h) |
| `sectOrd1` / `sectOrd2` | 현재 구간 순번 |
| `stationNm1` / `stationNm2` | 버스의 최종 정류소명 |
| `isArrive1` / `isArrive2` | 최종 정류소 도착여부 (`0`:운행중, `1`:도착) |
| `isLast1` / `isLast2` | 막차여부 (`0`:막차아님, `1`:막차) |
| `full1` / `full2` | 만차여부 |
| `goal1` / `goal2` | 종점 도착예정시간 (초) |
| `nstnId1` / `nstnId2` | 다음 정류소 ID |
| `nstnOrd1` / `nstnOrd2` | 다음 정류소 순번 |
| `nstnSec1` / `nstnSec2` | 다음 정류소 예정여행시간 (초) |
| `brerde_Div1` / `brerde_Div2` | 뒷차 구분 (`0`:없음, `2`:재차인원, `4`:혼잡도) |
| `brdrde_Num1` / `brdrde_Num2` | 뒷차 혼잡도 또는 재차인원 |
| `nmainStnid1` / `nmainStnid2` | 1번째 주요정류소 ID |
| `nmainSec1` / `nmainSec2` | 1번째 주요정류소 예정여행시간 (초) |
| `nmain2Stnid1` / `nmain2Stnid2` | 2번째 주요정류소 ID |
| `namin2Sec1` / `namin2Sec2` | 2번째 주요정류소 예정여행시간 (초) |
| `nmain3Stnid1` / `nmain3Stnid2` | 3번째 주요정류소 ID |
| `nmain3Sec1` / `nmain3Sec2` | 3번째 주요정류소 예정여행시간 (초) |

---

## 엔드포인트

### 1. `getArrInfoByRouteAll` — 경유노선 전체 정류소 도착예정정보 목록조회

> 노선 ID로 해당 노선이 경유하는 **전체 정류소**의 도착예정정보를 한 번에 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `busRouteId` | ✅ | 노선 ID (예: `100100118`) |
| `resultType` | - | `xml` \| `json` (기본 xml) |

**요청 예제**

```
GET /getArrInfoByRouteAll
  ?serviceKey={인증키}
  &busRouteId=100100118
  &resultType=json
```

---

### 2. `getArrInfoByRoute` — 정류소 노선별 도착예정정보 목록조회

> 정류소 ID + 노선 ID로 **특정 정류소의 특정 노선** 도착예정정보를 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `stId` | ✅ | 정류소 고유 ID (예: `112000001`) |
| `busRouteId` | ✅ | 노선 ID (예: `100100118`) |
| `ord` | ✅ | 정류소 순번 (예: `18`) |
| `resultType` | - | `xml` \| `json` |

**요청 예제**

```
GET /getArrInfoByRoute
  ?serviceKey={인증키}
  &stId=112000001
  &busRouteId=100100118
  &ord=18
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
      <arrmsg1>5분57초후[2번째 전]</arrmsg1>
      <arrmsg2>15분46초후[9번째 전]</arrmsg2>
      <stId>112000001</stId>
      <stNm>북가좌동삼거리</stNm>
      <busRouteId>100100118</busRouteId>
      <vehId1>111033115</vehId1>
      <plainNo1>서울74사2576</plainNo1>
      <busType1>1</busType1>
      <traTime1>371</traTime1>
      <isLast1>0</isLast1>
      <vehId2>111033351</vehId2>
      <plainNo2>서울75사2643</plainNo2>
      <busType2>0</busType2>
      <traTime2>963</traTime2>
      <isLast2>0</isLast2>
    </itemList>
  </msgBody>
</ServiceResult>
```

---

### 3. `getLowArrInfoByRoute` — 정류소의 특정노선 교통약자용 도착예정정보 목록조회

> 정류소 ID + 노선 ID로 **저상버스만** 필터링한 도착예정정보를 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `stId` | ✅ | 정류소 고유 ID |
| `busRouteId` | ✅ | 노선 ID |
| `ord` | ✅ | 정류소 순번 |
| `resultType` | - | `xml` \| `json` |

응답 필드는 `getArrInfoByRoute`와 동일하며, 저상버스(`busType=1`)만 필터링된 결과를 반환합니다.

**요청 예제**

```
GET /getLowArrInfoByRoute
  ?serviceKey={인증키}
  &stId=112000001
  &busRouteId=100100118
  &ord=18
  &resultType=json
```

---

### 4. `getLowArrInfoByStId` — 정류소별 교통약자용 도착예정정보 목록조회

> 정류소 ID 하나로 해당 정류소의 **전체 노선 저상버스** 도착예정정보를 조회

**요청 파라미터**

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `serviceKey` | ✅ | 인증키 |
| `stId` | ✅ | 정류소 고유 ID |
| `resultType` | - | `xml` \| `json` |

응답 필드는 `getArrInfoByRoute`와 동일합니다.

**요청 예제**

```
GET /getLowArrInfoByStId
  ?serviceKey={인증키}
  &stId=112000001
  &resultType=json
```

---

## API 선택 가이드

| 상황 | 추천 API |
| --- | --- |
| 노선 전체 정류소의 도착 정보 한 번에 조회 | `getArrInfoByRouteAll` |
| 특정 정류소 + 특정 노선 도착 정보 | `getArrInfoByRoute` |
| 저상버스만 표시 (특정 정류소 + 노선) | `getLowArrInfoByRoute` |
| 저상버스만 표시 (정류소 전체 노선) | `getLowArrInfoByStId` |

> UI에 표시할 도착 메시지는 `arrmsg1` / `arrmsg2`를 그대로 사용하면 됩니다. (`5분57초후[2번째 전]` 형태로 이미 포맷되어 있습니다)

---

## 오류 코드

→ [_error-codes.md](_error-codes.md)
