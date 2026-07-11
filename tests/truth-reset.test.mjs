import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('truth state is current authority with LR1 active and no percentage', async () => {
  const truth = await json('project/truth-state.json');
  assert.equal(truth.repository, 'Pagebabe/comic');
  assert.equal(truth.status, 'recovery_line_active');
  assert.equal(truth.authority, 'current_project_truth');
  assert.equal(truth.trackingIssue, 38);
  assert.equal(truth.canon.status, 'decision_required');
  assert.equal(truth.canon.selectedPilot, null);
  assert.equal(truth.evidence.currentCoveragePercent, null);
  assert.equal(truth.evidence.percentageClaimAllowed, false);
  assert.equal(truth.productArchitecture.currentMain.type, 'audit_dashboard_shell');
  assert.equal(truth.productArchitecture.productionFoundation.branch, 'archive/legacy-comic-2026-07-10');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR0').status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR1').status, 'active_human_decision_required');
});

test('LR0 closure records the real merge, CI and Pages proof', async () => {
  const closure = await json('project/line-reset-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.pullRequest, 37);
  assert.equal(closure.mergeCommit, '47b513c31d5326efdf5bd8c81e835233f97b6b47');
  assert.equal(closure.ci.runId, 29133307545);
  assert.equal(closure.ci.conclusion, 'success');
  assert.equal(closure.deployment.runId, 29143665894);
  assert.equal(closure.deployment.conclusion, 'success');
  assert.equal(closure.deployment.publicVerificationPassed, true);
  assert.equal(closure.nextGate.id, 'LR1');
  assert.equal(closure.nextGate.trackingIssue, 38);
});

test('exactly two unselected pilot candidates are recorded', async () => {
  const candidates = await json('project/canon-candidates.json');
  assert.equal(candidates.status, 'human_decision_required');
  assert.equal(candidates.selectedCandidateId, null);
  assert.deepEqual(candidates.candidates.map((item) => item.title), ['Das Zimmer', 'Der Solidarpreis']);
  assert.ok(candidates.candidates.every((item) => item.status === 'candidate_not_selected'));
});

test('old evidence closure remains a bounded snapshot', async () => {
  const closure = await json('project/evidence-closure.json');
  assert.equal(closure.status, 'historical_bounded_snapshot');
  assert.equal(closure.authorityStatus, 'superseded_as_current_truth');
  assert.equal(closure.currentCompletenessClaimAllowed, false);
  assert.equal(closure.snapshotThroughPullRequest, 30);
  assert.equal(closure.truthAuditCorrection.currentEvidenceCoveragePercent, null);
  assert.equal(closure.classifications['CLAIM-016-complete-historical-pr-backfill'], 'disproven');
});

test('public files show LR0 closure and LR1 without completeness theater', async () => {
  const [readme, index, phaseUi, audit] = await Promise.all(['README.md','index.html','lr1-ui.js','audit-ui.js'].map(read));
  assert.match(readme, /LR0 Truth Reset[\s\S]*geschlossen/);
  assert.match(readme, /LR1 Pilotentscheidung[\s\S]*aktiv/);
  assert.match(readme, /Pilot-Canon:\s+DECISION_REQUIRED/);
  assert.match(index, /Line Reset abgeschlossen/);
  assert.match(index, /Issue #38/);
  assert.match(phaseUi, /LR0 TRUTH RESET/);
  assert.match(phaseUi, /AKTIVES GATE/);
  assert.match(audit, /HISTORISCHER SNAPSHOT/);
  assert.doesNotMatch(index, /Beweiskettenabdeckung:\s*100/);
  assert.doesNotMatch(phaseUi, /BEWEISKETTE 100% GESCHLOSSEN/);
});

test('recovery docs use one LR0 to LR6 sequence and reject Growth OS', async () => {
  const [audit, closureAudit, recovery, readme] = await Promise.all([
    'docs/TRUTH_AUDIT_2026-07-11.md',
    'docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md',
    'docs/PRODUCTION_APP_RECOVERY_PLAN.md',
    'README.md'
  ].map(read));
  assert.match(audit, /3979c65c4cc15f4ed4b7c72c92f559ace1c747ac/);
  assert.match(closureAudit, /29133307545/);
  assert.match(closureAudit, /29143665894/);
  assert.match(recovery, /ohne den Archivbranch blind auf `main` zu kippen/i);
  for (const marker of ['LR0','LR1','LR2','LR3','LR4','LR5','LR6']) assert.match(recovery, new RegExp(marker));
  assert.match(recovery, /Control[\s\S]*Studio[\s\S]*Prompt Queue[\s\S]*Restore/);
  assert.match(readme, /kein Growth OS/i);
});
