#!/usr/bin/env bash
# Generate next week's fitness content pack (run Sundays via cron / Cursor timer).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEEK_OF="${1:-$(date -u +%F)}"
GOAL="${2:-grow_followers}"

node "$ROOT/src/cli.js" week --weekOf "$WEEK_OF" --goal "$GOAL"
node "$ROOT/src/cli.js" grow --intensity steady

echo "Done. Import output/calendar-${WEEK_OF}.csv into Buffer/Later."
