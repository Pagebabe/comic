import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertReadOnlyCockpitArtifact,
  buildCockpitViewModel,
  COCKPIT_MODE,
  escapeHtml,
  NOT_AVAILABLE,
  renderCockpitHtml,
  UNKNOWN
} from '../growth-os/cockpit.mjs';

function fixture(overrides = {}) {
  return {
    asOf: '2026-07-11T10:00:00.000Z',
    scope: { tenantId: 'tenant_demo', projectId: 'comic_factory' },
    growthBrief: {
      schemaVersion: 1,
      ruleVersion: 'mkt0-003.v1',
      asOf: '2026-07-11T09:55:00.000Z',
      counts: { total: 2, analyzed: 2, held: 0, winners: 1 },
      topWinners: [{ snapshotId: 'snap_winner', score: 147.2, classification: 'WINNER' }],
      heldSnapshots: [],
      alerts: ['HIGH_VIEW_OUTLIER'],
      recommendations: ['CREATE_FOLLOW_UP'],
      provenance: 'synthetic_or_authorized_input_only'
    },
    analyses: [
      {
        snapshotId: 'snap_under', variantId: 'variant_b', platform: 'instagram_reels', seriesId: 'series_room',
        status: 'ANALYZED', score: 74, classification: 'UNDERPERFORMER',
        quality: { warnings: ['SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM'], critical: [] },
        anomalies: [],
        recommendations: [{ code: 'PAUSE_AND_REVIEW_FORMAT', priority: 'NORMAL', ruleId: 'R-LOW-001', reason: 'Below baseline.' }]
      },
      {
        snapshotId: 'snap_winner', variantId: 'variant_a', platform: 'tiktok', seriesId: 'series_dj',
        status: 'ANALYZED', score: 147.2, classification: 'WINNER',
        quality: { warnings: ['SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM'], critical: [] },
        anomalies: ['HIGH_VIEW_OUTLIER'],
        recommendations: [{ code: 'CREATE_FOLLOW_UP', priority: 'HIGH', ruleId: 'R-SHARE-001', reason: 'Share rate above baseline.' }]
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
        decision: 'RECOMMEND_REVIEW', humanReviewRequired: true, reasons: ['COMMUNITY_DEMAND_MATCH'], sourceSignalIds: ['trend_1']
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
      contentToday: [{ contentId: 'content_a', platform: 'tiktok', windowStart: '2026-07-11T12:00:00.000Z', priority: 'HIGH' }],
      approvalsRequired: ['content_b:approval'],
      readyTasks: ['content_a:packaging'],
      retries: [{ taskId: 'content_c:qa', retryAt: '2026-07-11T10:05:00.000Z' }],
      deadLetters: ['content_d:scheduling'],
      bottlenecks: {
        bottlenecks: [{ state: 'DEAD_LETTER', step: 'SCHEDULING', count: 1, taskIds: ['content_d:scheduling'], severity: 5 }],
        criticalCount: 1,
        humanQueueCount: 1
      },
      summary: { plannedContent: 1, humanApprovals: 1, readyTasks: 1, retries: 1, deadLetters: 1 },
      mode: 'shadow',
      publicActionsExecuted: false,
      provenance: 'synthetic_fixture'
    },
    opportunities: [],
    hypotheses: [{ hypothesisId: 'hyp_1', statement: 'DJ USB may support a controlled follow-up.', confidence: 0.72, status: 'TESTING', sourceRef: 'snap_winner' }],
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
      { id: 'audit_2', occurredAt: '2026-07-11T09:59:00.000Z', status: 'PASS', code: 'ORCHESTRATOR_CHECK', reference: 'run-2', hash: 'bbbb' },
      { id: 'audit_1', occurredAt: '2026-07-11T09:50:00.000Z', status: 'PASS', code: 'GROWTH_CHECK', reference: 'run-1', hash: 'aaaa' }
    ],
    ...overrides
  };
}

test('view model generation is deterministic and read-only', () => {
  const first = buildCockpitViewModel(fixture());
  const second = buildCockpitViewModel(fixture());
  assert.deepEqual(first, second);
  assert.equal(first.mode, COCKPIT_MODE);
  assert.equal(first.capabilities.readOnly, true);
  assert.equal(first.capabilities.mutations, false);
});

test('missing live follower metrics are NOT_AVAILABLE instead of zero', () => {
  const model = buildCockpitViewModel(fixture());
  assert.equal(model.growth.metrics[0].value, NOT_AVAILABLE);
  assert.equal(model.growth.metrics[1].value, NOT_AVAILABLE);
});

