import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('truth state records selected pilot and active LR2 without percentage', async () => {
  const truth = await json('project/truth-state.json');
  assert.equal(truth.repository, 'Pagebabe/comic');
  assert.equal(truth.status, 'recovery_line_active');
  assert.equal(truth.authority, 'current_project_truth');
  assert.equal(truth.trackingIssue, 45);
  assert.equal(truth.canon.status, 'pilot_selected_human_confirmed');
  assert.equal(truth.canon.selectedPilot, 'pilot-das-zimmer');
  assert.equal(truth.canon.selectedTitle, 'Das Zimmer');
  assert.equal(truth.evidence.currentCoveragePercent, null);
  assert.equal(truth.evidence.percentageClaimAllowed, false);
  assert.equal(truth.productArchitecture.currentMain.type, 'audit_dashboard_shell');
  assert.equal(truth.productArchitecture.productionFoundation.branch, 'archive/legacy-comic-2026-07-10');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR0').status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR1').status, 'done');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR2').status, 'active_recovery_gate');
  assert.equal(truth.nextSequence.find((item) => item.id === 'LR2').trackingIssue, 45);
});

test('LR0 closure remains preserved', async () => {
  const closure = await json('project/line-reset-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.pullRequest, 37);
  assert.equal(closure.mergeCommit, '47b513c31d5326efdf5bd8c81e835233f97b6b47');
  assert.equal(closure.ci.runId, 29133307545);
  assert.equal(closure.deployment.runId, 29143665894);
  assert.equal(closure.deployment.publicVerificationPassed, true);
});

test('human decision record selects Das Zimmer with narrow scope', async () => {
  const record = await json('project/pilot-decision-record.json');
  assert.equal(record.status, 'human_decision_recorded');
  assert.equal(record.selectedCandidateId, 'pilot-das-zimmer');
  assert.equal(record.selectedTitle, 'Das Zimmer');
  assert.equal(record.decidedBy, 'project_owner_user');
  assert.equal(record.sourceRecord.userConfirmation, 'ok');
  assert.match(record.sourceRecord.assistantRecommendation, /Das Zimmer auswählen/);
  assert.ok(record.selectionScope.approved.includes('pilot identity: Das Zimmer'));
  assert.ok(record.selectionScope.notAutomaticallyApproved.includes('every existing dialogue line'));
  assert.equal(record.unselectedCandidate.candidateId, 'pilot-der-solidarpreis');
  assert.equal(record.unselectedCandidate.status, 'archived_not_selected');
  assert.equal(record.nextGate.trackingIssue, 45);
});

test('candidate register contains one selected and one archived candidate', async () => {
  const candidates = await json('project/canon-candidates.json');
  assert.equal(candidates.status, 'human_decision_recorded');
  assert.equal(candidates.selectedCandidateId, 'pilot-das-zimmer');
  assert.deepEqual(candidates.candidates.map((item) => item.title), ['Das Zimmer', 'Der Solidarpreis']);
  assert.equal(candidates.candidates.find((item) => item.id === 'pilot-das-zimmer').status, 'selected_human_confirmed');
  assert.equal(candidates.candidates.find((item) => item.id === 'pilot-der-solidarpreis').status, 'archived_not_selected');
  assert.equal(candidates.decisionPacket.result.nextGate, 'LR2');
  assert.equal(candidates.decisionPacket.result.trackingIssue, 45);
});

test('decision packet is closed by human selection without approving every derived detail', async () => {
  const packet = await json('project/pilot-decision-packet.json');
  assert.equal(packet.status, 'human_decision_recorded');
  assert.equal(packet.selectedCandidateId, 'pilot-das-zimmer');
  assert.equal(packet.advisoryRecommendation.status, 'accepted_by_explicit_human_decision');
  assert.equal(packet.humanDecision.decidedBy, 'project_owner_user');
  assert.equal(packet.humanDecision.decisionMessage, 'ok');
  assert.match(packet.advisoryRecommendation.boundary, /does not automatically approve/i);
  assert.equal(packet.nextGate.id, 'LR2');
  assert.equal(packet.nextGate.trackingIssue, 45);
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

test('public files show selected pilot and LR2 while keeping asset gates open', async () => {
  const [readme, phaseUi, audit, decisionRecord] = await Promise.all([
    'README.md',
    'lr1-ui.js',
    'audit-ui.js',
    'docs/PILOT_DECISION_RECORD_2026-07-11.md'
  ].map(read));
  assert.match(readme, /LR1 Pilotentscheidung:\s+geschlossen/);
  assert.match(readme, /ausgewählter Pilot:\s+DAS ZIMMER/);
  assert.match(readme, /LR2 STUDIO FOUNDATION/);
  assert.match(readme, /Issue #45/);
  assert.match(phaseUi, /LR2 STUDIO FOUNDATION/);
  assert.match(phaseUi, /Pilot DAS ZIMMER/);
  assert.match(phaseUi, /Issue #45/);
  assert.match(phaseUi, /pilot-decision-record\.json/);
  assert.match(phaseUi, /Das Zimmer ausgewählt · Der Solidarpreis archiviert/);
  assert.match(audit, /HISTORISCHER SNAPSHOT/);
  assert.match(audit, /AUSGEWÄHLT/);
  assert.match(audit, /Pilot · Das Zimmer/);
  assert.match(audit, /human_selected/);
  assert.doesNotMatch(audit, /Keine Auswahl ist autorisiert/);
  assert.doesNotMatch(audit, /decision_required/);
  assert.match(decisionRecord, /HUMAN_DECISION_RECORDED/);
  assert.match(decisionRecord, /Das Zimmer/);
  assert.match(decisionRecord, /genehmigt \*\*nicht automatisch\*\*/);
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
