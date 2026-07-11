import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendRuntimeEvent,
  buildRuntimePortfolioReadiness,
  compareRuntimeBundles,
  createRuntimeCheckpoint,
  planResumeFromCheckpoint,
  projectRuntimeState,
  replayRuntimeEvidence,
  runIntegratedShadowRuntime,
  runtimeEvidenceContainsForbiddenMaterial,
  validateRuntimeInput,
  verifyRuntimeCheckpoint,
  verifyRuntimeJournal
} from '../growth-os/runtime.mjs';
import { buildRuntimeFixture, runtimeOperationsConfig, runtimeProviderManifests } from '../growth-os/runtime-fixture.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));

test('runtime input preserves complete safe connector contracts', () => {
  const input = validateRuntimeInput(buildRuntimeFixture());
  assert.equal(input.providerManifests.length, 3);
  assert.equal(input.providerManifests[0].schemaVersion, 1);
  assert.ok(input.providerManifests[0].displayName.includes('Sandbox'));
  assert.ok(input.providerManifests[0].adapterClass);
  assert.ok(input.providerManifests[0].secretRequirements.every((item) => item.name && item.status));
});

test('identical fixtures produce identical base evidence bundles', () => {
  const first = runIntegratedShadowRuntime(buildRuntimeFixture());
  const second = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.deepEqual(first, second);
  assert.equal(compareRuntimeBundles(first, second).deterministic, true);
});

test('happy path completes all base runtime stages', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.equal(bundle.finalState.status, 'COMPLETED');
  assert.equal(bundle.finalState.variantCount, 3);
  assert.equal(bundle.finalState.domainEventCount, 9);
  assert.equal(bundle.finalState.connectorPlanCount, 3);
  assert.equal(bundle.finalState.simulationCount, 3);
  assert.equal(bundle.finalState.signalBriefCreated, true);
  assert.equal(bundle.finalState.cockpitGenerated, true);
  assert.equal(bundle.finalState.externalActionsExecuted, false);
});

test('journal is sequential, unique and hash valid', () => {
  const journal = runIntegratedShadowRuntime(buildRuntimeFixture()).journal;
  assert.equal(verifyRuntimeJournal(journal), true);
  assert.deepEqual(journal.map((entry) => entry.sequence), journal.map((_, index) => index + 1));
  assert.equal(new Set(journal.map((entry) => entry.eventId)).size, journal.length);
  assert.equal(journal[0].causationId, null);
  assert.equal(journal[1].causationId, journal[0].eventId);
});

test('journal replay reproduces original state and hashes', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const replay = replayRuntimeEvidence(bundle);
  assert.equal(replay.status, 'REPLAY_MATCHED');
  assert.equal(replay.replayMatched, true);
  assert.equal(replay.replayFinalStateHash, bundle.finalStateHash);
  assert.equal(replay.replayJournalHash, bundle.journalHash);
});

test('journal manipulation is quarantined', () => {
  const tampered = clone(runIntegratedShadowRuntime(buildRuntimeFixture()));
  tampered.journal[2].data.workflowTaskCount = 9999;
  assert.equal(verifyRuntimeJournal(tampered.journal), false);
  assert.equal(replayRuntimeEvidence(tampered).reason, 'JOURNAL_INTEGRITY_FAILURE');
});

test('checkpoint manipulation is quarantined', () => {
  const tampered = clone(runIntegratedShadowRuntime(buildRuntimeFixture()));
  tampered.checkpoints[0].projectedStateHash = 'f'.repeat(64);
  assert.equal(verifyRuntimeCheckpoint(tampered.checkpoints[0], tampered.journal), false);
  assert.equal(replayRuntimeEvidence(tampered).reason, 'CHECKPOINT_INTEGRITY_FAILURE');
});

test('rule-version drift prevents replay', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.equal(replayRuntimeEvidence(bundle, 'mkt0-010.v1').reason, 'RULE_VERSION_MISMATCH');
});

test('rate-limit scenario completes with one backoff', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('RATE_LIMIT'));
  assert.equal(bundle.finalState.status, 'COMPLETED_WITH_BACKOFF');
  assert.equal(bundle.finalState.backoffCount, 1);
  assert.equal(bundle.finalState.simulationCount, 2);
  assert.equal(replayRuntimeEvidence(bundle).replayMatched, true);
});

test('auth-blocked scenario reaches a blocked state', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('AUTH_BLOCKED'));
  assert.equal(bundle.finalState.status, 'BLOCKED_AUTH');
  assert.equal(bundle.finalState.authBlockedCount, 1);
  assert.equal(bundle.finalState.cockpitGenerated, false);
});

