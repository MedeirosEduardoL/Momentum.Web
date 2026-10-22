#!/usr/bin/env bash
set -uo pipefail

. "$(dirname -- "${BASH_SOURCE[0]}")/hook-io.sh"

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$project_dir" 2>/dev/null || exit 0

[ "$(hook_field .stop_hook_active)" = "true" ] && exit 0

changed_files() {
  { git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null; } | sort -u
}

use_project_node() {
  [ -f .nvmrc ] && [ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ] || return 0
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh" >/dev/null 2>&1
  nvm use --silent >/dev/null 2>&1 || true
}

tail_of() {
  printf '%s\n' "$1" | tail -"$2"
}

code_failure() {
  local files=() sources=() file output
  [ -f package.json ] && [ -d node_modules ] || return 0
  while IFS= read -r file; do
    [ -f "$file" ] && files+=("$file")
  done < <(changed_files | grep -E '\.(ts|tsx|css|json)$' | grep -v '^src/shared/api/generated/')
  [ "${#files[@]}" -gt 0 ] || return 0
  while IFS= read -r file; do
    sources+=("$file")
  done < <(printf '%s\n' "${files[@]}" | grep -E '^src/.*\.(ts|tsx)$')

  use_project_node
  npx --no-install prettier --write --log-level silent "${files[@]}" >/dev/null 2>&1 || true

  if ! output="$(npm run --silent typecheck 2>&1)"; then
    printf 'typecheck falhou:\n%s\n' "$(tail_of "$output" 25)"
    return 0
  fi
  [ "${#sources[@]}" -gt 0 ] || return 0
  if ! output="$(npx --no-install eslint --max-warnings 0 "${sources[@]}" 2>&1)"; then
    printf 'eslint falhou:\n%s\n' "$(tail_of "$output" 25)"
    return 0
  fi
  output="$(npx --no-install vitest related --run --passWithNoTests "${sources[@]}" 2>&1)" && return 0
  printf 'vitest (testes relacionados) falhou:\n%s\n' "$(tail_of "$output" 40)"
}

rules_failure() {
  local output
  output="$(bash ai/scripts/check-diff-rules.sh 2>&1)" && return 0
  printf '%s\n' "$output"
}

[ -n "$(changed_files)" ] || exit 0

code_report="$(code_failure)"
rules_report="$(rules_failure)"
[ -n "$code_report$rules_report" ] || exit 0

block_stop "O portão de fim de turno encontrou pendências. Corrija antes de encerrar; se você parou no meio da tarefa para perguntar algo ao usuário, diga isso e encerre de novo.

${code_report}${code_report:+

}${rules_report}"
