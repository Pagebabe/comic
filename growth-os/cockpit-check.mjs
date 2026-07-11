import { mkdirSync, writeFileSync } from 'node:fs';
import { assertReadOnlyCockpitArtifact, buildCockpitViewModel, renderCockpitHtml } from './cockpit.mjs';

const input = {
  asOf: '2026-07-11T10:00:00.000Z',
  scope: { tenantId: 'tenant_demo', projectId: 'comic_factory' },
  growthBrief: {
    schemaVersion: 1,
    ruleVersion: 'mkt0-003.v1',
    asOf: '2026-07-11T09:55:00.000Z',
    counts: { total: 2, analyzed: 2, held: 0, winners: 1 },
    topWinners: [{ snapshotId: 'snapshot_dj_usb', score: 147.2, classification: 'WINNER' }],
    alerts: ['HIGH_VIEW_OUTLIER'],
    recommendations: ['CREATE_FOLLOW_UP'],
    provenance: 'synthetic_or_authorized_input_only'
  },
  analyses: [
    {
      snapshotId: 'snapshot_dj_usb', variantId: 'variant_dj_usb', platform: 'tiktok', seriesId: 'series_dj',
      status: 'ANALYZED', score: 147.2, classification: 'WINNER',
      quality: { warnings: ['SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM'], critical: [] },
      anomalies: ['HIGH_VIEW_OUTLIER'],
      recommendations: [{ code: 'CREATE_FOLLOW_UP', priority: 'HIGH', ruleId: 'R-SHARE-001', reason: 'Synthetic share rate is above baseline.' }]
    },
    {
      snapshotId: 'snapshot_room', variantId: 'variant_room', platform: 'instagram_reels', seriesId: 'series_room',
      status: 'ANALYZED', score: 91.4, classification: 'BASELINE',
      quality: { warnings: ['SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM'], critical: [] },
      anomalies: [], recommendations: []
    }
  ],
  signalBrief: {
    schemaVersion: 1,
    ruleVersion: 'mkt0-004.v1',
    asOf: '2026-07-11T09:56:00.000Z',
    community: {
      signalCount: 12,
      highPriorityAlerts: [{ signalId: 'signal_rights', category: 'RIGHTS', urgency: 'HIGH', action: 'ROUTE_TO_RIGHTS_REVIEW' }],
      episodeIdeaCandidates: [{ value: 'dj usb', count: 4 }],
      topTopics: [{ value: 'dj usb', count: 4 }],
      topCharacters: [{ value: 'dj_klaus', count: 5 }]
    },
    opportunities: [{
      opportunityId: 'opp_dj_usb', topic: 'dj usb', score: 91, trendScore: 79, communityDemand: 4,
      decision: 'RECOMMEND_REVIEW', humanReviewRequired: true,
      reasons: ['COMMUNITY_DEMAND_MATCH', 'HIGH_OPPORTUNITY_SCORE'], sourceSignalIds: ['trend_dj_usb']
    }],
    publicActionsExecuted: false,
    replyMode: 'DRAFT_ONLY',
    provenance: 'synthetic_or_authorized_input_only'
  },
  dailyPlan: {
    schemaVersion: 1,
    ruleVersion: 'mkt0-005.v1',
    asOf: '2026-07-11T09:57:00.000Z',
    date: '2026-07-11',
    contentToday: [{ contentId: 'content_dj_usb', platform: 'tiktok', windowStart: '2026-07-11T12:00:00.000Z', priority: 'HIGH' }],
    approvalsRequired: ['content_new_format:approval'],
    readyTasks: ['content_dj_usb:packaging'],
    retries: [{ taskId: 'content_room:qa', retryAt: '2026-07-11T10:05:00.000Z' }],
    deadLetters: ['content_archive:scheduling'],
    bottlenecks: {
      bottlenecks: [{ state: 'DEAD_LETTER', step: 'SCHEDULING', count: 1, taskIds: ['content_archive:scheduling'], severity: 5 }],
      criticalCount: 1,
      humanQueueCount: 1
    },
    summary: { plannedContent: 1, humanApprovals: 1, readyTasks: 1, retries: 1, deadLetters: 1 },
    mode: 'shadow',
    publicActionsExecuted: false,
    provenance: 'synthetic_fixture'
  },
  hypotheses: [{
    hypothesisId: 'hyp_dj_usb',
    statement: 'The DJ USB format merits a controlled follow-up test.',
    confidence: 0.72,
    status: 'TESTING',
    sourceRef: 'snapshot_dj_usb'
  }],
  systemHealth: {
    ruleVersion: 'health.v1',
    asOf: '2026-07-11T09:58:00.000Z',
    provenance: 'synthetic_fixture',
    components: [
      { component: 'event-store', status: 'PASS', checkedAt: '2026-07-11T09:58:00.000Z', evidenceRef: 'growth-os/evidence/MKT0-002.md' },
      { component: 'orchestrator', status: 'PASS', checkedAt: '2026-07-11T09:58:00.000Z', evidenceRef: 'growth-os/evidence/MKT0-005.md' }
    ]
  },
  auditEntries: [
    { id: 'audit_growth', occurredAt: '2026-07-11T09:50:00.000Z', status: 'PASS', code: 'GROWTH_CHECK', reference: 'synthetic-run-1', hash: 'aaaaaaaa' },
    { id: 'audit_orchestrator', occurredAt: '2026-07-11T09:59:00.000Z', status: 'PASS', code: 'ORCHESTRATOR_CHECK', reference: 'synthetic-run-2', hash: 'bbbbbbbb' }
  ]
};

const viewModel = buildCockpitViewModel(input);
const html = renderCockpitHtml(viewModel);
assertReadOnlyCockpitArtifact(html);

mkdirSync('output/growth-os', { recursive: true });
writeFileSync('output/growth-os/mkt0-growth-cockpit.json', `${JSON.stringify(viewModel, null, 2)}\n`);
writeFileSync('output/growth-os/mkt0-growth-cockpit.html', html);

console.log(JSON.stringify({
  status: 'pass',
  ruleVersion: viewModel.ruleVersion,
  sections: viewModel.navigation.length,
  readOnly: viewModel.capabilities.readOnly,
  mutations: viewModel.capabilities.mutations,
  networkRequests: viewModel.capabilities.networkRequests,
  publicActionsExecuted: false,
  provenance: viewModel.provenanceBanner.label,
  artifacts: [
    'output/growth-os/mkt0-growth-cockpit.json',
    'output/growth-os/mkt0-growth-cockpit.html'
  ]
}));
