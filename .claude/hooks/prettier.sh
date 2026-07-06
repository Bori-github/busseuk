#!/bin/sh
# PostToolUse 훅 — 변경된 apps/web 파일(.ts,.tsx,.css)을 Prettier로 조용히 정리한다.
# 설계 근거: .claude/hooks/README.md
set -u

# stdin(JSON)은 소비만 하고 버린다(파싱 불필요·SIGPIPE 방지). 대상은 git으로 찾는다.
cat >/dev/null 2>&1 || true

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# PATH 보강: 비대화형 셸(AI 세션 등)은 nvm을 로드하지 않아 pnpm이 PATH에 없을 수 있다.
if ! command -v pnpm >/dev/null 2>&1 && [ -f .nvmrc ]; then
  nvm_bin="$HOME/.nvm/versions/node/v$(tr -d ' \t\r\n' <.nvmrc)/bin"
  [ -x "$nvm_bin/pnpm" ] && PATH="$nvm_bin:$PATH"
fi

# 워킹트리에서 변경/신규인 apps/web의 포맷 대상 파일
files=$(
  {
    git diff --name-only --diff-filter=ACMR -- apps/web
    git ls-files --others --exclude-standard -- apps/web
  } 2>/dev/null | grep -E '\.(ts|tsx|css)$' | sort -u
)

[ -z "$files" ] && exit 0

# 절대경로로 변환해 전달(cwd 무관). 실패해도 편집을 막지 않는다.
printf '%s\n' "$files" | sed "s|^|$PROJECT_DIR/|" \
  | tr '\n' '\0' \
  | xargs -0 pnpm exec prettier --write --log-level warn >/dev/null 2>&1 || true

exit 0
