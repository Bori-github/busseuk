#!/bin/sh
# PostToolUse 훅 — Claude가 방금 편집한 apps/web 파일(.ts,.tsx,.css)을 Prettier로 조용히 정리한다.
# 설계 근거: .claude/hooks/README.md
set -u

# PostToolUse stdin(JSON)에서 편집 대상 file_path만 뽑는다. matcher가 Edit|Write|MultiEdit로
# 제한돼 있어 file_path가 항상 있고 절대경로다. jq 없이 단일 필드만 grep/sed로 추출한다.
input=$(cat 2>/dev/null || true)
file_path=$(
  printf '%s' "$input" \
    | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 \
    | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//; s/"$//'
)

[ -n "$file_path" ] || exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-}"
[ -n "$PROJECT_DIR" ] || exit 0
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# 이 프로젝트 apps/web 하위의 포맷 대상 확장자만 처리한다(case 글롭의 *는 /도 매칭).
# 그 외(문서·설정·비대상 확장자·프로젝트 밖)는 조용히 통과.
case "$file_path" in
  "$PROJECT_DIR"/apps/web/*.ts | "$PROJECT_DIR"/apps/web/*.tsx | "$PROJECT_DIR"/apps/web/*.css) ;;
  *) exit 0 ;;
esac

# 편집 직후라 파일은 디스크에 있다. 없으면(드문 경합) 조용히 통과.
[ -f "$file_path" ] || exit 0

# 비대화형 셸의 pnpm 부재 대비 PATH 보강(공용 스니펫)
[ -f .claude/hooks/ensure-pnpm.sh ] && . .claude/hooks/ensure-pnpm.sh

# 편집한 그 파일만 포맷. 실패해도 편집을 막지 않는다.
pnpm exec prettier --write --log-level warn "$file_path" >/dev/null 2>&1 || true

exit 0
