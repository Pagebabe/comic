#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SOURCE="$ROOT/scripts/run_final_program_rehearsal.sh"
PATCHED="${RUNNER_TEMP:-/tmp}/run-final-program-rehearsal-v2.sh"

python3 - "$SOURCE" "$PATCHED" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1]).read_text()
old = '''log_run "fresh-install-drill" npm run drill:fresh-install
log_run "fresh-install-report" npm run check:fresh-install-report'''
new = '''FRESH_SOURCE="$PARENT/fresh-source"
log_run "fresh-source-clone" git clone --no-hardlinks "$WORKTREE" "$FRESH_SOURCE"
test -f "$FRESH_SOURCE/.git/HEAD"
log_run "fresh-install-drill" node scripts/fresh_install_drill.mjs --source "$FRESH_SOURCE" --output "$WORKTREE/output/fresh-install"
log_run "fresh-install-report" npm run check:fresh-install-report'''
if source.count(old) != 1:
    raise SystemExit('Expected fresh-install command block was not found exactly once')
patched = source.replace(old, new)
Path(sys.argv[2]).write_text(patched)
PY

chmod +x "$PATCHED"
exec bash "$PATCHED"
