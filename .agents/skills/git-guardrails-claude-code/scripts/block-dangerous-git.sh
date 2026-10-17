#!/bin/bash

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

GIT_ARG="([^[:space:]\"']+|\"[^\"]+\"|'[^']+')"
GIT_PREFIX="(^|[[:space:];|&])git([[:space:]]+((-C|-c|--git-dir|--work-tree)[[:space:]]+${GIT_ARG}|(--git-dir|--work-tree|--config-env)=${GIT_ARG}|--[a-z][a-z-]*|-[pP]))*[[:space:]]+"
DANGEROUS_PATTERNS=(
  "${GIT_PREFIX}push([[:space:]]|$)"
  "${GIT_PREFIX}reset --hard"
  "${GIT_PREFIX}clean -fd"
  "${GIT_PREFIX}clean -f"
  "${GIT_PREFIX}branch -D"
  "${GIT_PREFIX}checkout \."
  "${GIT_PREFIX}restore \."
  "push --force"
  "reset --hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
