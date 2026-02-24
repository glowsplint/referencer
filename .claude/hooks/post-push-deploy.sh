#!/bin/bash
# After a git push, deploy both Workers to Cloudflare.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ "$COMMAND" == *"git push"* ]]; then
  echo "Deploying referencer-api..."
  cd "$CLAUDE_PROJECT_DIR/backend" && bunx wrangler deploy 2>&1

  echo "Deploying referencer-collab..."
  cd "$CLAUDE_PROJECT_DIR/collab-server" && bunx wrangler deploy 2>&1
fi
