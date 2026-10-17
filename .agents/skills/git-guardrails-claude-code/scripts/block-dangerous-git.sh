#!/bin/bash

INPUT=$(cat)
if ! COMMAND=$(printf '%s' "$INPUT" | jq -er '.tool_input.command | select(type == "string" and length > 0)'); then
  echo "BLOCKED: Could not parse the hook command (jq is required)." >&2
  exit 2
fi

GIT_ARG="([^[:space:]\"']+|\"[^\"]+\"|'[^']+')"
GIT_EXEC="(git|\"git\"|'git'|[^[:space:]\"']*/git|\"[^\"]*/git\"|'[^']*/git')"
GIT_PREFIX="(^|[[:space:];|&])${GIT_EXEC}([[:space:]]+((-C|-c|--git-dir|--work-tree)[[:space:]]+${GIT_ARG}|(--git-dir|--work-tree|--config-env)=${GIT_ARG}|--[a-z][a-z-]*|-[pP]))*[[:space:]]+"
DANGEROUS_PATTERNS=(
  "${GIT_PREFIX}push([[:space:]]|$)"
  "${GIT_PREFIX}reset --hard"
  "${GIT_PREFIX}clean([[:space:]]+-[-a-zA-Z]+)*[[:space:]]+(-[a-zA-Z]*f[a-zA-Z]*|--force)([[:space:]]|$)"
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
