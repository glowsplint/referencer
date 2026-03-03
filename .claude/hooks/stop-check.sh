#!/bin/bash
# Stop hook: prevent Claude from finishing if unit tests are failing
INPUT=$(cat)

# Avoid infinite loop — if we already blocked once, let Claude stop
if echo "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/frontend" || exit 0

# Run unit tests (not e2e — too slow for every stop)
if ! bun run test:run --changed --reporter=dot 2>/dev/null; then
  echo "Unit tests are failing. Fix them before finishing." >&2
  exit 2
fi

exit 0
