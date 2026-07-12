#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
MAIN="b58534d0a737b1d01834628177e1090de027de61"
WORKER1="1bb4df874d8e2a36fd32fbad19074ed629ec922d"
WORKER2="e8b8e348120ad527abe7a33caab9f56b6627f8c2"
GROWTH="77f77db12a227c976e6e33ef7afde655f455772e"
OUT="${FINAL_REHEARSAL_OUTPUT_DIR:-$ROOT/output/final-program-rehearsal}"
PARENT="$(mktemp -d "${RUNNER_TEMP:-/tmp}/comic-final-rehearsal.XXXXXX")"
WORKTREE="$PARENT/integration"

cleanup() {
  if git -C "$ROOT" worktree list --porcelain | grep -Fq "worktree $WORKTREE"; then
    git -C "$ROOT" worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
  fi
  rm -rf "$PARENT" >/dev/null 2>&1 || true
}
trap cleanup EXIT

rm -rf "$OUT"
mkdir -p "$OUT/logs"

log_run() {
  local label="$1"
  shift
  echo "==> $label"
  "$@" 2>&1 | tee "$OUT/logs/${label// /-}.log"
}

resolve_remote_head() {
  local branch="$1"
  git -C "$ROOT" rev-parse "refs/remotes/origin/$branch"
}

echo "==> Fetch exact program refs"
git -C "$ROOT" fetch --no-tags origin \
  main:refs/remotes/origin/main \
  worker/canon-lock:refs/remotes/origin/worker/canon-lock \
  worker/episode1-proof:refs/remotes/origin/worker/episode1-proof \
  worker/current-main-growth-reintegration:refs/remotes/origin/worker/current-main-growth-reintegration

[[ "$(resolve_remote_head main)" == "$MAIN" ]]
[[ "$(resolve_remote_head worker/canon-lock)" == "$WORKER1" ]]
[[ "$(resolve_remote_head worker/episode1-proof)" == "$WORKER2" ]]
[[ "$(resolve_remote_head worker/current-main-growth-reintegration)" == "$GROWTH" ]]

SOURCE_STATUS_BEFORE="$(git -C "$ROOT" status --porcelain)"
if [[ -n "$SOURCE_STATUS_BEFORE" ]]; then
  echo "Source branch is not clean before rehearsal" >&2
  printf '%s\n' "$SOURCE_STATUS_BEFORE" >&2
  exit 1
fi

git -C "$ROOT" worktree add --detach "$WORKTREE" "$MAIN"
git -C "$WORKTREE" config user.name "comic-final-rehearsal"
git -C "$WORKTREE" config user.email "actions@users.noreply.github.com"

cd "$WORKTREE"
log_run "merge-worker-1" git merge --no-ff --no-edit "$WORKER1"
log_run "merge-worker-2" git merge --no-ff --no-edit "$WORKER2"
cp package.json "$OUT/package-after-worker2.json"
git show "$GROWTH:package.json" > "$OUT/package-growth.json"

set +e
git merge --no-ff --no-edit "$GROWTH" >"$OUT/logs/merge-growth.log" 2>&1
GROWTH_MERGE_EXIT=$?
set -e
cat "$OUT/logs/merge-growth.log"

CONFLICT_MODE="NONE"
CONFLICT_FILES=""
if [[ "$GROWTH_MERGE_EXIT" -ne 0 ]]; then
  CONFLICT_MODE="EXPECTED_PACKAGE_JSON"
  CONFLICT_FILES="$(git diff --name-only --diff-filter=U | LC_ALL=C sort)"
  if [[ "$CONFLICT_FILES" != "package.json" ]]; then
    echo "Unexpected conflict set: $CONFLICT_FILES" >&2
    git merge --abort >/dev/null 2>&1 || true
    exit 1
  fi

  cp "$OUT/package-after-worker2.json" package.json
  node --input-type=module - "$OUT/package-growth.json" <<'NODE'
import fs from 'node:fs';

const growthPath = process.argv[2];
const ours = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const growth = JSON.parse(fs.readFileSync(growthPath, 'utf8'));
const scripts = ours.scripts ||= {};
const growthScripts = growth.scripts || {};

for (const name of [
  'test:growth-handoff',
  'test:growth-integration',
  'test:growth',
  'growth:handoff-check',
  'growth:integration-check',
  'growth:check'
]) {
  if (typeof growthScripts[name] !== 'string' || growthScripts[name].length === 0) {
    throw new Error(`Missing required Growth script: ${name}`);
  }
  scripts[name] = growthScripts[name];
}

const ensureTestFile = (file) => {
  if (scripts.test.includes(file)) return;
  const marker = ' && python3 ';
  if (!scripts.test.includes(marker)) throw new Error('Root test insertion marker missing');
  scripts.test = scripts.test.replace(marker, ` ${file}${marker}`);
};

