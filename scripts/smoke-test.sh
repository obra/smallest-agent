#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

agent="src/smallest-agent.js"

if [[ -f .env ]]; then
  set -a
  . ./.env
  set +a
fi

: "${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY is required (set it or add it to .env)}"

match() {
  local pattern="$1" text="$2"
  if command -v rg >/dev/null 2>&1; then
    printf "%s" "$text" | rg -q --pcre2 "$pattern"
  else
    printf "%s" "$text" | grep -Eq "$pattern"
  fi
}

fail() {
  printf "FAIL: %s\n" "$1" >&2
  exit 1
}

pass() {
  printf "PASS: %s\n" "$1"
}

run_case() {
  local prompt="$1"
  printf "%s" "$prompt" | node "$agent" 2>&1
}

printf "Running smoke tests for %s (%s bytes)\n" "$agent" "$(wc -c <"$agent" | tr -d ' ')"
node --check "$agent"
pass "syntax check"

out="$(run_case $'hi!\n')"
[[ "$out" == *"> " ]] || fail "prompt marker missing after plain response"
pass "plain response ends with prompt"

out="$(run_case $'Use your sh tool to run exactly: uuidgen\nReturn only command output.\n')"
match "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}" "$out" || fail "uuidgen output not found"
[[ "$out" == *"> " ]] || fail "prompt marker missing after successful tool call"
pass "tool success path"

set +e
out="$(run_case $'Use your sh tool to run exactly: command_not_found_xyz\nReturn only what happened.\n')"
code=$?
set -e

[[ $code -eq 0 ]] || fail "agent crashed on failing command (exit $code)"
match "command_not_found_xyz" "$out" || fail "failing command output missing"
if match "Error: Command failed|node:internal/errors" "$out"; then
  fail "detected crash stack trace in output"
fi
[[ "$out" == *"> " ]] || fail "prompt marker missing after failing tool call"
pass "tool failure path stays alive"

printf "All smoke tests passed.\n"
