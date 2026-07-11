import { mkdir, writeFile } from 'node:fs/promises';
import { analyzePerformanceSnapshot, buildDailyGrowthBrief, buildDirectionPackage } from './analytics.mjs';
import { appendStoredEvents, projectGrowthState, verifyStoredEvents } from './data.mjs';

const scope = Object.freeze({ tenantId: 'tenant_demo', projectId: 'comic_factory' });
const snapshot = (id, overrides = {}) => ({
  schemaVersion: 1,
  id,
  tenantId: scope.tenantId,
  projectId: scope.projectId,
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
  views: 9000 + index * 500,
  starts: 9000 + index * 500,
  viewersAfter3s: 5700 + index * 350,
  completions: 3600 + index * 280,
  shares: 160 + index * 10,
  saves: 90 + index * 5,
  comments: 80 + index * 4,
  profileVisits: 450 + index * 10,
  followersGained: 40 + index * 2,
  averageWatchSeconds: 11.5,
  rewatches: 600 + index * 20
}));
const target = snapshot('winner', {
  views: 50000,
  starts: 50000,
  viewersAfter3s: 42000,
  completions: 32000,
  shares: 3000,
  saves: 1400,
  comments: 700,
  profileVisits: 2500,
  followersGained: 500,
  averageWatchSeconds: 17,
  rewatches: 9000
});
const analysis = analyzePerformanceSnapshot(target, history);
const events = buildDirectionPackage(analysis, {
  tenantId: scope.tenantId,
  projectId: scope.projectId,
  occurredAt: '2026-07-03T08:00:00.000Z'
});
const records = appendStoredEvents([], events, scope);
const projected = projectGrowthState(records, scope);
const brief = buildDailyGrowthBrief([analysis], '2026-07-03T09:00:00.000Z');
if (analysis.status !== 'ANALYZED') throw new Error('Growth Radar did not analyze the synthetic winner');
if (!['WINNER', 'OUTLIER'].includes(analysis.classification)) throw new Error('Synthetic winner was not classified as a winner');
if (!verifyStoredEvents(records, scope)) throw new Error('Direction event chain is invalid');
if (projected.hypotheses.length !== 1 || projected.productionBriefs.length !== 1) throw new Error('Direction projection is incomplete');
if (!projected.productionBriefs[0].recommendations.includes('NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL')) throw new Error('Canon safety marker missing');
const report = {
  status: 'pass',
  mode: 'shadow',
  realPlatformDataUsed: false,
  liveActionsExecuted: false,
  ruleVersion: analysis.ruleVersion,
  score: analysis.score,
  classification: analysis.classification,
  baselineScope: analysis.baseline.scope,
  recommendations: analysis.recommendations,
  directionEvents: events.length,
  eventChainValid: true,
  dailyBrief: brief
};
await mkdir(new URL('../output/growth-os/', import.meta.url), { recursive: true });
await writeFile(new URL('../output/growth-os/mkt0-growth-radar.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
