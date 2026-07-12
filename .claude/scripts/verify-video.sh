#!/usr/bin/env bash
#
# 데모 영상에서 프레임을 뽑아 눈으로 확인할 수 있게 한다 (개발 서버를 띄운 채 실행).
#
# 사용법:
#   .claude/scripts/verify-video.sh <영상.webm> [프레임수]
#
# 예시:
#   .claude/scripts/verify-video.sh /tmp/demo.webm 9
#
# 왜 필요한가: CDN에 올린 파일은 삭제할 수 없다. 올리기 전에 화면에 개인정보가
# 찍히지 않았는지 반드시 확인해야 하는데, 영상 파일은 이미지처럼 바로 열어볼 수 없다.
#
# 방법: 브라우저가 WebM 을 재생한다. 영상을 개발 서버로 서빙하고 재생 위치를 옮겨가며
# 스크린샷을 찍는다. 임시 파일은 끝나면 지운다.
#
set -euo pipefail

VIDEO="${1:?사용법: verify-video.sh <영상.webm> [프레임수]}"
COUNT="${2:-9}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUBLIC="$ROOT/apps/web/public"
URL_BASE="${DEMO_URL:-http://localhost:5173}"
SESSION="verify"
OUTDIR="$(mktemp -d "${TMPDIR:-/tmp}/demo-frames-XXXXXX")"

command -v agent-browser >/dev/null || { echo "✘ agent-browser 필요: npm i -g agent-browser" >&2; exit 1; }
[[ -f "$VIDEO" ]] || { echo "✘ 영상 없음: $VIDEO" >&2; exit 1; }
curl -sf -o /dev/null "$URL_BASE/" || { echo "✘ 개발 서버가 응답하지 않는다. 먼저: pnpm --filter web dev" >&2; exit 1; }

cleanup() { rm -f "$PUBLIC/__verify.webm" "$PUBLIC/__verify.html"; agent-browser --session "$SESSION" close >/dev/null 2>&1 || true; }
trap cleanup EXIT

cp "$VIDEO" "$PUBLIC/__verify.webm"
cat > "$PUBLIC/__verify.html" <<'HTML'
<!doctype html>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; background: #111; }
  video { display: block; width: 100vw; }
  #t { position: fixed; top: 8px; left: 8px; z-index: 9; font: 700 20px/1 monospace; color: #0f0; background: #000a; padding: 6px 10px; }
</style>
<div id="t">--</div>
<video id="v" src="/__verify.webm" preload="auto" muted></video>
<script>
  const v = document.getElementById('v');
  const t = document.getElementById('t');
  window.ready = new Promise((res) => {
    if (v.readyState >= 2) res();
    else v.addEventListener('loadeddata', () => res(), { once: true });
  });
  // seeked 후 두 프레임을 넘겨야 화면이 확정된다.
  window.seekTo = (sec) =>
    new Promise((res) => {
      v.addEventListener('seeked', () => {
        t.textContent = v.currentTime.toFixed(2) + 's / ' + v.duration.toFixed(2) + 's';
        requestAnimationFrame(() => requestAnimationFrame(() => res(v.currentTime)));
      }, { once: true });
      v.currentTime = sec;
    });
  window.meta = () => ({ duration: v.duration, w: v.videoWidth, h: v.videoHeight });
</script>
HTML

agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
agent-browser --session "$SESSION" --headed open "$URL_BASE/__verify.html" >/dev/null
sleep 2

META="$(agent-browser --session "$SESSION" eval 'window.ready.then(() => JSON.stringify(window.meta()))' 2>/dev/null | tr -d '"\\')"
DURATION="$(echo "$META" | sed -E 's/.*duration:([0-9.]+).*/\1/')"
[[ -n "$DURATION" ]] || { echo "✘ 영상을 재생하지 못했다: $META" >&2; exit 1; }

echo "영상: $DURATION초 / $META"
echo "프레임 ${COUNT}개 추출 중..."

for i in $(seq 1 "$COUNT"); do
  T="$(awk -v d="$DURATION" -v i="$i" -v n="$COUNT" 'BEGIN { printf "%.1f", d * (i - 0.5) / n }')"
  agent-browser --session "$SESSION" eval "window.seekTo($T)" >/dev/null 2>&1
  agent-browser --session "$SESSION" screenshot "$OUTDIR/$(printf '%02d' "$i")-t${T}s.png" >/dev/null 2>&1
done

echo
echo "✓ 프레임: $OUTDIR"
ls -1 "$OUTDIR"
echo
echo "이 프레임들을 **전부** 열어 확인한다. 특히:"
echo "  - 실제 GPS 위치가 찍혔는가 (agent-browser 는 위치 권한을 거부하므로 앱이 서울시청으로 폴백해야 정상)"
echo "  - 최근 검색 기록이 보이는가 (localStorage 를 비우지 않으면 생활권이 드러난다)"
echo "  - 그 밖의 개인정보·토큰"
echo
echo "확인 후: .claude/scripts/upload-attachment.sh \"$VIDEO\""