ensureTestFile('tests/growth-os-handoff.test.mjs');
ensureTestFile('tests/growth-os-studio-mkt0-integration.test.mjs');

for (const command of [
  'node growth-os/handoff-check.mjs',
  'node growth-os/studio-mkt0-integration-check.mjs'
]) {
  if (!scripts.test.includes(command)) scripts.test += ` && ${command}`;
  if (!scripts.check.includes(command)) scripts.check += ` && ${command}`;
}

ours.growthReintegration = growth.growthReintegration;
fs.writeFileSync('package.json', `${JSON.stringify(ours, null, 2)}\n`);
NODE

  git add package.json
  REMAINING="$(git diff --name-only --diff-filter=U | LC_ALL=C sort)"
  if [[ -n "$REMAINING" ]]; then
    echo "Unresolved conflicts remain: $REMAINING" >&2
    git merge --abort >/dev/null 2>&1 || true
    exit 1
  fi
  git commit -m "rehearsal: semantically merge canon and growth package contracts"
fi

git diff --check

node --input-type=module <<'NODE'
import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts || {};
const requiredScripts = [
  'lint', 'typecheck', 'build', 'test', 'check',
  'test:cast-canon', 'check:cast-canon',
  'test:growth-handoff', 'test:growth-integration', 'test:growth',
  'growth:handoff-check', 'growth:integration-check', 'growth:check'
];
for (const name of requiredScripts) {
  if (typeof scripts[name] !== 'string' || scripts[name].length === 0) throw new Error(`Missing merged script: ${name}`);
}
for (const token of [
  'tests/cast-canon.test.mjs',
  'tests/growth-os-handoff.test.mjs',
  'tests/growth-os-studio-mkt0-integration.test.mjs',
  'node scripts/check_cast_canon.mjs',
  'node growth-os/handoff-check.mjs',
  'node growth-os/studio-mkt0-integration-check.mjs'
]) {
  if (!scripts.test.includes(token) && !scripts.check.includes(token)) throw new Error(`Merged package token missing: ${token}`);
}
if (pkg.growthReintegration?.legacyHistoryMerged !== false) throw new Error('Legacy Growth history boundary lost');
if (pkg.growthReintegration?.mainMergeAllowed !== false) throw new Error('Main merge boundary lost');
if (pkg.growthReintegration?.liveActivationAllowed !== false) throw new Error('Live boundary lost');
NODE

for required in \
  project/cast-canon-v1.json \
  scripts/check_cast_canon.mjs \
  tests/cast-canon.test.mjs \
  scripts/run_episode1_production_proof.sh \
  tests/episode1-proof-contract.test.mjs \
  growth-os/handoff.mjs \
  growth-os/studio-mkt0-integration.mjs \
  project/current-main-growth-reintegration.json
  do
    test -f "$required"
  done

INTEGRATION_SHA="$(git rev-parse HEAD)"
INTEGRATION_TREE="$(git rev-parse 'HEAD^{tree}')"
PACKAGE_SHA256="$(sha256sum package.json | awk '{print $1}')"
export GITHUB_SHA="$INTEGRATION_SHA"

node --input-type=module - "$OUT" "$MAIN" "$WORKER1" "$WORKER2" "$GROWTH" "$INTEGRATION_SHA" "$INTEGRATION_TREE" "$PACKAGE_SHA256" "$CONFLICT_MODE" "$CONFLICT_FILES" <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
const [out, main, worker1, worker2, growth, integrationSha, treeSha, packageSha, conflictMode, conflictFiles] = process.argv.slice(2);
const proof = {
  schemaVersion: 1,
  trackingIssue: 147,
  sourceHeads: { main, worker1, worker2, growth },
  mergeOrder: ['worker1', 'worker2', 'growth'],
  integrationSha,
  integrationTree: treeSha,
  packageSha256: packageSha,
  conflictMode,
  conflictFiles: conflictFiles ? conflictFiles.split('\n').filter(Boolean) : [],
  semanticPackageMerge: conflictMode === 'EXPECTED_PACKAGE_JSON',
  sourceRefsExact: true,
  sourceWorktreeCleanBefore: true,
  mainMergeAllowed: false,
  liveActivationAllowed: false,
  status: 'INTEGRATION_TREE_CREATED_PENDING_REGRESSION'
};
fs.writeFileSync(path.join(out, 'final-program-rehearsal.json'), `${JSON.stringify(proof, null, 2)}\n`);
NODE

log_run "npm-studio-ci" npm --prefix studio-app ci
log_run "npm-root-playwright" npm install --no-save playwright@1.61.1
log_run "playwright-chromium" npx playwright install chromium

