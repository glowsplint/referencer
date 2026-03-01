#!/bin/bash
# PostToolUse hook: run ESLint on edited TS/TSX files
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only lint JS/TS files
if ! echo "$FILE_PATH" | grep -qE '\.(js|jsx|ts|tsx)$'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR/frontend" || exit 0

# Run ESLint on the specific file
RELATIVE=$(echo "$FILE_PATH" | sed "s|.*frontend/||")
if ! bunx eslint --quiet "$RELATIVE" 2>&1; then
  echo "ESLint found issues in $FILE_PATH" >&2
  exit 2
fi

exit 0
