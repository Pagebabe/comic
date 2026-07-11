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

function mutable(value) {
  return JSON.parse(JSON.stringify(value));
}

test('runtime input normalization preserves safe connector contracts', () => {
  const input = validateRuntimeInput(buildRuntimeFixture());
  assert.equal(input.providerManifests[0].schemaVersion, 1);
  assert.ok(input.providerManifests[0].displayName.includes('Sandbox'));
  assert.ok(input.providerManifests[0].adapterClass);
  assert.equal(input.providerManifests[0].secretRequirements[0].name.includes('SECRET') || input.providerManifests[0].secretRequirements[0].name.includes('CLIENT'), true);
});

test('identical happy-path fixtures produce identical evidence bundles', () => {
  const first = runIntegratedShadowRuntime(buildRuntimeFixture());
  const second = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.deepEqual(first, second);
  assert.equal(compareRuntimeBundles(first, second).deterministic, true);
});

test('happy path completes the integrated shadow loop', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.equal(bundle.finalState.status, 'COMPLETED');
  assert.equal(bundle.finalState.variantCount, 3);
  assert.equal(bundle.finalState.connectorPlanCount, 3);
  assert.equal(bundle.finalState.simulationCount, 3);
  assert.equal(bundle.finalState.signalBriefCreated, true);
  assert.equal(bundle.finalState.cockpitGenerated, true);
  assert.equal(bundle.finalState.externalActionsExecuted, false);
});

test('runtime journal is append-only, sequential and hash valid', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.equal(verifyRuntimeJournal(bundle.journal), true);
  assert.deepEqual(bundle.journal.map((entry) => entry.sequence), bundle.journal.map((_, index) => index + 1));
  assert.equal(new Set(bundle.journal.map((entry) => entry.eventId)).size, bundle.journal.length);
  assert.equal(bundle.journal[0].causationId, null);
  assert.equal(bundle.journal[1].causationId, bundle.journal[0].eventId);
});

test('journal replay reproduces the original final state and hashes', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const replay = replayRuntimeEvidence(bundle);
  assert.equal(replay.status, 'REPLAY_MATCHED');
  assert.equal(replay.replayMatched, true);
  assert.equal(replay.replayFinalStateHash, bundle.finalStateHash);
  assert.equal(replay.replayJournalHash, bundle.journalHash);
  assert.deepEqual(replay.finalState, bundle.finalState);
});

test('journal manipulation is detected and quarantined', () => {
  const tampered = mutable(runIntegratedShadowRuntime(buildRuntimeFixture()));
  tampered.journal[2].data.workflowTaskCount = 9999;
  assert.equal(verifyRuntimeJournal(tampered.journal), false);
  const replay = replayRuntimeEvidence(tampered);
  assert.equal(replay.status, 'QUARANTINED');
  assert.equal(replay.reason, 'JOURNAL_INTEGRITY_FAILURE');
});

test('checkpoint manipulation is detected and quarantined', () => {
  const tampered = mutable(runIntegratedShadowRuntime(buildRuntimeFixture()));
  tampered.checkpoints[0].projectedStateHash = 'f'.repeat(64);
  assert.equal(verifyRuntimeCheckpoint(tampered.checkpoints[0], tampered.journal), false);
  const replay = replayRuntimeEvidence(tampered);
  assert.equal(replay.status, 'QUARANTINED');
  assert.equal(replay.reason, 'CHECKPOINT_INTEGRITY_FAILURE');
});

test('rule-version drift prevents replay', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const replay = replayRuntimeEvidence(bundle, 'mkt0-010.v1');
  assert.equal(replay.status, 'QUARANTINED');
  assert.equal(replay.reason, 'RULE_VERSION_MISMATCH');
});

test('rate-limit scenario completes with deterministic backoff', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('RATE_LIMIT'));
  assert.equal(bundle.finalState.status, 'COMPLETED_WITH_BACKOFF');
  assert.equal(bundle.finalState.backoffCount, 1);
  assert.equal(bundle.finalState.simulationCount, 2);
  assert.equal(replayRuntimeEvidence(bundle).replayMatched, true);
});

test('auth-blocked scenario reaches a blocked terminal state', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('AUTH_BLOCKED'));
  assert.equal(bundle.finalState.status, 'BLOCKED_AUTH');
  assert.equal(bundle.finalState.authBlockedCount, 1);
  assert.equal(bundle.finalState.cockpitGenerated, false);
  assert.equal(bundle.externalActions.networkUsed, false);
});

test('webhook replay scenario is quarantined', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('WEBHOOK_REPLAY'));
  assert.equal(bundle.finalState.status, 'QUARANTINED');
  assert.equal(bundle.finalState.webhookReplayDetected, true);
  assert.ok(bundle.finalState.blockReasons.includes('WEBHOOK_REPLAY_DETECTED'));
  assert.equal(bundle.finalState.cockpitGenerated, false);
});

