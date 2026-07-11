import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GrowthValidationError,
  analyzeGrowth,
  appendAuditEvent,
  createPublishJob,
  evaluatePolicy,
  planSocialVariants,
  runShadowPipeline,
  transitionPublishJob,
  validateEpisodePackage,
  verifyAuditChain
} from '../growth-os/core.mjs';
import {
  FIXED_TIMESTAMP,
  syntheticBaseline,
  syntheticEpisodePackage,
  syntheticMetrics
} from '../growth-os/fixture.mjs';

test('EpisodePackage validation is strict and preserves shadow provenance', () => {
  const validated = validateEpisodePackage(syntheticEpisodePackage);
  assert.equal(validated.source.synthetic, true);
  assert.equal(validated.approval.status, 'APPROVED_FOR_SHADOW_DEMO');
  assert.throws(
    () => validateEpisodePackage({ ...syntheticEpisodePackage, title: '' }),
    GrowthValidationError
  );
  assert.throws(
    () => validateEpisodePackage({
      ...syntheticEpisodePackage,
      approval: { ...syntheticEpisodePackage.approval, status: 'PRODUCTION_APPROVED' }
    }),
    /Approval status does not match source kind/
  );
});

test('social variant planning is deterministic and platform bounded', () => {
  const first = planSocialVariants(syntheticEpisodePackage);
  const second = planSocialVariants(syntheticEpisodePackage);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((item) => item.platform), ['instagram_reels', 'tiktok', 'youtube_shorts']);
  assert.ok(first.every((item) => item.mode === 'shadow'));
  assert.ok(first.every((item) => item.aspectRatio === '9:16'));
});

test('policy engine denies every live action', () => {
  const [variant] = planSocialVariants(syntheticEpisodePackage, ['tiktok']);
  const decision = evaluatePolicy({
    episodePackage: syntheticEpisodePackage,
    variant,
    requestedAction: 'live_publish'
  });
  assert.equal(decision.decision, 'DENY');
  assert.deepEqual(decision.reasons, ['MKT0_LIVE_ACTIONS_DISABLED']);
});

test('publish state machine rejects skipped gates', () => {
  const [variant] = planSocialVariants(syntheticEpisodePackage, ['tiktok']);
  const job = createPublishJob(variant, FIXED_TIMESTAMP);
  assert.throws(
    () => transitionPublishJob(job, 'SIMULATED', FIXED_TIMESTAMP, 'SKIP'),
    /Invalid publish job transition/
  );
  const checked = transitionPublishJob(job, 'POLICY_CHECK', FIXED_TIMESTAMP, 'CHECK');
  const approved = transitionPublishJob(checked, 'APPROVED_SHADOW', FIXED_TIMESTAMP, 'ALLOW');
  const simulated = transitionPublishJob(approved, 'SIMULATED', FIXED_TIMESTAMP, 'DONE');
  assert.equal(simulated.state, 'SIMULATED');
  assert.equal(simulated.history.length, 4);
});

test('audit chain detects tampering', () => {
  let chain = [];
  chain = appendAuditEvent(chain, {
    timestamp: FIXED_TIMESTAMP,
    type: 'TEST_STARTED',
    actor: 'test',
    data: { value: 1 }
  });
  chain = appendAuditEvent(chain, {
    timestamp: FIXED_TIMESTAMP,
    type: 'TEST_FINISHED',
    actor: 'test',
    data: { value: 2 }
  });
  assert.equal(verifyAuditChain(chain), true);
  const tampered = chain.map((entry, index) => index === 0 ? { ...entry, data: { value: 999 } } : entry);
  assert.equal(verifyAuditChain(tampered), false);
});

test('growth analysis normalizes against baseline and creates actions', () => {
  const analysis = analyzeGrowth(syntheticMetrics, syntheticBaseline, { durationSeconds: 24 });
  assert.ok(analysis.score > 120);
  assert.ok(['WINNER', 'OUTLIER'].includes(analysis.classification));
  assert.ok(analysis.recommendedActions.includes('CREATE_FOLLOW_UP'));
  assert.ok(analysis.indices.shareRate > 100);
});

test('offline pipeline is deterministic, audited and never executes live actions', () => {
  const input = {
    episodePackage: syntheticEpisodePackage,
    metrics: syntheticMetrics,
    baseline: syntheticBaseline,
    timestamp: FIXED_TIMESTAMP
  };
  const first = runShadowPipeline(input);
  const second = runShadowPipeline(input);
  assert.deepEqual(first, second);
  assert.equal(first.auditValid, true);
  assert.equal(first.liveActionsExecuted, false);
  assert.ok(first.jobs.every(({ job }) => job.state === 'SIMULATED'));
  assert.ok(first.audit.length >= 6);
  assert.equal(first.productionBrief.source, 'MKT0_SHADOW_ANALYSIS');
});
