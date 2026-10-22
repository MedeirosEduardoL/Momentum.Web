#!/usr/bin/env bash
set -uo pipefail

. "$(dirname -- "${BASH_SOURCE[0]}")/hook-io.sh"

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir" 2>/dev/null || exit 0

roadmap="../Momentum.Core/ai/roadmap.md"

next_step() {
  [ -f "$roadmap" ] || { echo "  $roadmap não encontrado: o Momentum.Core precisa estar na pasta irmã."; return; }
  awk '/^## Próximo passo/ { found = 1; next } found && /^## / { exit } found' "$roadmap" \
    | sed '/^[[:space:]]*$/d'
}

node_status() {
  local expected current
  [ -f .nvmrc ] || { echo "  sem .nvmrc ainda (passo 2.1)."; return; }
  expected="$(tr -d '[:space:]v' <.nvmrc)"
  current="$(node --version 2>/dev/null | tr -d 'v')"
  case "$current" in
    "$expected"|"$expected".*) echo "  Node $current, como pede o .nvmrc." ;;
    *) echo "  Node ${current:-ausente} no PATH, mas o .nvmrc pede $expected: rode os comandos npm depois de nvm use." ;;
  esac
}

latest_changelog() {
  local latest
  latest="$(find ai/memory/changelog -maxdepth 1 -type f -name '*.md' 2>/dev/null | sort | tail -1)"
  echo "${latest:-nenhum}"
}

cat <<EOF
Estado do repositório no início da sessão:

Próximo passo do roadmap do produto ($roadmap):
$(next_step)

Conhecimento consolidado (ai/knowledge/):
$(bash ai/scripts/knowledge-match.sh --all 2>&1)

Node:
$(node_status)

Último changelog: $(latest_changelog)
EOF

exit 0
