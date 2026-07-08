#!/bin/sh
# Stop 훅 — 변경된 apps/web 파일에 ESLint를 돌려 위반을 Claude에 피드백한다.
# 시점·토큰·self-gate 설계 근거: .claude/hooks/README.md
set -u

input=$(cat 2>/dev/null || true)

# 루프 방지: Stop 훅 때문에 이어달리는 중이면 다시 막지 않는다.
case "$input" in
  *'"stop_hook_active":true'* | *'"stop_hook_active": true'*) exit 0 ;;
esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# self-gate: 변경/신규 ts,tsx가 없으면 조용히 통과(순수 대화 턴 = 0 토큰).
# --cached 목록에는 "스테이징 후 워킹트리에서 삭제된" 파일이 남을 수 있으므로,
# eslint가 존재하지 않는 경로로 오탐(exit 2)하지 않게 실재하는 파일만 남긴다.
files=$(
  {
    git diff --name-only --diff-filter=ACMR -- apps/web
    git diff --name-only --cached --diff-filter=ACMR -- apps/web
    git ls-files --others --exclude-standard -- apps/web
  } 2>/dev/null | grep -E '\.(ts|tsx)$' | sort -u \
    | while IFS= read -r f; do [ -f "$f" ] && printf '%s\n' "$f"; done
)

[ -z "$files" ] && exit 0

# 비대화형 셸의 pnpm 부재 대비 PATH 보강(공용 스니펫)
[ -f .claude/hooks/ensure-pnpm.sh ] && . .claude/hooks/ensure-pnpm.sh

# 인프라 가드: 도구·의존성이 없으면 "위반"이 아니라 "실행 불가"이므로 조용히 통과한다.
# (pnpm 미설치, fresh clone 후 pnpm install 미실행 등 — 환경차로 팀원이 매 턴 거짓 차단되는 것 방지)
command -v pnpm >/dev/null 2>&1 || exit 0
[ -x apps/web/node_modules/.bin/eslint ] || exit 0

# 변경 파일만 검사 (pnpm --filter web exec → cwd=apps/web에서 flat config 탐색)
report=$(
  printf '%s\n' "$files" | sed "s|^|$PROJECT_DIR/|" \
    | tr '\n' '\0' \
    | xargs -0 pnpm --filter web exec eslint 2>&1
)
status=$?

[ "$status" -eq 0 ] && exit 0

# 위반 보고 → exit 2로 Claude에 피드백. 출력은 6KB로 캡.
{
  echo "[컨벤션 검증] ESLint 위반이 있습니다 — 완료/커밋 전에 고쳐 주세요."
  echo "검사 대상:"
  printf '%s\n' "$files" | sed 's|^|  - |'
  echo "---"
  printf '%s\n' "$report" | head -c 6000
} >&2
exit 2
