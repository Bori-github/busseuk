#!/usr/bin/env bash
#
# 스크린샷·영상을 GitHub 자산 CDN에 올리고 마크다운용 URL을 출력한다(커밋 없이).
#
# 사용법:
#   .claude/scripts/upload-attachment.sh <파일>
#
# 리포에 바이너리를 커밋하지 않고 PR에 데모를 붙이는 경로다.
#
# ⚠️ 올린 파일은 CDN에서 **삭제할 수 없다.** 올리기 전에 반드시
#    .claude/scripts/verify-video.sh 로 프레임을 확인하고 사용자 승인을 받는다.
#
# 전제: agent-browser + jq, 그리고 GitHub 로그인이 브라우저 프로필에 저장돼 있을 것.
# 인증이 없으면 아래 안내대로 한 번만 로그인하면 프로필에 저장돼 이후 자동이다.
#
set -euo pipefail

FILE="${1:?사용법: upload-attachment.sh <파일 경로>}"
[[ -f "$FILE" ]] || { echo "✘ 파일 없음: $FILE" >&2; exit 1; }

SKILL_SCRIPTS="$HOME/.claude/skills/uploading-attachments/scripts"
# --profile 을 반드시 지정한다. 빠뜨리면 빈 프로필을 보고 "미로그인"으로 오판한다.
PROFILE="$HOME/.claude/browser-profiles/github"
SESSION="gh-upload"

command -v jq >/dev/null || { echo "✘ jq 필요: brew install jq" >&2; exit 1; }
command -v agent-browser >/dev/null || { echo "✘ agent-browser 필요: npm i -g agent-browser" >&2; exit 1; }
[[ -x "$SKILL_SCRIPTS/upload-image.sh" ]] || { echo "✘ uploading-attachments 스킬을 찾을 수 없다: $SKILL_SCRIPTS" >&2; exit 1; }

REPO_ID="$(bash "$SKILL_SCRIPTS/get-repo-info.sh" | jq -r .repo_id)"
REPO_URL="$(bash "$SKILL_SCRIPTS/get-repo-info.sh" | jq -r .repo_url)"

agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
agent-browser --session "$SESSION" --profile "$PROFILE" open "$REPO_URL" >/dev/null 2>&1

if [[ "$(agent-browser --session "$SESSION" cookies 2>/dev/null | grep -c '^user_session=')" -eq 0 ]]; then
  echo "✘ GitHub 로그인이 필요하다. 한 번만 아래를 실행해 로그인하면 프로필에 저장된다:" >&2
  echo "    agent-browser --session $SESSION --headed --profile $PROFILE open https://github.com/login" >&2
  echo "    (로그인 후) agent-browser --session $SESSION close" >&2
  agent-browser --session "$SESSION" close >/dev/null 2>&1 || true
  exit 1
fi

RESULT="$(bash "$SKILL_SCRIPTS/upload-image.sh" "$REPO_ID" "$SESSION" "$FILE")"
agent-browser --session "$SESSION" close >/dev/null 2>&1 || true

HREF="$(echo "$RESULT" | jq -r '.[0].href // empty')"
[[ -n "$HREF" ]] || { echo "✘ 업로드 실패: $RESULT" >&2; exit 1; }

echo "$HREF"
