#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
ARCHIVE_COMMIT="7266cf8df99ad811904933189666bbb827bd3ad1"
OUTPUT_DIR="${EPISODE1_OUTPUT_DIR:-$ROOT/output/episode1-proof}"
WORK_ROOT="${RUNNER_TEMP:-$(mktemp -d)}/comic-episode1-worker2"
WORKTREE="$WORK_ROOT/archive-app"

cleanup() {
  if git -C "$ROOT" worktree list --porcelain | grep -Fq "worktree $WORKTREE"; then
    git -C "$ROOT" worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK_ROOT" >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR" "$WORK_ROOT"

if ! git -C "$ROOT" cat-file -e "${ARCHIVE_COMMIT}^{commit}" 2>/dev/null; then
  git -C "$ROOT" fetch --no-tags origin "$ARCHIVE_COMMIT"
fi

ACTUAL_ARCHIVE_COMMIT="$(git -C "$ROOT" rev-parse "$ARCHIVE_COMMIT")"
if [[ "$ACTUAL_ARCHIVE_COMMIT" != "$ARCHIVE_COMMIT" ]]; then
  echo "Archive commit mismatch: $ACTUAL_ARCHIVE_COMMIT" >&2
  exit 1
fi

git -C "$ROOT" worktree add --detach "$WORKTREE" "$ARCHIVE_COMMIT"
node "$ROOT/scripts/prepare_episode1_proof_workspace.mjs" "$WORKTREE" "$ROOT" | tee "$OUTPUT_DIR/workspace-prepare.log"

cd "$WORKTREE"
npm ci --no-audit --no-fund | tee "$OUTPUT_DIR/npm-ci.log"
npx playwright install chromium | tee "$OUTPUT_DIR/playwright-install.log"

run_and_record() {
  local label="$1"
  shift
  echo "==> $label"
  "$@" 2>&1 | tee "$OUTPUT_DIR/${label// /-}.log"
}

run_and_record "npm run lint" npm run lint
run_and_record "npm run typecheck" npm run typecheck
EPISODE1_OUTPUT_DIR="$OUTPUT_DIR" run_and_record "npm test" npm test
run_and_record "npm run build" npm run build

node --input-type=module - "$OUTPUT_DIR" <<'NODE'
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve(process.argv[2]);
const pass = { status: 'pass', exitCode: 0 };
await writeFile(path.join(output, 'command-results.json'), `${JSON.stringify({
  'npm run lint': pass,
  'npm run typecheck': pass,
  'npm test': pass,
  'npm run build': pass,
  archiveCommit: '7266cf8df99ad811904933189666bbb827bd3ad1',
  executedAt: new Date().toISOString()
}, null, 2)}\n`);
NODE

cd "$ROOT"
node scripts/verify_episode1_proof_artifacts.mjs "$OUTPUT_DIR" | tee "$OUTPUT_DIR/artifact-verification.log"

echo "Episode 1 production proof completed: $OUTPUT_DIR"
