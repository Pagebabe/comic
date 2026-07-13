import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = await readFile(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
const outcome = await readFile(new URL('../.github/workflows/pages-outcome.yml', import.meta.url), 'utf8');
const barrier = await readFile(new URL('../scripts/wait_public_proof_barrier.mjs', import.meta.url), 'utf8');

const barrierStep = 'Wait for eight commit-consistent public contracts';
const liveStep = 'Execute public root, Studio, cockpit, Academy and readiness proofs';

test('Pages workflow deploys root and Studio but does not own public verification or issue reporting', () => {
  assert.match(pages, /name: Deploy Comic Factory Dashboard/);
  assert.match(pages, /uses: actions\/deploy-pages@v4/);
  assert.match(pages, /Verify exact artifact before deployment/);
  assert.match(pages, /build_root_entry_proof\.mjs/);
  assert.match(pages, /build_visual_proof\.mjs http:\/\/127\.0\.0\.1:4173\/audit\.html/);
  assert.match(pages, /check_root_entry_pages_artifact\.mjs/);
  assert.match(pages, /production-cockpit-smoke\.mjs/);
  assert.match(pages, /check_cockpit_pages_artifact\.mjs/);
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
  assert.match(outcome, /GITHUB_SHA="\$EXPECTED_COMMIT" node scripts\/build_root_entry_proof\.mjs/);
  assert.match(outcome, /GITHUB_SHA="\$EXPECTED_COMMIT" node studio-app\/tests\/browser-smoke\.mjs/);
  assert.match(outcome, /GITHUB_SHA="\$EXPECTED_COMMIT" node studio-app\/tests\/production-cockpit-smoke\.mjs/);
  assert.match(outcome, /check_root_entry_public_evidence\.mjs/);
  assert.match(outcome, /check_public_pages_evidence\.mjs/);
  assert.match(outcome, /check_cockpit_public_evidence\.mjs/);
  assert.match(outcome, /check_public_academy_evidence\.mjs/);
  assert.match(outcome, /check_readiness_public_evidence\.mjs/);
  assert.doesNotMatch(outcome, /actions\/deploy-pages/);
  assert.doesNotMatch(outcome, /actions\/upload-pages-artifact/);
});

test('Job-level environment does not use the unavailable env context', () => {
  const jobStart = outcome.indexOf('  verify_public:');
  const stepsStart = outcome.indexOf('    steps:', jobStart);
  assert.ok(jobStart >= 0 && stepsStart > jobStart);
  const jobHeader = outcome.slice(jobStart, stepsStart);
  assert.doesNotMatch(jobHeader, /\$\{\{\s*env\./);
  assert.match(jobHeader, /PAGE_URL: https:\/\/pagebabe\.github\.io\/comic\//);
});

test('Commit-consistent barrier runs before any live browser proof', () => {
  const barrierPosition = outcome.indexOf(barrierStep);
  const livePosition = outcome.indexOf(liveStep);
  assert.ok(barrierPosition >= 0);
  assert.ok(livePosition > barrierPosition);
  assert.match(outcome, /node scripts\/wait_public_proof_barrier\.mjs/);
  assert.match(outcome, /--expect-commit "\$EXPECTED_COMMIT"/);
  assert.match(outcome, /--attempts 30/);
  assert.match(barrier, /cache-control': 'no-cache/);
  assert.match(outcome, /--retry-all-errors/);
});

test('Public barrier separates parent, strategic contract and operational review line', () => {
  assert.match(barrier, /activeParentTrackingIssue === 82/);
  assert.match(barrier, /strategicContractTrackingIssue === 88/);
  assert.match(barrier, /completedAssetScan === 123/);
  assert.match(barrier, /activeReviewGate === 153/);
  assert.match(barrier, /localExecutionTask === 155/);
  assert.match(barrier, /toolingPullRequest === 154/);
  assert.match(barrier, /activeWorkspace === 'review'/);
  assert.match(barrier, /LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED/);
  assert.match(barrier, /data\.activeGate\?\.id === 'P1-RICCO-001'/);
  assert.match(barrier, /data\.activeGate\?\.trackingIssue === 153/);
  assert.match(barrier, /issues\/155/);
  assert.doesNotMatch(barrier, /data\.activeGate\?\.id === 'LR5\.1'/);
  assert.doesNotMatch(barrier, /data\.nextAllowedStep\?\.decision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE'/);
});

test('Outcome workflow publishes root and active-line proof only after all public checks pass', () => {
  const verifyPosition = outcome.indexOf('Verify public root, recovery, cockpit, Academy and readiness contracts');
  const publishPosition = outcome.indexOf('Publish rich public proof and preserve honest boundaries');
  assert.ok(verifyPosition >= 0);
  assert.ok(publishPosition > verifyPosition);
  assert.match(outcome, /Öffentlicher Root-Einstieg: PASS/);
  assert.match(outcome, /Root-Primäraktion: \$\{root\.primaryAction\}/);
  assert.match(outcome, /Parent-Gate: LR5 · Issue #82/);
  assert.match(outcome, /Strategischer Ricco-Vertrag: LR5\.1 · Issue #88/);
  assert.match(outcome, /Abgeschlossener Assetscan: Issue #123/);
  assert.match(outcome, /Aktives Review-Gate: Issue #153/);
  assert.match(outcome, /Lokaler M1-Auftrag: Issue #155/);
  assert.match(outcome, /Review-Tooling: PR #154/);
  assert.match(outcome, /Aktiver Cockpit-Bereich: \$\{cockpit\.activeWorkspace\}/);
  assert.match(outcome, /Nächste erlaubte Entscheidung: \$\{cockpit\.nextDecision\}/);
  assert.match(outcome, /Produktions-Cockpit: \$\{cockpit\.status\}/);
  assert.match(outcome, /Cockpit-Arbeitsbereiche: \$\{cockpit\.workspaceCount\}\/6/);
  assert.match(outcome, /Production Ready: \$\{readiness\.productionReady\?'ja':'nein'\}/);
  assert.match(outcome, /Beginner Ready: \$\{readiness\.beginnerReady\?'ja':'nein'\}/);
  assert.match(outcome, /Issue #95 bleibt bis zum beobachteten Nullwissen-Lauf und zur vollständigen geprüften Episode offen/);
  assert.match(outcome, /ui1-root-public-proof/);
  assert.match(outcome, /active-line-public-proof/);
  assert.match(outcome, /for\(const issueNumber of \[117,121\]\)/);
  assert.match(outcome, /issue_number:issueNumber,state:'closed',state_reason:'completed'/);
  assert.match(outcome, /issue_number:160,state:'closed',state_reason:'completed'/);
  assert.match(outcome, /Die kreative Assetprüfung bleibt in #153\/#155 offen/);
});

test('Failure reporting preserves the last good online proof', () => {
  assert.match(outcome, /report_failure:/);
  assert.match(outcome, /needs: \[verify_public\]/);
  assert.match(outcome, /without overwriting last good proof/);
  assert.match(outcome, /Der letzte ausführlich bewiesene Online-Stand bleibt unverändert dokumentiert/);
  assert.doesNotMatch(outcome, /Rich-Proof unvollständig/);
  assert.doesNotMatch(outcome, /Deployment erfolgreich, Detailbeweis ausstehend/);
});

test('Barrier owns all eight commit-consistent contract files', () => {
  for (const file of [
    'runtime-evidence.json',
    'studio-runtime-evidence.json',
    'academy-runtime-evidence.json',
    'readiness-runtime-evidence.json',
    'cockpit-runtime-evidence.json',
    'production-academy-status.json',
    'production-readiness-v1.json',
    'production-cockpit-v1.json',
  ]) {
    assert.ok(barrier.includes(file), `missing barrier-owned file: ${file}`);
  }
});

test('Outcome snapshot contains root and remaining files required by public checkers', () => {
  for (const file of [
    'root-entry-v1.json',
    'root-entry-runtime-evidence.json',
    'root-entry-desktop.png',
    'root-entry-mobile.png',
    'lr3-production-loop-closure.json',
    'lr4-selected-pilot-closure.json',
    'lr5-ricco-master-source-inventory.json',
    'lr5-ricco-master-contract.json',
    'production-academy.json',
    'novice-acceptance-template.json',
    'dashboard-desktop.png',
    'dashboard-mobile.png',
    'studio-desktop.png',
    'studio-mobile.png',
    'academy-desktop.png',
    'academy-mobile.png',
    'readiness-desktop.png',
    'readiness-mobile.png',
    'cockpit-desktop.png',
    'cockpit-mobile.png',
  ]) {
    assert.ok(outcome.includes(file), `missing outcome-owned file: ${file}`);
  }
});
