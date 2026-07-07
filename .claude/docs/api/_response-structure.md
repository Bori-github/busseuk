# 공통 응답 구조

모든 서울 버스 API는 동일한 JSON 최상위 구조를 사용합니다.

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

| 필드                  | 설명                  |
| --------------------- | --------------------- |
| `msgHeader.headerCd`  | 오류 코드 (`0`: 정상) |
| `msgHeader.headerMsg` | 오류 메시지           |
| `msgHeader.itemCount` | 반환된 항목 수        |
| `msgBody.itemList`    | 실제 데이터 배열      |
