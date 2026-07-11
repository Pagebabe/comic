import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('truth state is the current authority and forbids percentages', async () => {
  const truth = await json('project/truth-state.json');
  assert.equal(truth.repository, 'Pagebabe/comic');
  assert.equal(truth.status, 'line_reset_active');
  assert.equal(truth.authority, 'current_project_truth');
  assert.equal(truth.canon.status, 'decision_required');
  assert.equal(truth.canon.selectedPilot, null);
  assert.equal(truth.evidence.currentCoveragePercent, null);
  assert.equal(truth.evidence.percentageClaimAllowed, false);
  assert.equal(truth.productArchitecture.currentMain.type, 'audit_dashboard_shell');
  assert.equal(truth.productArchitecture.productionFoundation.branch, 'archive/legacy-comic-2026-07-10');
});

test('exactly two unselected pilot candidates are recorded', async () => {
  const candidates = await json('project/canon-candidates.json');
  assert.equal(candidates.status, 'human_decision_required');
  assert.equal(candidates.selectedCandidateId, null);
  assert.deepEqual(candidates.candidates.map((item) => item.title), ['Das Zimmer', 'Der Solidarpreis']);
  assert.ok(candidates.candidates.every((item) => item.status === 'candidate_not_selected'));
});

test('old closure is a bounded snapshot, not current truth', async () => {
  const closure = await json('project/evidence-closure.json');
  assert.equal(closure.status, 'historical_bounded_snapshot');
  assert.equal(closure.authorityStatus, 'superseded_as_current_truth');
  assert.equal(closure.currentCompletenessClaimAllowed, false);
  assert.equal(closure.snapshotThroughPullRequest, 30);
  assert.equal(closure.truthAuditCorrection.currentEvidenceCoveragePercent, null);
  assert.equal(closure.classifications['CLAIM-016-complete-historical-pr-backfill'], 'disproven');
});

test('public files show line reset and do not claim current completeness', async () => {
  const [readme, index, app, audit] = await Promise.all(['README.md','index.html','app.js','audit-ui.js'].map(read));
  for (const content of [readme, index, app, audit]) assert.match(content, /LINE RESET|Line Reset|Line-Reset|Line Reset/i);
  assert.match(readme, /Pilot-Canon:\s+DECISION_REQUIRED/);
  assert.match(index, /Canon bewusst offen/);
  assert.match(app, /EVIDENCE', 'PARTIELL/);
  assert.match(audit, /HISTORISCHER SNAPSHOT/);
  assert.doesNotMatch(index, /Beweiskettenabdeckung:\s*100/);
  assert.doesNotMatch(app, /BEWEISKETTE 100% GESCHLOSSEN/);
});

test('recovery docs require atomic rescue and reject Growth OS', async () => {
  const [audit, recovery, readme] = await Promise.all(['docs/TRUTH_AUDIT_2026-07-11.md','docs/PRODUCTION_APP_RECOVERY_PLAN.md','README.md'].map(read));
  assert.match(audit, /3979c65c4cc15f4ed4b7c72c92f559ace1c747ac/);
  assert.match(recovery, /ohne den Archivbranch blind auf `main` zu kippen/i);
  assert.match(recovery, /Ricco Studio[\s\S]*Restore/);
  assert.match(readme, /kein Growth OS/i);
});
