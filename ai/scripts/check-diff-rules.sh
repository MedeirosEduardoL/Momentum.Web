#!/usr/bin/env bash
set -uo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Fora de um repositório git."; exit 2; }
cd "$repo_root" || exit 2

base="${1:-}"
if [ -n "$base" ]; then
  git rev-parse --verify --quiet "$base" >/dev/null || { echo "Ref inválida: $base"; exit 2; }
  diff_cmd=(git diff -U0 "$base...HEAD")
  escopo="$base...HEAD"
else
  head_ref="HEAD"
  git rev-parse --verify --quiet HEAD >/dev/null || head_ref="$(git hash-object -t tree /dev/null)"
  diff_cmd=(git diff -U0 "$head_ref")
  escopo="working tree vs HEAD, incluindo arquivos novos"
fi

violacoes=0
avisos=0
markdown_renderer="src/shared/ui/markdown-content.tsx"

report() {
  violacoes=$((violacoes + 1))
  printf '  %-52s %s\n' "$1" "$2"
}

warn() {
  avisos=$((avisos + 1))
  printf '  %-52s aviso: %s\n' "$1" "$2"
}

untracked_diff() {
  [ -z "$base" ] || return 0
  git ls-files --others --exclude-standard -- "$@" | while IFS= read -r f; do
    git diff --no-index -U0 -- /dev/null "$f"
  done
}

changed_names() {
  "${diff_cmd[@]}" --name-only 2>/dev/null
  if [ -z "$base" ]; then
    git ls-files --others --exclude-standard
  fi
}

added_lines() {
  { "${diff_cmd[@]}" -- "$@" 2>/dev/null; untracked_diff "$@"; } | awk '
    /^\+\+\+ / { file = substr($0, 7); next }
    /^@@ / { split($0, h, "+"); split(h[2], n, /[, ]/); line = n[1]; next }
    /^\+/ { print file "\t" line "\t" substr($0, 2); line++ }
  '
}

strip_strings() {
  sed -e 's/"[^"]*"/""/g' -e "s/'[^']*'/''/g" -e 's/`[^`]*`/``/g'
}

is_generated() {
  case "$1" in src/shared/api/generated/*) return 0 ;; esac
  return 1
}

is_test_file() {
  case "$1" in *.test.ts|*.test.tsx) return 0 ;; esac
  return 1
}

needs_unit_test() {
  case "$1" in
    *.test.ts|*.test.tsx|*/index.ts|*.types.ts|*-api-keys.ts|*.d.ts) return 1 ;;
    src/features/*/model/*.ts|src/features/*/api/*.service.ts|src/shared/lib/*.ts|src/shared/api/*.ts|src/app/stores/*.ts) return 0 ;;
  esac
  return 1
}

echo "Checagem mecânica do diff — $escopo"
echo "Parte mecânica da revisão (skill deliver). Não substitui a leitura do diff."
echo

echo "1. Comentários e resíduos"
while IFS=$'\t' read -r f l c; do
  [ -z "${f:-}" ] && continue
  is_generated "$f" && continue
  limpo="$(printf '%s' "$c" | strip_strings)"
  printf '%s' "$limpo" | grep -qE '//|/\*' && report "$f:$l" "comentário em TypeScript"
  is_test_file "$f" && continue
  printf '%s' "$limpo" | grep -qE '\bconsole\.' && report "$f:$l" "console.* no código"
  printf '%s' "$limpo" | grep -qE '\bdebugger\b' && report "$f:$l" "debugger no código"
done < <(added_lines 'src/*.ts' 'src/*.tsx')

echo "2. Camadas e imports"
while IFS=$'\t' read -r f l c; do
  [ -z "${f:-}" ] && continue
  is_generated "$f" && continue
  printf '%s' "$c" | grep -qE '^\s*export default\b' && report "$f:$l" "export default (use named export)"
  printf '%s' "$c" | grep -qE "[\"']@/(features|widgets)/[^/\"']+/[^\"']+[\"']" \
    && report "$f:$l" "deep import: consuma o slice pelo index.ts"
  case "$f" in
    src/app/routes/*) ;;
    *) printf '%s' "$c" | grep -qE "[\"']@/pages(/|[\"'])" && report "$f:$l" "import de pages/ fora de app/routes" ;;
  esac
done < <(added_lines 'src/*.ts' 'src/*.tsx')

echo "3. Conteúdo não confiável e sessão"
while IFS=$'\t' read -r f l c; do
  [ -z "${f:-}" ] && continue
  [ "$f" = "$markdown_renderer" ] && continue
  printf '%s' "$c" | grep -q 'dangerouslySetInnerHTML' && report "$f:$l" "dangerouslySetInnerHTML fora de $markdown_renderer"
  printf '%s' "$c" | grep -qE '\b(localStorage|sessionStorage)\b' && warn "$f:$l" "storage do navegador: nunca para token ou dado de sessão"
done < <(added_lines 'src/*.ts' 'src/*.tsx')

echo "4. Segredos e artefatos gerados"
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    .env.example) ;;
    .env|.env.*|*/.env|*.pem|*.key|*.pfx) report "$f" "arquivo com segredo no diff" ;;
    src/shared/api/generated/*) warn "$f" "confirme que veio do gerador de tipos, não de edição à mão" ;;
  esac
done < <(changed_names | sort -u)
while IFS=$'\t' read -r f l c; do
  [ -z "${f:-}" ] && continue
  printf '%s' "$c" | grep -qiE '^VITE_[A-Z0-9_]*(SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE)' \
    && report "$f:$l" "segredo em VITE_*: tudo que é VITE_* vai para o navegador"
done < <(added_lines '.env.example')

echo "5. Testes"
while IFS= read -r f; do
  [ -f "$f" ] || continue
  needs_unit_test "$f" || continue
  [ -f "${f%.ts}.test.ts" ] || warn "$f" "lógica sem ${f%.ts}.test.ts"
done < <(changed_names | sort -u | grep -E '^src/.*\.ts$')

echo
if [ "$violacoes" -eq 0 ]; then
  echo "Nenhuma violação mecânica. Restam os itens que só a leitura do diff pega:"
  echo "  reaproveitamento antes de criar, placement por camada, public API filtrada, página fina,"
  echo "  loading/erro/vazio, erro do Core pelo code, testes do comportamento, escopo, memória revisada."
  [ "$avisos" -gt 0 ] && echo "  ($avisos aviso(s) acima.)"
  exit 0
fi

echo "$violacoes violação(ões). Corrija antes de entregar."
exit 1
