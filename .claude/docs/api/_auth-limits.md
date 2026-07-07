# 공통 인증 및 제한

## 인증

모든 엔드포인트에 `serviceKey` 쿼리 파라미터가 필수입니다 (URL 인코딩).

```
GET /endpoint?serviceKey={인증키}&resultType=json
```

## 응답 형식

`resultType` 파라미터로 지정합니다.

| 값     | 설명         |
| ------ | ------------ |
| `xml`  | XML (기본값) |
| `json` | JSON         |

## 요청 제한

| 항목           | 값  |
| -------------- | --- |
| TPS            | 30  |
| 최대 응답 크기 | 3MB |
