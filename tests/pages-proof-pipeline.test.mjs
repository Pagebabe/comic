import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const outcome = await readFile(new URL('../.github/workflows/pages-outcome.yml', import.meta.url), 'utf8');

test('Pages workflow deploys but does not own public verification or issue reporting', () => {
  assert.match(pages, /name: Deploy Comic Factory Dashboard/);
  assert.match(pages, /uses: actions\/deploy-pages@v4/);
  assert.match(pages, /Verify exact artifact before deployment/);
  assert.doesNotMatch(pages, /Verify exact public recovery/);
  assert.doesNotMatch(pages, /check_public_pages_evidence\.mjs/);
  assert.doesNotMatch(pages, /actions\/github-script/);
  assert.doesNotMatch(pages, /issues: write/);
});

test('Outcome workflow checks the exact deployed commit without redeploying', () => {
  assert.match(outcome, /workflow_run:/);
  assert.match(outcome, /workflows: \["Deploy Comic Factory Dashboard"\]/);
  assert.match(outcome, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(outcome, /EXPECTED_COMMIT: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(outcome, /GITHUB_SHA="\$EXPECTED_COMMIT" node studio-app\/tests\/browser-smoke\.mjs/);
  assert.match(outcome, /check_public_pages_evidence\.mjs/);
  assert.match(outcome, /check_public_academy_evidence\.mjs/);
  assert.match(outcome, /check_readiness_public_evidence\.mjs/);
  assert.doesNotMatch(outcome, /actions\/deploy-pages/);
  assert.doesNotMatch(outcome, /actions\/upload-pages-artifact/);
});

test('Outcome workflow publishes rich proof only after all public checks pass', () => {
  const verifyPosition = outcome.indexOf('Verify public recovery, Academy and readiness contracts');
  const publishPosition = outcome.indexOf('Publish rich public proof and preserve honest boundaries');
  assert.ok(verifyPosition >= 0);
  assert.ok(publishPosition > verifyPosition);
  assert.match(outcome, /Production Ready: \$\{readiness\.productionReady\?'ja':'nein'\}/);
  assert.match(outcome, /Beginner Ready: \$\{readiness\.beginnerReady\?'ja':'nein'\}/);
  assert.match(outcome, /Issue #95 bleibt bis zum beobachteten Nullwissen-Lauf und zur vollständigen geprüften Episode offen/);
});

test('Failure reporting preserves the last good online proof', () => {
  assert.match(outcome, /report_failure:/);
  assert.match(outcome, /needs: \[verify_public\]/);
  assert.match(outcome, /without overwriting last good proof/);
  assert.match(outcome, /Der letzte ausführlich bewiesene Online-Stand bleibt unverändert dokumentiert/);
  assert.doesNotMatch(outcome, /Rich-Proof unvollständig/);
  assert.doesNotMatch(outcome, /Deployment erfolgreich, Detailbeweis ausstehend/);
});

test('Public snapshot includes every file required by all three public checkers', () => {
  for (const file of [
    'lr3-production-loop-closure.json',
    'lr4-selected-pilot-closure.json',
    'lr5-ricco-master-source-inventory.json',
    'lr5-ricco-master-contract.json',
    'production-academy.json',
    'production-academy-status.json',
    'production-readiness-v1.json',
    'novice-acceptance-template.json',
    'studio-runtime-evidence.json',
    'academy-runtime-evidence.json',
    'readiness-runtime-evidence.json',
    'dashboard-desktop.png',
    'dashboard-mobile.png',
    'studio-desktop.png',
    'studio-mobile.png',
    'academy-desktop.png',
    'academy-mobile.png',
    'readiness-desktop.png',
    'readiness-mobile.png'
  ]) {
    assert.ok(outcome.includes(file), `missing public snapshot file: ${file}`);
  }
});
