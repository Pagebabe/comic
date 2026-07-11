import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateCommunitySignals,
  buildDailySignalBrief,
  buildReplyDraft,
  buildSignalDirectionPackage,
  combineSignalOpportunities,
  normalizeCommunitySignal,
  normalizeTrendSignal,
  redactCommunityText,
  scoreTrendOpportunity
} from '../growth-os/signals.mjs';
import { createDomainEvent } from '../growth-os/data.mjs';

const community = (id, text, overrides = {}) => ({
  schemaVersion: 1,
  id,
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  variantId: 'variant_demo',
  platform: 'tiktok',
  observedAt: '2026-07-11T08:00:00.000Z',
  provenance: 'synthetic_fixture',
  authorRef: 'anon_deadbeef',
  text,
  topics: [],
  characterIds: [],
  ...overrides
});

const trend = (id, overrides = {}) => ({
  schemaVersion: 1,
  id,
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
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
  relatedTopics: ['dj usb'],
  ...overrides
});

test('community text redacts email, phone and URL', () => {
  const result = redactCommunityText('Mail me at fan@example.com or +49 170 1234567 https://spam.test');
  assert.match(result.text, /\[redacted-email\]/);
  assert.match(result.text, /\[redacted-phone\]/);
  assert.match(result.text, /\[redacted-url\]/);
  assert.deepEqual(result.privacyFlags, ['EMAIL_REDACTED', 'PHONE_REDACTED', 'URL_REDACTED']);
});

test('crisis classification overrides harmless category hints and requires escalation', () => {
  const result = normalizeCommunitySignal(community('crisis', 'Das ist eine Drohung und akute Gefahr', { categoryHint: 'FAN_REACTION' }));
  assert.equal(result.category, 'CRISIS');
  assert.equal(result.urgency, 'CRITICAL');
  assert.equal(result.replyPolicy, 'NO_REPLY_ESCALATE');
  assert.equal(result.humanReviewRequired, true);
});

test('spam never creates a reply draft', () => {
  const signal = community('spam', 'Buy followers with our promo service');
  assert.equal(normalizeCommunitySignal(signal).category, 'SPAM');
  assert.equal(buildReplyDraft(signal), null);
});

test('episode idea draft stays shadow-only and needs human approval', () => {
  const draft = buildReplyDraft(community('idea', 'Mach eine Folge über DJ USB', { topics: ['dj usb'] }));
  assert.equal(draft.mode, 'shadow');
  assert.equal(draft.publishAllowed, false);
  assert.equal(draft.humanApprovalRequired, true);
});

test('aggregation removes raw texts and produces topic demand without personal profiles', () => {
  const result = aggregateCommunitySignals([
    community('a', 'Mach eine Folge über DJ USB', { topics: ['dj usb'], characterIds: ['dj_klaus'] }),
    community('b', 'Bitte eine Folge über DJ USB', { topics: ['dj usb'], characterIds: ['dj_klaus'] }),
    community('c', 'Buy followers with our promo service', { topics: ['dj usb'] })
  ]);
  assert.equal(result.signalCount, 3);
  assert.equal(result.episodeIdeaCandidates[0].value, 'dj usb');
  assert.equal(result.episodeIdeaCandidates[0].count, 2);
  assert.equal(result.rawTextsIncluded, false);
  assert.equal(result.personalProfilesBuilt, false);
  assert.equal(result.publicActionsExecuted, false);
});

test('aggregation rejects cross-project signal mixtures', () => {
  assert.throws(() => aggregateCommunitySignals([
    community('a', 'Super'),
    community('b', 'Super', { projectId: 'other' })
  ]), /scope mismatch/);
});

test('high opportunity trend is recommended for review, not auto-published', () => {
  const result = scoreTrendOpportunity(trend('trend_high'), '2026-07-11T12:00:00.000Z');
  assert.equal(result.decision, 'RECOMMEND_REVIEW');
  assert.equal(result.humanReviewRequired, true);
  assert.ok(result.score >= 70);
});