test('missing optional data is marked UNKNOWN', () => {
  const model = buildCockpitViewModel(fixture({ growthBrief: undefined, analyses: [], signalBrief: undefined, dailyPlan: undefined, hypotheses: [], systemHealth: undefined, auditEntries: [] }));
  assert.equal(model.today.dataState, UNKNOWN);
  assert.equal(model.growth.dataState, UNKNOWN);
  assert.equal(model.community.dataState, UNKNOWN);
  assert.equal(model.audit.dataState, UNKNOWN);
});

test('analyses and opportunities are sorted deterministically', () => {
  const model = buildCockpitViewModel(fixture());
  assert.deepEqual(model.content.items.map((item) => item.snapshotId), ['snap_under', 'snap_winner']);
  assert.equal(model.radar.opportunities[0].opportunityId, 'opp_dj_usb');
  assert.deepEqual(model.audit.entries.map((item) => item.id), ['audit_1', 'audit_2']);
});

test('forbidden secrets are rejected recursively', () => {
  assert.throws(() => buildCockpitViewModel(fixture({ systemHealth: { token: 'never', components: [] } })), /Forbidden sensitive/);
});

test('raw community identity and message fields are rejected', () => {
  assert.throws(() => buildCockpitViewModel(fixture({ hypotheses: [{ hypothesisId: 'x', statement: 'safe', confidence: 0.5, status: 'TESTING', authorRef: 'anon_x' }] })), /Forbidden sensitive/);
  assert.throws(() => buildCockpitViewModel(fixture({ opportunities: [{ opportunityId: 'x', topic: 'safe', rawText: 'private' }] })), /Forbidden sensitive/);
});

test('unsupported provenance is rejected', () => {
  const value = fixture();
  value.growthBrief.provenance = 'mystery_source';
  assert.throws(() => buildCockpitViewModel(value), /Unsupported provenance/);
});

test('HTML escaping neutralizes dangerous content', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  const value = fixture();
  value.hypotheses[0].statement = '<script>alert(1)</script>';
  const html = renderCockpitHtml(buildCockpitViewModel(value));
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('HTML contains restrictive CSP and no external resources', () => {
  const html = renderCockpitHtml(buildCockpitViewModel(fixture()));
  assert.match(html, /default-src 'none'/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.equal(assertReadOnlyCockpitArtifact(html), true);
});

test('HTML contains no mutating controls or executable scripts', () => {
  const html = renderCockpitHtml(buildCockpitViewModel(fixture()));
  assert.doesNotMatch(html, /<(form|button|input|textarea|select|script)\b/i);
  assert.doesNotMatch(html, /on(click|submit|load|error)\s*=/i);
  assert.doesNotMatch(html, /fetch\s*\(/i);
});

test('HTML includes all eight semantic cockpit sections', () => {
  const html = renderCockpitHtml(buildCockpitViewModel(fixture()));
  for (const section of ['today', 'growth', 'content', 'community', 'radar', 'learning', 'system', 'audit']) {
    assert.match(html, new RegExp(`<section id="${section}">`));
  }
});

test('HTML includes responsive mobile structure', () => {
  const html = renderCockpitHtml(buildCockpitViewModel(fixture()));
  assert.match(html, /name="viewport"/);
  assert.match(html, /@media\(max-width:720px\)/);
});

test('synthetic provenance and shadow warning are visible', () => {
  const html = renderCockpitHtml(buildCockpitViewModel(fixture()));
  assert.match(html, /SHADOW DATA/);
  assert.match(html, /Synthetische oder ausdrücklich autorisierte Daten/);
  assert.equal(buildCockpitViewModel(fixture()).provenanceBanner.realWorldClaimsAllowed, false);
});

test('community projection contains no raw texts or personal profiles', () => {
  const model = buildCockpitViewModel(fixture());
  assert.equal(model.community.rawTextsIncluded, false);
  assert.equal(model.community.personalProfilesBuilt, false);
  assert.equal(model.community.publicActionsExecuted, false);
  assert.equal(JSON.stringify(model).includes('messageBody'), false);
});

test('artifact validator rejects network-capable or mutating markup', () => {
  assert.throws(() => assertReadOnlyCockpitArtifact("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'\"><form></form>Read-only Shadow Control Plane"), /mutating or network-capable/);
  assert.throws(() => assertReadOnlyCockpitArtifact("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'\"><script></script>Read-only Shadow Control Plane"), /mutating or network-capable/);
});