log_run "npm-run-lint" npm run lint
log_run "npm-run-typecheck" npm run typecheck
log_run "test-cast-canon" npm run test:cast-canon
log_run "test-growth-handoff" npm run test:growth-handoff
log_run "test-growth-integration" npm run test:growth-integration
log_run "growth-handoff-check" npm run growth:handoff-check
log_run "growth-integration-check" npm run growth:integration-check
log_run "episode-proof-contract" node --test --test-concurrency=1 tests/episode1-proof-contract.test.mjs
log_run "npm-test" npm test
log_run "npm-build" npm run build

rm -rf _site
mkdir -p _site/studio _site/proof/studio _site/proof/readiness _site/proof/cockpit
cp index.html app.js lr1-ui.js audit-ui.js styles.css audit.css m1.css _site/
cp -R project docs lib assets _site/
cp -R studio-app/dist/. _site/studio/
touch _site/.nojekyll

python3 -m http.server 4174 --directory _site >"$OUT/logs/browser-server.log" 2>&1 &
SERVER_PID=$!
READY=0
for attempt in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:4174/ >/dev/null && curl -fsS http://127.0.0.1:4174/studio/ >/dev/null; then
    READY=1
    break
  fi
  sleep 1
done
if [[ "$READY" -ne 1 ]]; then
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  exit 1
fi

log_run "dashboard-browser" node scripts/build_visual_proof.mjs http://127.0.0.1:4174/
log_run "studio-browser" node studio-app/tests/browser-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/studio
log_run "cockpit-browser" node studio-app/tests/production-cockpit-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/cockpit
log_run "academy-browser" node studio-app/tests/academy-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/studio
log_run "readiness-browser" node studio-app/tests/academy-readiness-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/readiness
kill "$SERVER_PID" >/dev/null 2>&1 || true

log_run "pages-artifact" node scripts/check_pages_artifact.mjs --site _site --expect-commit "$INTEGRATION_SHA"
log_run "academy-pages-artifact" node scripts/check_academy_pages_artifact.mjs --site _site --expect-commit "$INTEGRATION_SHA"
log_run "readiness-pages-artifact" node scripts/check_readiness_pages_artifact.mjs --site _site --expect-commit "$INTEGRATION_SHA"
log_run "cockpit-pages-artifact" node scripts/check_cockpit_pages_artifact.mjs --site _site --expect-commit "$INTEGRATION_SHA"

log_run "timing-export" node scripts/export_ep001_timing.mjs
log_run "asset-scanner-unit" python3 -m unittest tests/test_asset_recovery.py -v
log_run "m1-render" python3 scripts/render_m1.py
log_run "operator-doctor" npm run doctor
log_run "operator-recovery-drill" npm run drill:operator-recovery
log_run "operator-recovery-report" npm run check:operator-recovery-report
log_run "fresh-install-drill" npm run drill:fresh-install
log_run "fresh-install-report" npm run check:fresh-install-report
log_run "episode1-production-proof" bash scripts/run_episode1_production_proof.sh

mkdir -p "$OUT/integration-output" "$OUT/browser-proof"
cp -R output/. "$OUT/integration-output/"
cp -R _site/proof/. "$OUT/browser-proof/"

rm -rf node_modules package-lock.json
INTEGRATION_STATUS_AFTER="$(git status --porcelain --untracked-files=no)"
if [[ -n "$INTEGRATION_STATUS_AFTER" ]]; then
  echo "Tracked integration worktree changes after proof:" >&2
  printf '%s\n' "$INTEGRATION_STATUS_AFTER" >&2
  exit 1
fi

cd "$ROOT"
git worktree remove --force "$WORKTREE"
rm -rf "$PARENT"
trap - EXIT

if git worktree list --porcelain | grep -Fq "worktree $WORKTREE"; then
  echo "Integration worktree was not removed" >&2
  exit 1
fi

SOURCE_STATUS_AFTER="$(git status --porcelain)"
if [[ -n "$SOURCE_STATUS_AFTER" ]]; then
  echo "Source branch changed during rehearsal" >&2
  printf '%s\n' "$SOURCE_STATUS_AFTER" >&2
  exit 1
fi

node --input-type=module - "$OUT/final-program-rehearsal.json" <<'NODE'
import fs from 'node:fs';
const file = process.argv[2];
const proof = JSON.parse(fs.readFileSync(file, 'utf8'));
proof.fullRegressionGreen = true;
proof.browserProofGreen = true;
proof.freshInstallGreen = true;
proof.operatorRecoveryGreen = true;
proof.episodePipelineGreen = true;
proof.worktreeRemoved = true;
proof.sourceWorktreeCleanAfter = true;
proof.mainMergeAllowed = false;
proof.liveActivationAllowed = false;
proof.status = 'PROGRAM_FINAL_REHEARSAL_PROVEN';
fs.writeFileSync(file, `${JSON.stringify(proof, null, 2)}\n`);
NODE

sha256sum "$OUT/final-program-rehearsal.json" > "$OUT/final-program-rehearsal.sha256"
echo "Final program rehearsal proven: $OUT"
