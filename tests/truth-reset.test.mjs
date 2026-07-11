import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('truth state records closed LR2 and active LR3 without percentage', async () => {
  const truth = await json('project/truth-state.json');
  assert.equal(truth.repository, 'Pagebabe/comic');
  assert.equal(truth.status, 'recovery_line_active');
  assert.equal(truth.authority, 'current_project_truth');
  assert.equal(truth.trackingIssue, 60);
  assert.equal(truth.canon.status, 'pilot_selected_human_confirmed');
  assert.equal(truth.canon.selectedPilot, 'pilot-das-zimmer');
  assert.equal(truth.canon.selectedTitle, 'Das Zimmer');
  assert.equal(truth.evidence.currentCoveragePercent, null);
  assert.equal(truth.evidence.percentageClaimAllowed, false);
  assert.equal(truth.productArchitecture.currentMain.type, 'audit_dashboard_with_verified_studio_foundation');
  assert.equal(truth.productArchitecture.productionFoundation.status, 'neutral_foundation_publicly_verified_production_loop_pending');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR0').status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR1').status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR2').status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR2').proof, 'project/studio-foundation-closure.json');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR3').status, 'active_recovery_gate');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR3').trackingIssue, 60);
});

test('LR0 and LR1 closure records remain preserved', async () => {
  const [lr0, decision] = await Promise.all([
    json('project/line-reset-closure.json'),
    json('project/pilot-decision-record.json')
  ]);
  assert.equal(lr0.status, 'closed_verified');
  assert.equal(lr0.pullRequest, 37);
  assert.equal(lr0.mergeCommit, '47b513c31d5326efdf5bd8c81e835233f97b6b47');
  assert.equal(decision.status, 'human_decision_recorded');
  assert.equal(decision.selectedCandidateId, 'pilot-das-zimmer');
  assert.equal(decision.sourceRecord.userConfirmation, 'ok');
});

test('candidate register still contains selected and archived candidates', async () => {
  const candidates = await json('project/canon-candidates.json');
  assert.equal(candidates.status, 'human_decision_recorded');
  assert.equal(candidates.selectedCandidateId, 'pilot-das-zimmer');
  assert.equal(candidates.candidates.find((item) => item.id === 'pilot-das-zimmer').status, 'selected_human_confirmed');
  assert.equal(candidates.candidates.find((item) => item.id === 'pilot-der-solidarpreis').status, 'archived_not_selected');
});

test('LR2 closure proves public foundation without claiming production loop', async () => {
  const closure = await json('project/studio-foundation-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.pullRequest.number, 59);
  assert.equal(closure.pullRequest.ciRun, 29148650720);
  assert.equal(closure.pullRequest.mergeCommit, '18d0c34b81db781305941c0e9f34c308ac5c8b76');
  assert.equal(closure.deployment.runId, 29148728164);
  assert.equal(closure.deployment.publicVerificationPassed, true);
  assert.equal(closure.nextGate.id, 'LR3');
  assert.equal(closure.nextGate.trackingIssue, 60);
  assert.ok(closure.notProven.includes('Package Export and Restore'));
  assert.ok(closure.notProven.includes('a finished episode'));
});

test('old evidence closure remains a bounded snapshot', async () => {
  const closure = await json('project/evidence-closure.json');
  assert.equal(closure.status, 'historical_bounded_snapshot');
  assert.equal(closure.authorityStatus, 'superseded_as_current_truth');
  assert.equal(closure.currentCompletenessClaimAllowed, false);
  assert.equal(closure.snapshotThroughPullRequest, 30);
  assert.equal(closure.classifications['CLAIM-016-complete-historical-pr-backfill'], 'disproven');
});

test('public files show verified LR2 and active LR3 while keeping asset gates open', async () => {
  const [readme, phaseUi, audit, context, closure] = await Promise.all([
    'README.md',
    'lr1-ui.js',
    'audit-ui.js',
    'lib/context.mjs',
    'project/studio-foundation-closure.json'
  ].map(read));
  assert.match(readme, /LR2 Studio Foundation:\s+geschlossen/);
  assert.match(readme, /aktives Gate:\s+LR3 PRODUKTIONSLOOP/);
  assert.match(readme, /Issue #60/);
  assert.match(phaseUi, /LR3 PRODUKTIONSLOOP/);
  assert.match(phaseUi, /LR2 FOUNDATION/);
  assert.match(phaseUi, /Issue #60/);
  assert.match(phaseUi, /studio-foundation-closure\.json/);
  assert.match(context, /aktives Gate: LR3 minimalen Produktionsloop retten/);
  assert.match(context, /Pages 29148728164/);
  assert.match(audit, /HISTORISCHER SNAPSHOT/);
  assert.match(closure, /18d0c34b81db781305941c0e9f34c308ac5c8b76/);
  assert.doesNotMatch(phaseUi, /BEWEISKETTE 100% GESCHLOSSEN/);
  assert.doesNotMatch(readme, /fertige Episode:\s+ja/i);
});

test('recovery sequence remains LR0 through LR6 and rejects Growth OS', async () => {
  const [recovery, readme] = await Promise.all([
    read('docs/PRODUCTION_APP_RECOVERY_PLAN.md'),
    read('README.md')
  ]);
  for (const marker of ['LR0','LR1','LR2','LR3','LR4','LR5','LR6']) assert.match(recovery, new RegExp(marker));
  assert.match(recovery, /Control[\s\S]*Studio[\s\S]*Prompt Queue[\s\S]*Restore/);
  assert.match(readme, /kein Growth OS/i);
});
