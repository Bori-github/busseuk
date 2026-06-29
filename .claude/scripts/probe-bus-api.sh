#!/usr/bin/env bash
#
# 서울 버스 공개 API 라이브 검증용 프로브 (개발 워크플로 1단계 "선검증").
#
# 사용법:
#   .claude/scripts/probe-bus-api.sh <endpoint-path> [key=value ...]
#
# 예시:
#   .claude/scripts/probe-bus-api.sh /buspos/getBusPosByRtid       busRouteId=100100118
#   .claude/scripts/probe-bus-api.sh /busRouteInfo/getRoutePath    busRouteId=100100118
#   .claude/scripts/probe-bus-api.sh /stationinfo/getStationByUid  arsId=12390
#
# 서비스 키는 apps/web/.env.local 의 VITE_BUS_API_SERVICE_KEY 에서 읽는다.
# (BUS_API_SERVICE_KEY 환경변수로도 주입 가능) — 키는 절대 커밋하지 않는다.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT/apps/web/.env.local"

if [[ -z "${BUS_API_SERVICE_KEY:-}" && -f "$ENV_FILE" ]]; then
  BUS_API_SERVICE_KEY="$(grep -E '^VITE_BUS_API_SERVICE_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r\n')"
fi

if [[ -z "${BUS_API_SERVICE_KEY:-}" ]]; then
  echo "오류: 서비스 키 없음. apps/web/.env.local 의 VITE_BUS_API_SERVICE_KEY 를 설정하거나 BUS_API_SERVICE_KEY 환경변수를 주입하세요." >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "사용법: $0 <endpoint-path> [key=value ...]" >&2
  echo "예시:   $0 /buspos/getBusPosByRtid busRouteId=100100118" >&2
  exit 1
fi

ENDPOINT="$1"; shift
BASE="http://ws.bus.go.kr/api/rest"
QS="serviceKey=${BUS_API_SERVICE_KEY}&resultType=json"
for kv in "$@"; do
  QS="${QS}&${kv}"
done

RESPONSE="$(curl -s "${BASE}${ENDPOINT}?${QS}")"
echo "$RESPONSE" | python3 -m json.tool --no-ensure-ascii 2>/dev/null || echo "$RESPONSE"
