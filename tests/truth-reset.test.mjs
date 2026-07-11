import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('truth state records closed LR4 and active LR5 without percentage', async () => {
  const truth = await json('project/truth-state.json');
  assert.equal(truth.repository, 'Pagebabe/comic');
  assert.equal(truth.status, 'recovery_line_active');
  assert.equal(truth.authority, 'current_project_truth');
  assert.equal(truth.trackingIssue, 82);
  assert.equal(truth.canon.status, 'pilot_selected_human_confirmed');
  assert.equal(truth.canon.selectedPilot, 'pilot-das-zimmer');
  assert.equal(truth.canon.selectedTitle, 'Das Zimmer');
  assert.equal(truth.evidence.currentCoveragePercent, null);
  assert.equal(truth.evidence.percentageClaimAllowed, false);
  assert.equal(truth.productArchitecture.currentMain.type, 'audit_dashboard_with_verified_studio_neutral_loop_and_selected_pilot_transport');
  assert.equal(truth.productArchitecture.productionFoundation.status, 'neutral_foundation_loop_and_selected_pilot_transport_publicly_verified');
  for (const gate of ['LR0','LR1','LR2','LR3','LR4']) assert.equal(truth.nextSequence.find((item) => item.id === gate).status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR4').proof, 'project/lr4-selected-pilot-closure.json');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR4').trackingIssue, 76);
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR5').status, 'active_recovery_gate');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR5').trackingIssue, 82);
});

test('LR0 and LR1 closure records remain preserved', async () => {
  const [lr0, decision] = await Promise.all([json('project/line-reset-closure.json'),json('project/pilot-decision-record.json')]);
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

test('LR2 closure remains a bounded public foundation proof', async () => {
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

test('LR3 closure binds PR CI merge Pages hashes and historical LR4 handoff', async () => {
  const closure = await json('project/lr3-production-loop-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.implementedBy.pullRequest, 74);
  assert.equal(closure.implementedBy.ciRun, 29150833651);
  assert.equal(closure.implementedBy.mergeCommit, '0226b80ae36457c95efb2e4dbbb0546623d274ae');
  assert.equal(closure.publicProof.pagesRun, 29150875221);
  assert.equal(closure.publicProof.publicVerificationPassed, true);
  assert.equal(closure.proof.stationsPassed, 9);
  assert.equal(closure.proof.deleteCountercheckPassed, true);
  assert.equal(closure.proof.deleteRestoreHashMatch, true);
  assert.equal(closure.proof.stateHash, '39266debc49b4374be25bad2d58747b240492630486c18828694737df198cc70');
  assert.equal(closure.proof.packageHash, '011e7c0f60c5523ebc21c8b589af9adb5bfee8615b14ef5baef933d266ee9a9e');
  assert.equal(closure.proof.imageBytesUsed, false);
  assert.equal(closure.proof.externalExecutionUsed, false);
  assert.equal(closure.proof.creativeApprovalGranted, false);
  assert.equal(closure.nextGate.id, 'LR4');
  assert.equal(closure.nextGate.trackingIssue, 76);
});

test('LR4 closure binds exact implementation and public proof while preserving open master gates', async () => {
  const closure = await json('project/lr4-selected-pilot-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.implementedBy.pullRequest, 81);
  assert.equal(closure.implementedBy.verifiedHead, 'a55a24e24bdae0bbf2b980f2842f57f0653092ca');
  assert.equal(closure.implementedBy.ciRun, 29152706460);
  assert.equal(closure.implementedBy.mergeCommit, '63021f49152dee7375578537be13dafd65685391');
  assert.equal(closure.publicProof.pagesRun, 29152807415);
  assert.equal(closure.publicProof.publicVerificationPassed, true);
  assert.equal(closure.proof.stationsPassed, 9);
  assert.equal(closure.proof.panelCount, 8);
  assert.equal(closure.proof.dialogueCueCount, 10);
  assert.equal(closure.proof.candidateDurationSeconds, 45.5);
  assert.equal(closure.proof.stateActuallyDeleted, true);
  assert.equal(closure.proof.packageRetainedDuringDeletion, true);
  assert.equal(closure.proof.deleteRestoreHashMatch, true);
  assert.equal(closure.proof.stateHash, '97b8216fbb11059a5f8fa0e3748ea8fa1e03706e15174c307ffe9ce84ca8c2cf');
  assert.equal(closure.proof.packageHash, 'b6d2c8814dfc5cc558c5d7dd81113e71eafc51f531515fd7b4e9e8ec5a2ad196');
  assert.equal(closure.proof.imageBytesUsed, false);
  assert.equal(closure.proof.externalExecutionUsed, false);
  assert.equal(closure.proof.creativeApprovalGranted, false);
  assert.equal(closure.nextGate.id, 'LR5');
  assert.equal(closure.nextGate.trackingIssue, 82);
  assert.ok(closure.closureBoundary.notProven.includes('character or location visual masters'));
  assert.ok(closure.closureBoundary.notProven.includes('approved voices'));
  assert.ok(closure.closureBoundary.notProven.includes('a finished episode'));
});

test('old evidence closure remains a bounded snapshot', async () => {
  const closure = await json('project/evidence-closure.json');
  assert.equal(closure.status, 'historical_bounded_snapshot');
  assert.equal(closure.authorityStatus, 'superseded_as_current_truth');
  assert.equal(closure.currentCompletenessClaimAllowed, false);
  assert.equal(closure.snapshotThroughPullRequest, 30);
  assert.equal(closure.classifications['CLAIM-016-complete-historical-pr-backfill'], 'disproven');
});

test('public files show closed LR4 and active LR5 while keeping asset gates open', async () => {
  const [readme, phaseUi, audit, context, closure] = await Promise.all(['README.md','lr1-ui.js','audit-ui.js','lib/context.mjs','project/lr4-selected-pilot-closure.json'].map(read));
  assert.match(readme, /LR4 Das-Zimmer-Fire-Test:\s+geschlossen/);
  assert.match(readme, /aktives Gate:\s+LR5 VISUAL-, SET- UND VOICE-LOCKS/);
  assert.match(readme, /Issue #82/);
  assert.match(phaseUi, /LR4 PILOT FIRE TEST/);
  assert.match(phaseUi, /LR5/);
  assert.match(phaseUi, /Issue #82/);
  assert.match(phaseUi, /lr4-selected-pilot-closure\.json/);
  assert.match(context, /LR5/i);
  assert.match(context, /Issue #82/);
  assert.match(audit, /HISTORISCHER SNAPSHOT/);
  assert.match(audit, /PARTIELL/);
  assert.match(audit, /keine Prozentzahl/);
  assert.match(closure, /63021f49152dee7375578537be13dafd65685391/);
  assert.doesNotMatch(phaseUi, /BEWEISKETTE 100% GESCHLOSSEN/);
  assert.doesNotMatch(readme, /fertige Episode:\s+ja/i);
});

test('recovery sequence remains LR0 through LR6 and rejects Growth OS', async () => {
  const [recovery, readme] = await Promise.all([read('docs/PRODUCTION_APP_RECOVERY_PLAN.md'),read('README.md')]);
  for (const marker of ['LR0','LR1','LR2','LR3','LR4','LR5','LR6']) assert.match(recovery, new RegExp(marker));
  assert.match(recovery, /Control[\s\S]*Studio[\s\S]*Prompt Queue[\s\S]*Restore/);
  assert.match(readme, /kein Growth OS/i);
});
