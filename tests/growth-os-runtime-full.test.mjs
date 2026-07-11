import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareFullRuntimeBundles,
  replayFullRuntimeEvidence,
  runFullShadowRuntime,
  verifyBaseAndFullReplay
} from '../growth-os/runtime-full.mjs';
import { buildRuntimeFixture } from '../growth-os/runtime-fixture.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));

test('full runtime deterministically includes robust analytics', () => {
  const first = runFullShadowRuntime(buildRuntimeFixture());
  const second = runFullShadowRuntime(buildRuntimeFixture());
  assert.equal(compareFullRuntimeBundles(first, second).deterministic, true);
  assert.equal(first.finalState.analyticsRadarCompleted, true);
  assert.equal(first.finalState.analyticsStatus, 'ANALYZED');
  assert.ok(['WINNER', 'OUTLIER'].includes(first.finalState.analyticsClassification));
  assert.ok(first.finalState.directionEventCount >= 1);
});

test('full runtime replay matches journal, analytics and final state', () => {
  const bundle = runFullShadowRuntime(buildRuntimeFixture());
  const replay = replayFullRuntimeEvidence(bundle);
  assert.equal(replay.status, 'REPLAY_MATCHED');
  assert.equal(replay.replayMatched, true);
  assert.equal(replay.replayJournalHash, bundle.journalHash);
  assert.equal(replay.replayAnalyticsHash, bundle.analyticsHash);
  assert.equal(replay.replayFinalStateHash, bundle.finalStateHash);
});

test('stored final-state manipulation is quarantined by full replay', () => {
  const bundle = clone(runFullShadowRuntime(buildRuntimeFixture()));
  bundle.finalState.status = 'FAKE_SUCCESS';
  const replay = replayFullRuntimeEvidence(bundle);
  assert.equal(replay.status, 'QUARANTINED');
  assert.equal(replay.reason, 'EVIDENCE_HASH_MISMATCH');
});

test('stored analytics manipulation is quarantined', () => {
  const bundle = clone(runFullShadowRuntime(buildRuntimeFixture()));
  bundle.analytics.score = 999;
  const replay = replayFullRuntimeEvidence(bundle);
  assert.equal(replay.status, 'QUARANTINED');
  assert.equal(replay.reason, 'EVIDENCE_HASH_MISMATCH');
});

test('full runtime journal visibly contains the analytics module', () => {
  const bundle = runFullShadowRuntime(buildRuntimeFixture());
  const analyticsEvents = bundle.journal.filter((entry) => entry.type === 'ANALYTICS_RADAR_COMPLETED');
  assert.equal(analyticsEvents.length, 1);
  assert.equal(analyticsEvents[0].module, 'analytics');
  assert.equal(analyticsEvents[0].data.liveActionsExecuted, false);
});

test('all five runtime scenarios retain robust analytics evidence', () => {
  for (const scenario of ['HAPPY_PATH', 'RATE_LIMIT', 'AUTH_BLOCKED', 'WEBHOOK_REPLAY', 'INCIDENT_LOCKDOWN']) {
    const bundle = runFullShadowRuntime(buildRuntimeFixture(scenario));
    assert.equal(bundle.finalState.analyticsRadarCompleted, true, scenario);
    assert.equal(replayFullRuntimeEvidence(bundle).replayMatched, true, scenario);
    assert.equal(bundle.externalActions.networkUsed, false, scenario);
  }
});

test('base and full replay both match for the canonical fixture', () => {
  const result = verifyBaseAndFullReplay(buildRuntimeFixture());
  assert.equal(result.baseReplayMatched, true);
  assert.equal(result.fullReplayMatched, true);
  assert.equal(result.analyticsRadarCompleted, true);
  assert.equal(result.externalActionsExecuted, false);
});

test('scenario changes remain visible in full bundle hashes', () => {
  const happy = runFullShadowRuntime(buildRuntimeFixture('HAPPY_PATH'));
  const limited = runFullShadowRuntime(buildRuntimeFixture('RATE_LIMIT'));
  assert.notEqual(happy.bundleHash, limited.bundleHash);
  assert.notEqual(happy.finalStateHash, limited.finalStateHash);
});