test('high rights risk and low brand fit are rejected', () => {
  assert.equal(scoreTrendOpportunity(trend('rights', { rightsRisk: 90 }), '2026-07-11T12:00:00.000Z').decision, 'REJECT');
  assert.equal(scoreTrendOpportunity(trend('brand', { brandFit: 20 }), '2026-07-11T12:00:00.000Z').decision, 'REJECT');
});

test('expired trend is not recommended', () => {
  const result = scoreTrendOpportunity(trend('expired'), '2026-07-20T12:00:00.000Z');
  assert.equal(result.decision, 'EXPIRED');
});

test('community demand boosts matching trend opportunities deterministically', () => {
  const aggregate = aggregateCommunitySignals([
    community('a', 'Mach eine Folge über DJ USB', { topics: ['dj usb'] }),
    community('b', 'Bitte eine Folge über DJ USB', { topics: ['dj usb'] }),
    community('c', 'Sketch über DJ USB', { topics: ['dj usb'], categoryHint: 'EPISODE_IDEA' })
  ]);
  const scored = scoreTrendOpportunity(trend('match'), '2026-07-11T12:00:00.000Z');
  const first = combineSignalOpportunities(aggregate, [scored]);
  const second = combineSignalOpportunities(aggregate, [scored]);
  assert.deepEqual(first, second);
  assert.equal(first[0].communityDemand, 3);
  assert.ok(first[0].score > scored.score);
});

test('recommended opportunity creates valid hypothesis and brief events with safety markers', () => {
  const opportunity = { opportunityId: 'opp_demo', topic: 'dj usb', score: 91, decision: 'RECOMMEND_REVIEW' };
  const events = buildSignalDirectionPackage(opportunity, {
    tenantId: 'tenant_demo', projectId: 'comic_factory', occurredAt: '2026-07-11T13:00:00.000Z'
  });
  assert.equal(events.length, 2);
  for (const event of events) assert.doesNotThrow(() => createDomainEvent(event));
  assert.ok(events[1].payload.recommendations.includes('NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL'));
  assert.ok(events[1].payload.recommendations.includes('NO_PUBLIC_ACTION_WITHOUT_HUMAN_APPROVAL'));
});

test('non-recommended opportunity creates no direction events', () => {
  assert.deepEqual(buildSignalDirectionPackage({ opportunityId: 'low', topic: 'x', score: 60, decision: 'WATCH' }, {
    tenantId: 'tenant_demo', projectId: 'comic_factory', occurredAt: '2026-07-11T13:00:00.000Z'
  }), []);
});

test('daily signal brief exposes alerts and keeps reply mode draft-only', () => {
  const aggregate = aggregateCommunitySignals([
    community('rights', 'Copyright takedown notice'),
    community('idea1', 'Mach eine Folge über DJ USB', { topics: ['dj usb'] }),
    community('idea2', 'Bitte eine Folge über DJ USB', { topics: ['dj usb'] })
  ]);
  const opportunities = combineSignalOpportunities(aggregate, [scoreTrendOpportunity(trend('t1'), '2026-07-11T12:00:00.000Z')]);
  const brief = buildDailySignalBrief({ communityAggregate: aggregate, opportunities, asOf: '2026-07-11T14:00:00.000Z' });
  assert.equal(brief.replyMode, 'DRAFT_ONLY');
  assert.equal(brief.publicActionsExecuted, false);
  assert.equal(brief.community.highPriorityAlerts[0].category, 'RIGHTS');
});

test('raw author references must already be anonymized', () => {
  assert.throws(() => normalizeCommunitySignal(community('author', 'Hi', { authorRef: 'real.person@example.com' })), /anonymized/);
});

test('trend contract rejects invalid expiry order', () => {
  assert.throws(() => normalizeTrendSignal(trend('bad', { expiresAt: '2026-07-10T08:00:00.000Z' })), /after observedAt/);
});
