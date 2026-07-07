# pnpm PATH 보강 (source 전용 — 직접 실행하지 않는다)
#
# 비대화형 셸(AI 세션·GUI 앱 등)은 nvm을 로드하지 않아 pnpm이 PATH에 없을 수 있다.
# pnpm이 없으면 .nvmrc 버전의 nvm 설치 경로를 PATH에 보강한다. nvm 외 방식(Homebrew·
# corepack 등)으로 설치했다면 원래 PATH에서 그대로 잡힌다. 근거: .claude/hooks/README.md
#
# 전제: cwd = 레포 루트. 사용처: .husky/pre-commit · .claude/hooks/prettier.sh·eslint.sh
if ! command -v pnpm >/dev/null 2>&1 && [ -f .nvmrc ]; then
  nvm_bin="$HOME/.nvm/versions/node/v$(tr -d ' \t\r\n' <.nvmrc)/bin"
  [ -x "$nvm_bin/pnpm" ] && PATH="$nvm_bin:$PATH"
  unset nvm_bin
fi
