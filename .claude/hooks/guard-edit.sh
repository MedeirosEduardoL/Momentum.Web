#!/usr/bin/env bash
set -uo pipefail

. "$(dirname -- "${BASH_SOURCE[0]}")/hook-io.sh"

project_dir="$(printf '%s' "${CLAUDE_PROJECT_DIR:-$(pwd)}" | tr '\\' '/')"
cd "$project_dir" 2>/dev/null || exit 0

file="$(hook_field .tool_input.file_path | tr '\\' '/')"
[ -n "$file" ] || exit 0
relative="${file#"$project_dir"/}"

is_generated_contract() {
  [[ "$relative" =~ ^src/shared/api/generated/ ]]
}

is_core_contract() {
  [[ "$file" == */Momentum.Core/openapi.json ]]
}

if is_generated_contract; then
  block_tool "$relative é gerado do openapi.json do Momentum.Core: não se edita à mão. Regere os tipos com npm run api:types."
fi

if is_core_contract; then
  block_tool "O openapi.json do Momentum.Core é gerado pelo build do Core: mudança de contrato se faz no código do Core, numa sessão de lá."
fi

knowledge_report="$(bash ai/scripts/knowledge-match.sh "$relative" 2>/dev/null)"
[ "$?" -eq 3 ] || exit 0

seen_file="${TMPDIR:-/tmp}/momentum-web-knowledge-seen-$(hook_field .session_id)"
touch "$seen_file"
unseen="$(printf '%s\n' "$knowledge_report" | grep -oE 'ai/knowledge/[^ ]+\.md' | sort -u | grep -vxF -f "$seen_file")"
[ -n "$unseen" ] || exit 0
printf '%s\n' "$unseen" >>"$seen_file"

block_tool "$knowledge_report

Leia por inteiro os arquivos de conhecimento acima antes de editar $relative e repita a edição."
