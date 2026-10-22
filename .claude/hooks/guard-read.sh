#!/usr/bin/env bash
set -uo pipefail

. "$(dirname -- "${BASH_SOURCE[0]}")/hook-io.sh"

file="$(hook_field .tool_input.file_path | tr '\\' '/')"
name="${file##*/}"

is_secret_file() {
  case "$name" in
    .env.example) return 1 ;;
    .env|.env.*|launchSettings.json) return 0 ;;
  esac
  return 1
}

if is_secret_file; then
  block_tool "$file guarda segredos e não é lido pelo agente, neste repositório nem no Momentum.Core. Use o .env.example para saber quais variáveis existem."
fi

exit 0
