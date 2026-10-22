#!/usr/bin/env bash

HOOK_INPUT="$(cat)"

hook_field() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$HOOK_INPUT" | jq -r "$1 | if . == null then \"\" else tostring end" 2>/dev/null
    return
  fi
  printf '%s' "$HOOK_INPUT" | python3 -c '
import json, sys
value = json.load(sys.stdin)
for key in sys.argv[1].strip(".").split("."):
    value = value.get(key) if isinstance(value, dict) else None
print("" if value is None else json.dumps(value) if isinstance(value, bool) else value)' "$1" 2>/dev/null
}

block_tool() {
  printf '%s\n' "$1" >&2
  exit 2
}

block_stop() {
  if command -v jq >/dev/null 2>&1; then
    jq -cn --arg reason "$1" '{decision: "block", reason: $reason}'
  else
    python3 -c 'import json, sys; print(json.dumps({"decision": "block", "reason": sys.argv[1]}))' "$1"
  fi
  exit 0
}
