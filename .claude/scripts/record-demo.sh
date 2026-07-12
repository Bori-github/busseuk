#!/usr/bin/env bash
#
# PR 데모 영상 녹화 (개발 서버를 띄운 채 실행).
#
# 사용법:
#   .claude/scripts/record-demo.sh <출력.webm> <시나리오.js> [목.js]
#
# 예시:
#   pnpm --filter web dev &                       # 다른 터미널 또는 백그라운드
#   .claude/scripts/record-demo.sh /tmp/demo.webm /tmp/scenario.js /tmp/mocks.js
#
# 시나리오·목은 파일로 넘긴다 — 셸 인라인은 따옴표 중첩으로 깨진다.
# agent-browser eval 은 최상위 await 를 지원하지 않으므로 시나리오는 async IIFE 로 감싼다:
#
#   (async () => {
#     const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
#     ...
#     return '완료';
#   })();
#
# 이 스크립트가 대신 처리하는 것:
#   - --headed 로 실행. 지도가 WebGL(gl:true) 커스텀 스타일이라 헤드리스에서는
#     GPU가 없어 밝은 기본 지도로 폴백한다(실제 앱과 다른 화면이 나온다).
#   - record start → 목 주입 → 시나리오 → record stop 을 끊김 없이 실행.
#     나눠 호출하면 그 사이가 빈 화면으로 녹화된다.
#   - record start 는 새 컨텍스트를 만들므로 목은 그 '뒤에' 주입한다.
#
set -euo pipefail

OUT="${1:?사용법: record-demo.sh <출력.webm> <시나리오.js> [목.js]}"
SCENARIO="${2:?사용법: record-demo.sh <출력.webm> <시나리오.js> [목.js]}"
MOCKS="${3:-}"

URL="${DEMO_URL:-http://localhost:5173/}"
SESSION="demo"

command -v agent-browser >/dev/null || { echo "✘ agent-browser 필요: npm i -g agent-browser" >&2; exit 1; }
[[ -f "$SCENARIO" ]] || { echo "✘ 시나리오 파일 없음: $SCENARIO" >&2; exit 1; }
[[ -z "$MOCKS" || -f "$MOCKS" ]] || { echo "✘ 목 파일 없음: $MOCKS" >&2; exit 1; }

curl -sf -o /dev/null "$URL" || {
  echo "✘ 개발 서버가 응답하지 않는다: $URL" >&2
  echo "  먼저 실행: pnpm --filter web dev" >&2
  exit 1
}

case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac  # record 는 절대경로를 요구한다
rm -f "$OUT"

agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
agent-browser --session "$SESSION" --headed record start "$OUT" "$URL" >/dev/null

if [[ -n "$MOCKS" ]]; then
  agent-browser --session "$SESSION" eval "$(cat "$MOCKS")" >/dev/null
fi

RESULT="$(agent-browser --session "$SESSION" eval "$(cat "$SCENARIO")" 2>&1 || true)"

agent-browser --session "$SESSION" record stop >/dev/null
agent-browser --session "$SESSION" close >/dev/null 2>&1 || true

[[ -s "$OUT" ]] || { echo "✘ 녹화 실패(빈 파일): $OUT" >&2; echo "  시나리오 출력: $RESULT" >&2; exit 1; }

echo "✓ 녹화 완료: $OUT ($(du -h "$OUT" | cut -f1))"
echo "  시나리오 결과: $RESULT"
echo
echo "다음: .claude/scripts/verify-video.sh \"$OUT\"   # 올리기 전에 반드시 프레임을 눈으로 확인한다"
