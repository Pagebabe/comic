import { mkdir, writeFile } from 'node:fs/promises';
import {
  aggregateCommunitySignals,
  buildDailySignalBrief,
  buildSignalDirectionPackage,
  combineSignalOpportunities,
  scoreTrendOpportunity
} from './signals.mjs';
import { appendStoredEvents, projectGrowthState, verifyStoredEvents } from './data.mjs';

const scope = Object.freeze({ tenantId: 'tenant_demo', projectId: 'comic_factory' });
const community = (id, text, topics = []) => ({
  schemaVersion: 1,
  id,
  tenantId: scope.tenantId,
  projectId: scope.projectId,
  variantId: 'variant_demo',
  platform: 'tiktok',
  observedAt: '2026-07-11T08:00:00.000Z',
  provenance: 'synthetic_fixture',
  authorRef: 'anon_deadbeef',
  text,
  topics,
  characterIds: ['dj_klaus']
});
const aggregate = aggregateCommunitySignals([
  community('idea_1', 'Mach eine Folge über DJ USB', ['dj usb']),
  community('idea_2', 'Bitte eine Folge über DJ USB', ['dj usb']),
  community('idea_3', 'Sketch über DJ USB', ['dj usb']),
  community('rights_1', 'Copyright takedown notice')
]);
const trend = scoreTrendOpportunity({
  schemaVersion: 1,
  id: 'trend_dj_usb',
  tenantId: scope.tenantId,
  projectId: scope.projectId,
  platform: 'tiktok',
  source: 'synthetic_fixture',
  topic: 'DJ USB',
  observedAt: '2026-07-11T08:00:00.000Z',
  expiresAt: '2026-07-15T08:00:00.000Z',
  provenance: 'synthetic_fixture',
  velocity: 88,
  brandFit: 92,
  characterFit: 90,
  saturation: 25,
  rightsRisk: 10,
  productionEffort: 35,
  relatedTopics: ['dj usb']
}, '2026-07-11T12:00:00.000Z');
const opportunities = combineSignalOpportunities(aggregate, [trend]);
if (!opportunities.length || opportunities[0].decision !== 'RECOMMEND_REVIEW') throw new Error('MKT0-004 opportunity was not recommended for review');
const directionEvents = buildSignalDirectionPackage(opportunities[0], {
  tenantId: scope.tenantId,
  projectId: scope.projectId,
  occurredAt: '2026-07-11T13:00:00.000Z'
});
const records = appendStoredEvents([], directionEvents, scope);
const projection = projectGrowthState(records, scope);
if (!verifyStoredEvents(records, scope)) throw new Error('MKT0-004 direction event chain is invalid');
if (projection.hypotheses.length !== 1 || projection.productionBriefs.length !== 1) throw new Error('MKT0-004 direction projection is incomplete');
if (!projection.productionBriefs[0].recommendations.includes('NO_PUBLIC_ACTION_WITHOUT_HUMAN_APPROVAL')) throw new Error('MKT0-004 public action safety marker missing');
const brief = buildDailySignalBrief({ communityAggregate: aggregate, opportunities, asOf: '2026-07-11T14:00:00.000Z' });
const report = {
  status: 'pass',
  mode: 'shadow',
  ruleVersion: brief.ruleVersion,
  syntheticSignalsOnly: true,
  publicActionsExecuted: false,
  personalProfilesBuilt: false,
  rawTextsInAggregate: false,
  communitySignalCount: aggregate.signalCount,
  highPriorityAlerts: aggregate.alerts.length,
  episodeIdeaCandidates: aggregate.episodeIdeaCandidates,
  trendDecision: trend.decision,
  opportunityScore: opportunities[0].score,
  directionEvents: directionEvents.length,
  eventChainValid: true,
  replyMode: brief.replyMode
};
await mkdir(new URL('../output/growth-os/', import.meta.url), { recursive: true });
await writeFile(new URL('../output/growth-os/mkt0-signal-radar.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
