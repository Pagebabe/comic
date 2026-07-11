import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeMomentum,
  analyzePerformanceSnapshot,
  buildDailyGrowthBrief,
  buildDirectionPackage,
  buildRobustBaseline,
  comparisonSegment,
  derivePerformanceMetrics,
  durationBucket,
  median,
  percentile,
  validatePerformanceSnapshot
} from '../growth-os/analytics.mjs';
import { createDomainEvent } from '../growth-os/data.mjs';

const snapshot = (id, overrides = {}) => ({
  schemaVersion: 1,
  id,
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  variantId: `variant_${id}`,
  platform: 'tiktok',
  format: 'sketch',
  seriesId: 'series_dj',
  characterIds: ['dj_klaus'],
  publishedAt: '2026-07-01T18:00:00.000Z',
  capturedAt: '2026-07-02T18:00:00.000Z',
  durationSeconds: 20,
  views: 10000,
  starts: 10000,
  viewersAfter3s: 6500,
  completions: 4200,
  shares: 200,
  saves: 120,
  comments: 100,
  profileVisits: 500,
  followersGained: 50,
  averageWatchSeconds: 12,
  rewatches: 700,
  productionHours: 4,
  provenance: 'synthetic_fixture',
  ...overrides
});

const history = Array.from({ length: 6 }, (_, index) => snapshot(`history_${index}`, {
  views: index === 5 ? 1000000 : 9000 + index * 500,
  starts: 9000 + index * 500,
  viewersAfter3s: 5700 + index * 350,
  completions: 3600 + index * 280,
  shares: 160 + index * 10,
  saves: 90 + index * 5,
  comments: 80 + index * 4,
  profileVisits: 450 + index * 10,
  followersGained: 40 + index * 2,
  averageWatchSeconds: 11.5,
  rewatches: 600 + index * 20,
  productionHours: 4
}));

test('median and percentile are deterministic and robust to ordering', () => {
  assert.equal(median([100, 1, 3, 2]), 2.5);
  assert.equal(percentile([4, 1, 3, 2], 0.5), 2.5);
});

test('duration bucket and comparison segment are stable', () => {
  assert.equal(durationBucket(20), '16-30');
  assert.equal(comparisonSegment(snapshot('one')), 'tiktok|sketch|16-30');
});

test('snapshot validation and metric derivation preserve provenance', () => {
  const value = validatePerformanceSnapshot(snapshot('one'));
  const metrics = derivePerformanceMetrics(value);
  assert.equal(value.provenance, 'synthetic_fixture');
  assert.equal(metrics.holdRate3s, 0.65);
  assert.equal(metrics.completionRate, 0.42);
});

test('robust baseline uses exact segment and median resists one huge outlier', () => {
  const baseline = buildRobustBaseline(history, snapshot('target'));
  assert.equal(baseline.scope, 'EXACT_SEGMENT');
  assert.equal(baseline.sampleSize, 6);
  assert.ok(baseline.viewMedian < 20000);
  assert.ok(baseline.viewP90 > baseline.viewMedian);
});

test('insufficient history returns HOLD instead of inventing a score', () => {
  const analysis = analyzePerformanceSnapshot(snapshot('target'), history.slice(0, 2));
  assert.equal(analysis.status, 'HOLD');
  assert.equal(analysis.score, null);
  assert.equal(analysis.baseline.status, 'INSUFFICIENT_DATA');
});

test('critical data quality errors hold the decision', () => {
  const target = snapshot('bad', { starts: 0, views: 0, capturedAt: '2026-06-30T18:00:00.000Z' });
  const analysis = analyzePerformanceSnapshot(target, history);
  assert.equal(analysis.status, 'HOLD');
  assert.ok(analysis.quality.critical.includes('ZERO_STARTS'));
  assert.ok(analysis.quality.critical.includes('CAPTURE_BEFORE_PUBLICATION'));
});

test('weak hook with strong body produces a traceable hook recommendation', () => {
  const target = snapshot('weak_hook', {
    viewersAfter3s: 4000,
    completions: 5200,
    shares: 240,
    followersGained: 55
  });
  const analysis = analyzePerformanceSnapshot(target, history);
  assert.equal(analysis.status, 'ANALYZED');
  assert.ok(analysis.recommendations.some((item) => item.code === 'TEST_NEW_HOOK' && item.ruleId === 'R-HOOK-001'));
});

test('outlier analysis creates deterministic direction events that satisfy data contracts', () => {
  const target = snapshot('outlier', {
    views: 60000,
    starts: 60000,
    viewersAfter3s: 51000,
    completions: 39000,
    shares: 4200,
    saves: 1800,
    comments: 900,
    profileVisits: 3000,
    followersGained: 700,
    averageWatchSeconds: 18,
    rewatches: 12000,
    productionHours: 4
  });
  const analysis = analyzePerformanceSnapshot(target, history);
  assert.equal(analysis.classification, 'OUTLIER');
  const first = buildDirectionPackage(analysis, { tenantId: 'tenant_demo', projectId: 'comic_factory', occurredAt: '2026-07-03T08:00:00.000Z' });
  const second = buildDirectionPackage(analysis, { tenantId: 'tenant_demo', projectId: 'comic_factory', occurredAt: '2026-07-03T08:00:00.000Z' });
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
  for (const event of first) assert.doesNotThrow(() => createDomainEvent(event));
  assert.ok(first[1].payload.recommendations.includes('NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL'));
});

test('momentum and saturation use chronological score windows', () => {
  const analyses = [150, 145, 140, 110, 90, 70].map((score, index) => ({
    seriesId: 'series_dj',
    score,
    capturedAt: `2026-07-0${index + 1}T12:00:00.000Z`
  }));
  const result = analyzeMomentum(analyses, 'series_dj');
  assert.equal(result.status, 'DECLINING');
  assert.equal(result.saturation, true);
});

test('daily brief ranks winners and exposes held data without hiding alerts', () => {
  const winner = analyzePerformanceSnapshot(snapshot('winner', {
    views: 50000, starts: 50000, viewersAfter3s: 42000, completions: 32000,
    shares: 3000, saves: 1400, comments: 700, profileVisits: 2500,
    followersGained: 500, averageWatchSeconds: 17, rewatches: 9000
  }), history);
  const held = analyzePerformanceSnapshot(snapshot('held', { views: 0, starts: 0 }), history);
  const brief = buildDailyGrowthBrief([held, winner], '2026-07-03T09:00:00.000Z');
  assert.equal(brief.counts.total, 2);
  assert.equal(brief.counts.held, 1);
  assert.equal(brief.topWinners[0].snapshotId, 'winner');
  assert.ok(brief.alerts.includes('ZERO_VIEWS'));
});
