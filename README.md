# 버쓱

서울시 실시간 버스 위치를 지도에서 확인하는 웹 앱.
현재 위치 기반 주변 정류장 조회, 버스 도착 정보, 노선별 실시간 위치 추적을 지원합니다.

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query v5 · Naver Maps JS SDK

## 실행

```bash
pnpm install
pnpm --filter web dev   # http://localhost:5173
```

`apps/web/.env.local`

```
VITE_NAVER_MAP_CLIENT_ID=네이버 클라우드 플랫폼 Maps Client ID
VITE_BUS_API_SERVICE_KEY=공공데이터 포털 API 인증키
```

- 네이버맵 Client ID: [네이버 클라우드 플랫폼](https://www.ncloud.com/) → Application Services → Maps → Application 등록
- 버스 API 키: [공공데이터 포털](https://www.data.go.kr/) → 마이페이지 → 인증키 발급

> 서울 버스 API는 HTTP 전용이라 개발 환경에서는 Vite 프록시(`/api/bus`)로 CORS를 우회합니다.
