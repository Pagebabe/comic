import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const outcome = await readFile(new URL('../.github/workflows/pages-outcome.yml', import.meta.url), 'utf8');
const barrier = await readFile(new URL('../scripts/wait_public_proof_barrier.mjs', import.meta.url), 'utf8');
const barrierStep = 'Wait for ten commit-consistent public contracts';
const liveStep = 'Execute public desktop and mobile proofs';

test('Pages workflow deploys root, audit and Studio without issue reporting',()=>{
  assert.match(pages,/uses: actions\/deploy-pages@v4/);
  assert.match(pages,/cp index\.html audit\.html gateway\.css/);
  assert.match(pages,/build_root_entry_proof\.mjs/);
  assert.match(pages,/build_visual_proof\.mjs/);
  assert.match(pages,/check_root_entry_pages_artifact\.mjs/);
  assert.match(pages,/check_cockpit_pages_artifact\.mjs/);
  assert.doesNotMatch(pages,/actions\/github-script/);
  assert.doesNotMatch(pages,/issues: write/);
});

test('Outcome checks exact deployed commit and all public routes without redeploying',()=>{
  assert.match(outcome,/workflow_run:/);
  assert.match(outcome,/ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(outcome,/GITHUB_SHA="\$EXPECTED_COMMIT" node scripts\/build_root_entry_proof\.mjs/);
  assert.match(outcome,/GITHUB_SHA="\$EXPECTED_COMMIT" node studio-app\/tests\/production-cockpit-smoke\.mjs/);
  for(const checker of ['check_root_entry_public_evidence.mjs','check_public_pages_evidence.mjs','check_cockpit_public_evidence.mjs','check_public_academy_evidence.mjs','check_readiness_public_evidence.mjs'])assert.ok(outcome.includes(checker));
  assert.doesNotMatch(outcome,/actions\/deploy-pages/);
  assert.doesNotMatch(outcome,/actions\/upload-pages-artifact/);
});

test('Job-level environment does not use unavailable env context',()=>{
  const start=outcome.indexOf('  verify_public:');const steps=outcome.indexOf('    steps:',start);assert.ok(start>=0&&steps>start);const header=outcome.slice(start,steps);assert.doesNotMatch(header,/\$\{\{\s*env\./);assert.match(header,/PAGE_URL: https:\/\/pagebabe\.github\.io\/comic\//);
});

test('Ten-contract barrier runs before live browser proof',()=>{
  assert.ok(outcome.indexOf(barrierStep)>=0);assert.ok(outcome.indexOf(liveStep)>outcome.indexOf(barrierStep));assert.match(outcome,/--attempts 30/);assert.match(barrier,/cache-control': 'no-cache/);assert.match(outcome,/--retry-all-errors/);
});

test('Rich proof closes UI1 only after root public checker',()=>{
  const verify=outcome.indexOf('Verify public root, recovery, cockpit, Academy and readiness contracts');const publish=outcome.indexOf('Publish rich public proof and close UI1 only after full root proof');assert.ok(verify>=0&&publish>verify);assert.match(outcome,/Root-Primäraktion: Produktions-Cockpit öffnen/);assert.match(outcome,/Audit-Route:/);assert.match(outcome,/for\(const issueNumber of \[117,121\]\)/);assert.match(outcome,/state:'closed'/);assert.match(outcome,/Issue #95 bleibt bis zum beobachteten Nullwissen-Lauf/);
});

test('Failure reporting preserves last good online proof',()=>{
  assert.match(outcome,/report_failure:/);assert.match(outcome,/without overwriting last good proof/);assert.match(outcome,/Der letzte ausführlich bewiesene Online-Stand bleibt unverändert dokumentiert/);
});

test('Barrier owns all ten commit-consistent files',()=>{
  for(const file of ['runtime-evidence.json','root-entry-runtime-evidence.json','studio-runtime-evidence.json','academy-runtime-evidence.json','readiness-runtime-evidence.json','cockpit-runtime-evidence.json','production-academy-status.json','production-readiness-v1.json','production-cockpit-v1.json','root-entry-v1.json'])assert.ok(barrier.includes(file),`missing barrier-owned file: ${file}`);
});

test('Outcome snapshot contains screenshots required by all public checkers',()=>{
  for(const file of ['root-entry-desktop.png','root-entry-mobile.png','dashboard-desktop.png','dashboard-mobile.png','studio-desktop.png','studio-mobile.png','academy-desktop.png','academy-mobile.png','readiness-desktop.png','readiness-mobile.png','cockpit-desktop.png','cockpit-mobile.png'])assert.ok(outcome.includes(file),`missing outcome-owned file: ${file}`);
});
