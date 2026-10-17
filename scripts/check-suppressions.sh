#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if command -v node >/dev/null 2>&1; then
  node "${SCRIPT_DIR}/check-suppressions.mjs" "$@"
else
  echo "Node.js is required for mechanical suppression check."
  exit 1
fi