test('incident-lockdown scenario stops before connector planning', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture('INCIDENT_LOCKDOWN'));
  assert.equal(bundle.finalState.status, 'BLOCKED_INCIDENT');
  assert.equal(bundle.finalState.operationsMode, 'INCIDENT_LOCKDOWN');
  assert.equal(bundle.finalState.connectorPlanCount, 0);
  assert.equal(bundle.connectorSummary, null);
});

test('global kill switch stops the integrated run before connectors', () => {
  const fixture = buildRuntimeFixture('HAPPY_PATH', {
    operationsConfig: { ...runtimeOperationsConfig, globalKillSwitch: true }
  });
  const bundle = runIntegratedShadowRuntime(fixture);
  assert.equal(bundle.finalState.operationsMode, 'PAUSED');
  assert.equal(bundle.finalState.connectorPlanCount, 0);
  assert.equal(bundle.finalState.simulationCount, 0);
});

test('resume planning remains human-approved and non-executable', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const resume = planResumeFromCheckpoint(bundle, 'AFTER_OPERATIONS_GATE');
  assert.equal(resume.state, 'RESUME_PLANNED_SHADOW');
  assert.equal(resume.executionAllowed, false);
  assert.equal(resume.networkAllowed, false);
  assert.equal(resume.liveActionsAllowed, false);
  assert.equal(resume.humanApprovalRequired, true);
});

test('unknown checkpoint cannot be resumed', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.throws(() => planResumeFromCheckpoint(bundle, 'DOES_NOT_EXIST'), /Checkpoint not found/);
});

test('runtime evidence contains no forbidden credentials or network urls', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  assert.equal(runtimeEvidenceContainsForbiddenMaterial(bundle), false);
  assert.equal(JSON.stringify(bundle).includes('Bearer '), false);
  assert.equal(JSON.stringify(bundle).includes('https://'), false);
});

test('runtime rejects explicit credential values', () => {
  const fixture = buildRuntimeFixture('HAPPY_PATH', { accessToken: 'forbidden' });
  assert.throws(() => runIntegratedShadowRuntime(fixture), /Credential value is forbidden/);
});

test('runtime evidence exposes only sandbox account aliases', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  for (const provider of bundle.inputSummary.providers) assert.match(provider.accountAlias, /^sandbox_/);
  assert.equal(bundle.externalActions.oauthConnected, false);
  assert.equal(bundle.externalActions.livePublishing, false);
});

test('different scenarios produce different evidence hashes', () => {
  const happy = runIntegratedShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));
  const rateLimited = runIntegratedShadowRuntime(buildRuntimeFixture('RATE_LIMIT'));
  assert.notEqual(happy.inputHash, rateLimited.inputHash);
  assert.notEqual(happy.journalHash, rateLimited.journalHash);
  assert.notEqual(happy.finalStateHash, rateLimited.finalStateHash);
});

test('runtime portfolio readiness never claims live readiness', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const readiness = buildRuntimePortfolioReadiness(bundle, runtimeProviderManifests);
  assert.equal(readiness.journalValid, true);
  assert.equal(readiness.replayMatched, true);
  assert.equal(readiness.connectorPortfolio.summary.liveReady, 0);
  assert.equal(readiness.readyForLive, false);
  assert.equal(readiness.readyForAuthorizedSandboxRuntime, false);
});

test('projected state is derived from journal rather than mutable bundle fields', () => {
  const bundle = runIntegratedShadowRuntime(buildRuntimeFixture());
  const clone = mutable(bundle);
  clone.finalState.status = 'FAKE_SUCCESS';
  assert.equal(projectRuntimeState(clone.journal).status, 'COMPLETED');
  assert.equal(replayRuntimeEvidence(clone).status, 'QUARANTINED');
  assert.equal(replayRuntimeEvidence(clone).reason, 'REPLAY_HASH_MISMATCH');
});

test('manual journal appends keep trace and causation continuity', () => {
  let journal = [];
  journal = appendRuntimeEvent(journal, {
    eventId: 'evt_manual_1', traceId: 'trace_manual', correlationId: 'corr_manual', module: 'runtime', type: 'RUN_STARTED',
    occurredAt: '2026-07-11T12:00:00.000Z', data: { scenario: 'HAPPY_PATH' }
  });
  journal = appendRuntimeEvent(journal, {
    eventId: 'evt_manual_2', traceId: 'trace_manual', correlationId: 'corr_manual', module: 'runtime', type: 'RUN_COMPLETED',
    occurredAt: '2026-07-11T12:00:01.000Z', data: { status: 'COMPLETED' }
  });
  assert.equal(verifyRuntimeJournal(journal), true);
  assert.equal(journal[1].causationId, 'evt_manual_1');
  assert.equal(createRuntimeCheckpoint(journal, 'MANUAL').sequence, 2);
});