test('webhook replay is quarantined', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('WEBHOOK_REPLAY'));
  assert.equal(bundle.finalState.status, 'QUARANTINED');
  assert.equal(bundle.finalState.webhookReplayDetected, true);
  assert.ok(bundle.finalState.blockReasons.includes('WEBHOOK_REPLAY_DETECTED'));
});

test('incident lockdown stops before connector planning', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('INCIDENT_LOCKDOWN'));
  assert.equal(bundle.finalState.status, 'BLOCKED_INCIDENT');
  assert.equal(bundle.finalState.operationsMode, 'INCIDENT_LOCKDOWN');
  assert.equal(bundle.finalState.connectorPlanCount, 0);
  assert.equal(bundle.connectorSummary, null);
});

test('global kill switch stops before connector planning', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('HAPPY_PATH', {
    operationsConfig: { ...runtimeOperationsConfig, globalKillSwitch: true }
  }));
  assert.equal(bundle.finalState.operationsMode, 'PAUSED');
  assert.equal(bundle.finalState.connectorPlanCount, 0);
  assert.equal(bundle.finalState.simulationCount, 0);
});

test('resume planning remains non-executable and human-gated', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const resume = planResumeFromCheckpoint(bundle, 'AFTER_OPERATIONS_GATE');
  assert.equal(resume.state, 'RESUME_PLANNED_SHADOW');
  assert.equal(resume.executionAllowed, false);
  assert.equal(resume.networkAllowed, false);
  assert.equal(resume.liveActionsAllowed, false);
  assert.equal(resume.humanApprovalRequired, true);
});

test('unknown checkpoints cannot be resumed', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.throws(() => planResumeFromCheckpoint(bundle, 'DOES_NOT_EXIST'), /Checkpoint not found/);
});

test('runtime evidence contains no credentials or network URLs', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.equal(runtimeEvidenceContainsForbiddenMaterial(bundle), false);
  assert.equal(JSON.stringify(bundle).includes('Bearer '), false);
  assert.equal(JSON.stringify(bundle).includes('https://'), false);
});

test('explicit credential values are rejected', () => {
  assert.throws(() => runIntegratedShadowRuntime(buildRuntimeFixture('HAPPY_PATH', { accessToken: 'forbidden' })), /Credential value is forbidden/);
});

test('only sandbox account aliases enter evidence', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  for (const provider of bundle.inputSummary.providers) assert.match(provider.accountAlias, /^sandbox_/);
  assert.equal(bundle.externalActions.oauthConnected, false);
  assert.equal(bundle.externalActions.livePublishing, false);
});

test('different scenarios produce different hashes', () => {
  const happy = runIntegratedShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));
  const limited = runIntegratedShadowRuntime(buildRuntimeFixture('RATE_LIMIT'));
  assert.notEqual(happy.inputHash, limited.inputHash);
  assert.notEqual(happy.journalHash, limited.journalHash);
  assert.notEqual(happy.finalStateHash, limited.finalStateHash);
});

test('portfolio readiness never claims live readiness', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const readiness = buildRuntimePortfolioReadiness(bundle, runtimeProviderManifests);
  assert.equal(readiness.journalValid, true);
  assert.equal(readiness.replayMatched, true);
  assert.equal(readiness.connectorPortfolio.summary.liveReady, 0);
  assert.equal(readiness.readyForLive, false);
});

test('journal remains the base replay source of truth', () => {
  const bundle = clone(runIntegratedShadowRuntime(buildRuntimeFixture()));
  bundle.finalState.status = 'FAKE_SUCCESS';
  assert.equal(projectRuntimeState(bundle.journal).status, 'COMPLETED');
  assert.equal(replayRuntimeEvidence(bundle).status, 'REPLAY_MATCHED');
});

test('manual appends preserve trace and causation continuity', () => {
  let journal = [];
  journal = appendRuntimeEvent(journal, { eventId: 'evt_manual_1', traceId: 'trace_manual', correlationId: 'corr_manual', module: 'runtime', type: 'RUN_STARTED', occurredAt: '2026-07-11T12:00:00.000Z', data: { scenario: 'HAPPY_PATH' } });
  journal = appendRuntimeEvent(journal, { eventId: 'evt_manual_2', traceId: 'trace_manual', correlationId: 'corr_manual', module: 'runtime', type: 'RUN_COMPLETED', occurredAt: '2026-07-11T12:00:01.000Z', data: { status: 'COMPLETED' } });
  assert.equal(verifyRuntimeJournal(journal), true);
  assert.equal(journal[1].causationId, 'evt_manual_1');
  assert.equal(createRuntimeCheckpoint(journal, 'MANUAL').sequence, 2);
});
