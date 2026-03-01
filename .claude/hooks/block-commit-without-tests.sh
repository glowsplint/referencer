#!/bin/bash
# PreToolUse hook: intercept git commit and verify tests pass first
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only intercept git commit commands
if ! echo "$COMMAND" | grep -qE 'git commit'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/frontend" || exit 0

# Run unit tests
if ! bun run test:run --reporter=silent 2>/dev/null; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Unit tests are failing. Run: cd frontend && bun run test:run to see failures. Fix them before committing."}}'
  exit 0
fi

exit 0
