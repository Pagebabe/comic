import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendStoredEvent,
  appendStoredEvents,
  createDomainEvent,
  projectGrowthState,
  summarizeGrowthState,
  verifyStoredEvents
} from '../growth-os/data.mjs';
import { GrowthValidationError } from '../growth-os/core.mjs';

const scope = Object.freeze({ tenantId: 'tenant_demo', projectId: 'comic_factory' });
const at = '2026-07-11T08:30:00.000Z';
const event = (overrides = {}) => ({
  schemaVersion: 1,
  id: 'evt_campaign_1',
  tenantId: scope.tenantId,
  projectId: scope.projectId,
  stream: 'campaign:campaign_launch',
  sequence: 1,
  type: 'CAMPAIGN_CREATED',
  occurredAt: at,
  actor: 'growth-os-test',
  mode: 'shadow',
  payload: { campaignId: 'campaign_launch', name: 'Launch', status: 'DRAFT' },
  ...overrides
});

const demoEvents = [
  event(),
  event({
    id: 'evt_content_1', stream: 'content:content_1', type: 'CONTENT_REGISTERED',
    payload: { contentId: 'content_1', campaignId: 'campaign_launch', episodePackageId: 'ep_demo', title: 'Demo', status: 'READY' }
  }),
  event({
    id: 'evt_variant_1', stream: 'variant:variant_tiktok', type: 'VARIANT_PLANNED',
    payload: { variantId: 'variant_tiktok', contentId: 'content_1', platform: 'tiktok', status: 'PLANNED' }
  }),
  event({
    id: 'evt_job_1', stream: 'publish-job:job_1', type: 'PUBLISH_JOB_RECORDED',
    payload: { publishJobId: 'job_1', variantId: 'variant_tiktok', state: 'SIMULATED' }
  }),
  event({
    id: 'evt_metric_1', stream: 'metrics:variant_tiktok', type: 'METRIC_SNAPSHOT_RECORDED',
    payload: {
      metricSnapshotId: 'metric_1', variantId: 'variant_tiktok', platform: 'tiktok', capturedAt: at,
      metrics: { views: 1000, watchSeconds: 14000, shares: 55, comments: 21, followersGained: 13 }
    }
  }),
  event({
    id: 'evt_comment_1', stream: 'comment:comment_1', type: 'COMMENT_SIGNAL_RECORDED',
    payload: { commentSignalId: 'comment_1', variantId: 'variant_tiktok', platform: 'tiktok', category: 'EPISODE_IDEA', urgency: 'NORMAL' }
  }),
  event({
    id: 'evt_trend_1', stream: 'trend:trend_1', type: 'TREND_SIGNAL_RECORDED',
    payload: { trendSignalId: 'trend_1', source: 'synthetic_fixture', topic: 'DJ USB', velocity: 78, brandFit: 91 }
  }),
  event({
    id: 'evt_hypothesis_1', stream: 'hypothesis:hypothesis_1', type: 'HYPOTHESIS_REGISTERED',
    payload: { hypothesisId: 'hypothesis_1', statement: 'Conflict hooks lift shares.', confidence: 0.62, status: 'TESTING' }
  }),
  event({
    id: 'evt_experiment_1', stream: 'experiment:experiment_1', type: 'EXPERIMENT_REGISTERED',
    payload: { experimentId: 'experiment_1', hypothesisId: 'hypothesis_1', changedVariable: 'hook', status: 'PLANNED' }
  }),
  event({
    id: 'evt_brief_1', stream: 'brief:brief_1', type: 'PRODUCTION_BRIEF_REGISTERED',
    payload: { productionBriefId: 'brief_1', sourceAnalysisId: 'analysis_1', priority: 'HIGH', recommendations: ['TEST_CONFLICT_HOOK', 'KEEP_CANON_UNCHANGED'] }
  })
];

test('domain event contract normalizes and freezes shadow events', () => {
  const result = createDomainEvent(event());
  assert.equal(result.mode, 'shadow');
  assert.equal(result.payload.status, 'DRAFT');
  assert.ok(Object.isFrozen(result));
});

test('append-only store rejects duplicate event ids without mutating the original records', () => {
  const first = appendStoredEvent([], event(), scope);
  assert.throws(() => appendStoredEvent(first, event({ stream: 'campaign:other' }), scope), /Duplicate event id/);
  assert.equal(first.length, 1);
});

test('append-only store rejects sequence gaps per stream', () => {
  assert.throws(() => appendStoredEvent([], event({ sequence: 2 }), scope), /Invalid stream sequence/);
});

test('append-only store rejects cross-tenant or cross-project events', () => {
  assert.throws(() => appendStoredEvent([], event({ tenantId: 'other' }), scope), /Event scope mismatch/);
});

test('event hash chain detects tampering', () => {
  const records = appendStoredEvents([], demoEvents, scope);
  assert.equal(verifyStoredEvents(records, scope), true);
  const tampered = records.map((record, index) => index === 4
    ? { ...record, event: { ...record.event, payload: { ...record.event.payload, metricSnapshotId: 'tampered' } } }
    : record);
  assert.equal(verifyStoredEvents(tampered, scope), false);
});

test('projection builds deterministic linked growth state', () => {
  const records = appendStoredEvents([], demoEvents, scope);
  const first = projectGrowthState(records, scope);
  const second = projectGrowthState(records, scope);
  assert.deepEqual(first, second);
  assert.equal(first.eventCount, 10);
  assert.equal(first.campaigns.length, 1);
  assert.equal(first.metricSnapshots[0].metrics.views, 1000);
  assert.equal(first.latestMetricsByVariant.length, 1);
  assert.equal(first.experiments[0].hypothesisId, 'hypothesis_1');
  assert.match(first.eventHead, /^[a-f0-9]{64}$/);
});

test('projection rejects missing domain references', () => {
  const invalid = event({
    id: 'evt_variant_invalid', stream: 'variant:invalid', type: 'VARIANT_PLANNED',
    payload: { variantId: 'invalid', contentId: 'missing', platform: 'tiktok', status: 'PLANNED' }
  });
  const records = appendStoredEvent([], invalid, scope);
  assert.throws(() => projectGrowthState(records, scope), /Projection reference missing/);
});

test('summary exposes only aggregate operational counts', () => {
  const state = projectGrowthState(appendStoredEvents([], demoEvents, scope), scope);
  assert.deepEqual(summarizeGrowthState(state), {
    tenantId: scope.tenantId,
    projectId: scope.projectId,
    eventCount: 10,
    campaigns: 1,
    contentItems: 1,
    variants: 1,
    publishJobs: 1,
    metricSnapshots: 1,
    commentSignals: 1,
    trendSignals: 1,
    hypotheses: 1,
    experiments: 1,
    productionBriefs: 1
  });
});

test('unsupported live or malformed data contracts fail closed', () => {
  assert.throws(() => createDomainEvent(event({ mode: 'live' })), GrowthValidationError);
  assert.throws(() => createDomainEvent(event({ occurredAt: 'yesterday' })), GrowthValidationError);
});
