import { createHash } from 'node:crypto';
import { GrowthValidationError } from './core.mjs';

export const SIGNAL_RULE_VERSION = 'mkt0-004.v1';

const PLATFORMS = ['tiktok', 'instagram_reels', 'youtube_shorts', 'threads', 'x'];
const PROVENANCE = ['synthetic_fixture', 'authorized_platform_import', 'manual_public_observation'];
const CATEGORIES = ['FAN_REACTION', 'QUESTION', 'EPISODE_IDEA', 'CRITICISM', 'RIGHTS', 'COLLAB', 'SPAM', 'CRISIS'];
const URGENCY_RANK = Object.freeze({ LOW: 1, NORMAL: 2, HIGH: 3, CRITICAL: 4 });

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GrowthValidationError(`Missing or invalid object: ${field}`, { field });
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new GrowthValidationError(`Missing or invalid string: ${field}`, { field });
  return value.trim();
}

function requireNumber(value, field, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) throw new GrowthValidationError(`Missing or invalid number: ${field}`, { field, value });
  return value;
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!Number.isFinite(Date.parse(text)) || !text.includes('T')) throw new GrowthValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  return text;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) throw new GrowthValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  return text;
}

function stringArray(value, field) {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value)) throw new GrowthValidationError(`Missing or invalid array: ${field}`, { field });
  return Object.freeze([...new Set(value.map((item) => requireString(item, `${field}[]`).toLowerCase()))].sort());
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function round(value, digits = 2) { const factor = 10 ** digits; return Math.round((value + Number.EPSILON) * factor) / factor; }
function normalizeKey(value) { return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9äöüß]+/g, ' ').trim().replace(/\s+/g, ' '); }
function hashId(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16); }

export function redactCommunityText(rawText) {
  const source = requireString(rawText, 'text').slice(0, 2000);
  const flags = [];
  let text = source;
  const replacements = [
    { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, token: '[redacted-email]', flag: 'EMAIL_REDACTED' },
    { pattern: /(?:https?:\/\/|www\.)\S+/gi, token: '[redacted-url]', flag: 'URL_REDACTED' },
    { pattern: /(?:\+?\d[\d\s()./-]{7,}\d)/g, token: '[redacted-phone]', flag: 'PHONE_REDACTED' }
  ];
  for (const replacement of replacements) {
    if (replacement.pattern.test(text)) flags.push(replacement.flag);
    replacement.pattern.lastIndex = 0;
    text = text.replace(replacement.pattern, replacement.token);
  }
  text = text.replace(/\s+/g, ' ').trim().slice(0, 500);
  return Object.freeze({ text, privacyFlags: Object.freeze(flags.sort()), truncated: source.length > 500 });
}

function containsAny(text, terms) { return terms.some((term) => text.includes(term)); }

export function classifyCommunityText(textRaw, categoryHint = null) {
  const text = normalizeKey(textRaw);
  const highRisk = [
    ['CRISIS', ['drohung', 'bedrohung', 'notfall', 'gefahr', 'suizid', 'selbstmord', 'violence', 'threat', 'emergency']],
    ['RIGHTS', ['urheberrecht', 'copyright', 'lizenz', 'rechteinhaber', 'geklaut', 'stolen content', 'takedown']],
    ['SPAM', ['buy followers', 'krypto gewinn', 'crypto profit', 'promo service', 'telegram investment', '1000 follower kaufen']]
  ];
  for (const [category, terms] of highRisk) if (containsAny(text, terms)) return category;
  if (containsAny(text, ['collab', 'zusammenarbeiten', 'kooperation', 'booking', 'partnerschaft', 'sponsoring'])) return 'COLLAB';
  if (containsAny(text, ['mach eine folge', 'folge über', 'episode about', 'episode über', 'bitte eine folge', 'sketch über'])) return 'EPISODE_IDEA';
  if (containsAny(text, ['schlecht', 'langweilig', 'nicht lustig', 'unverständlich', 'nervig', 'boring', 'confusing'])) return 'CRITICISM';
  if (text.includes('?')) return 'QUESTION';
  if (categoryHint) return requireEnum(categoryHint, 'categoryHint', CATEGORIES);
  return 'FAN_REACTION';
}

function triageForCategory(category, text) {
  if (category === 'CRISIS') return { urgency: 'CRITICAL', humanReviewRequired: true, replyPolicy: 'NO_REPLY_ESCALATE', action: 'ESCALATE_IMMEDIATELY' };
  if (category === 'RIGHTS') return { urgency: text.includes('takedown') ? 'CRITICAL' : 'HIGH', humanReviewRequired: true, replyPolicy: 'DRAFT_ONLY', action: 'ROUTE_TO_RIGHTS_REVIEW' };
  if (category === 'COLLAB') return { urgency: 'HIGH', humanReviewRequired: true, replyPolicy: 'DRAFT_ONLY', action: 'ROUTE_TO_COLLAB_REVIEW' };
  if (category === 'CRITICISM') return { urgency: 'NORMAL', humanReviewRequired: true, replyPolicy: 'DRAFT_ONLY', action: 'ROUTE_TO_COMMUNITY_REVIEW' };
  if (category === 'SPAM') return { urgency: 'LOW', humanReviewRequired: false, replyPolicy: 'NO_REPLY', action: 'IGNORE_SHADOW' };
  return { urgency: 'NORMAL', humanReviewRequired: true, replyPolicy: 'DRAFT_ONLY', action: category === 'EPISODE_IDEA' ? 'COUNT_AS_IDEA_SIGNAL' : 'PREPARE_REPLY_DRAFT' };
}

export function normalizeCommunitySignal(input) {
  requireObject(input, 'communitySignal');
  if (input.schemaVersion !== 1) throw new GrowthValidationError('Community signal schemaVersion must be 1');
  const redacted = redactCommunityText(input.text);
  const category = classifyCommunityText(redacted.text, input.categoryHint ?? null);
  const triage = triageForCategory(category, normalizeKey(redacted.text));
  const authorRef = input.authorRef == null ? null : requireString(input.authorRef, 'authorRef');
  if (authorRef && !/^anon_[a-f0-9]{8,64}$/i.test(authorRef)) throw new GrowthValidationError('authorRef must be anonymized');
  return Object.freeze({
    schemaVersion: 1,
    id: requireString(input.id, 'id'),
    tenantId: requireString(input.tenantId, 'tenantId'),
    projectId: requireString(input.projectId, 'projectId'),
    variantId: requireString(input.variantId, 'variantId'),
    platform: requireEnum(input.platform, 'platform', PLATFORMS),
    observedAt: requireTimestamp(input.observedAt, 'observedAt'),
    provenance: requireEnum(input.provenance, 'provenance', PROVENANCE),
    authorRef,
    text: redacted.text,
    privacyFlags: redacted.privacyFlags,
    truncated: redacted.truncated,
    category,
    urgency: triage.urgency,
    humanReviewRequired: triage.humanReviewRequired,
    replyPolicy: triage.replyPolicy,
    action: triage.action,
    topics: stringArray(input.topics, 'topics'),
    characterIds: stringArray(input.characterIds, 'characterIds')
  });
}

export function buildReplyDraft(rawSignal) {
  const signal = normalizeCommunitySignal(rawSignal);
  if (signal.replyPolicy === 'NO_REPLY' || signal.replyPolicy === 'NO_REPLY_ESCALATE') return null;
  const templates = {
    FAN_REACTION: 'Danke, das freut uns. Dein Feedback ist im Community-Brief gelandet.',
    QUESTION: 'Danke für die Frage. Wir prüfen sie und antworten nach redaktioneller Freigabe.',
    EPISODE_IDEA: 'Danke für die Idee. Sie wird als möglicher Episodenimpuls geprüft, ohne automatische Umsetzung.',
    CRITICISM: 'Danke für die Rückmeldung. Wir prüfen den Punkt intern und antworten nach menschlicher Sichtung.',
    RIGHTS: 'Danke für den Hinweis. Der Fall wurde zur Rechteprüfung eskaliert.',
    COLLAB: 'Danke für die Anfrage. Sie wurde zur manuellen Kooperationsprüfung weitergegeben.'
  };
  return Object.freeze({ signalId: signal.id, mode: 'shadow', publishAllowed: false, humanApprovalRequired: true, text: templates[signal.category] });
}

function countValues(signals, field) {
  const counts = new Map();
  for (const signal of signals) for (const value of signal[field]) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.freeze([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => Object.freeze({ value, count })));
}

export function aggregateCommunitySignals(rawSignals) {
  if (!Array.isArray(rawSignals)) throw new GrowthValidationError('Community signals must be an array');
  const signals = rawSignals.map(normalizeCommunitySignal);
  const scopeKeys = new Set(signals.map((signal) => `${signal.tenantId}|${signal.projectId}`));
  if (scopeKeys.size > 1) throw new GrowthValidationError('Community aggregation scope mismatch');
  const categoryCounts = Object.fromEntries(CATEGORIES.map((category) => [category, signals.filter((signal) => signal.category === category).length]));
  const alerts = signals
    .filter((signal) => URGENCY_RANK[signal.urgency] >= URGENCY_RANK.HIGH)
    .map((signal) => Object.freeze({ signalId: signal.id, category: signal.category, urgency: signal.urgency, action: signal.action }))
    .sort((a, b) => URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency] || a.signalId.localeCompare(b.signalId));
  const topics = countValues(signals.filter((signal) => signal.category !== 'SPAM'), 'topics');
  const characters = countValues(signals.filter((signal) => signal.category !== 'SPAM'), 'characterIds');
  const episodeIdeas = topics.filter((item) => item.count >= 2 && signals.some((signal) => signal.category === 'EPISODE_IDEA' && signal.topics.includes(item.value)));
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: SIGNAL_RULE_VERSION,
    signalCount: signals.length,
    categoryCounts: Object.freeze(categoryCounts),
    alerts: Object.freeze(alerts),
    topTopics: topics,
    topCharacters: characters,
    episodeIdeaCandidates: Object.freeze(episodeIdeas),
    replyDraftCount: signals.filter((signal) => signal.replyPolicy === 'DRAFT_ONLY').length,
    publicActionsExecuted: false,
    rawTextsIncluded: false,
    personalProfilesBuilt: false
  });
}

export function normalizeTrendSignal(input) {
  requireObject(input, 'trendSignal');
  if (input.schemaVersion !== 1) throw new GrowthValidationError('Trend signal schemaVersion must be 1');
  const observedAt = requireTimestamp(input.observedAt, 'observedAt');
  const expiresAt = requireTimestamp(input.expiresAt, 'expiresAt');
  if (Date.parse(expiresAt) <= Date.parse(observedAt)) throw new GrowthValidationError('Trend expiresAt must be after observedAt');
  return Object.freeze({
    schemaVersion: 1,
    id: requireString(input.id, 'id'),
    tenantId: requireString(input.tenantId, 'tenantId'),
    projectId: requireString(input.projectId, 'projectId'),
    platform: requireEnum(input.platform, 'platform', PLATFORMS),
    source: requireString(input.source, 'source'),
    topic: normalizeKey(requireString(input.topic, 'topic')),
    observedAt,
    expiresAt,
    provenance: requireEnum(input.provenance, 'provenance', PROVENANCE),
    velocity: requireNumber(input.velocity, 'velocity', { min: 0, max: 100 }),
    brandFit: requireNumber(input.brandFit, 'brandFit', { min: 0, max: 100 }),
    characterFit: requireNumber(input.characterFit, 'characterFit', { min: 0, max: 100 }),
    saturation: requireNumber(input.saturation, 'saturation', { min: 0, max: 100 }),
    rightsRisk: requireNumber(input.rightsRisk, 'rightsRisk', { min: 0, max: 100 }),
    productionEffort: requireNumber(input.productionEffort, 'productionEffort', { min: 0, max: 100 }),
    relatedTopics: stringArray(input.relatedTopics, 'relatedTopics')
  });
}

export function scoreTrendOpportunity(rawTrend, asOf) {
  const trend = normalizeTrendSignal(rawTrend);
  const at = requireTimestamp(asOf, 'asOf');
  const totalLife = Date.parse(trend.expiresAt) - Date.parse(trend.observedAt);
  const remaining = Date.parse(trend.expiresAt) - Date.parse(at);
  const freshness = round(clamp((remaining / totalLife) * 100, 0, 100), 2);
  const score = round(
    trend.velocity * 0.22 + trend.brandFit * 0.25 + trend.characterFit * 0.18 + freshness * 0.15 +
    (100 - trend.saturation) * 0.08 + (100 - trend.rightsRisk) * 0.07 + (100 - trend.productionEffort) * 0.05,
    2
  );
  const reasons = [];
  let decision = 'IGNORE';
  if (remaining <= 0) { decision = 'EXPIRED'; reasons.push('TREND_EXPIRED'); }
  else if (trend.rightsRisk >= 70) { decision = 'REJECT'; reasons.push('RIGHTS_RISK_TOO_HIGH'); }
  else if (trend.brandFit < 50) { decision = 'REJECT'; reasons.push('BRAND_FIT_TOO_LOW'); }
  else if (score >= 70) { decision = 'RECOMMEND_REVIEW'; reasons.push('HIGH_OPPORTUNITY_SCORE'); }
  else if (score >= 55) { decision = 'WATCH'; reasons.push('MEDIUM_OPPORTUNITY_SCORE'); }
  else reasons.push('LOW_OPPORTUNITY_SCORE');
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: SIGNAL_RULE_VERSION,
    trendId: trend.id,
    topic: trend.topic,
    platform: trend.platform,
    score,
    freshness,
    decision,
    reasons: Object.freeze(reasons),
    humanReviewRequired: decision === 'RECOMMEND_REVIEW',
    sourceSignalIds: Object.freeze([trend.id]),
    provenance: trend.provenance
  });
}

export function combineSignalOpportunities(communityAggregate, scoredTrends) {
  requireObject(communityAggregate, 'communityAggregate');
  if (!Array.isArray(scoredTrends)) throw new GrowthValidationError('Scored trends must be an array');
  const topicCounts = new Map((communityAggregate.topTopics ?? []).map((item) => [normalizeKey(item.value), item.count]));
  return Object.freeze(scoredTrends
    .filter((trend) => ['RECOMMEND_REVIEW', 'WATCH'].includes(trend.decision))
    .map((trend) => {
      const demand = topicCounts.get(normalizeKey(trend.topic)) ?? 0;
      const demandBonus = Math.min(demand * 4, 20);
      const score = round(clamp(trend.score + demandBonus, 0, 100), 2);
      return Object.freeze({
        opportunityId: `opp_${hashId({ trendId: trend.trendId, demand, ruleVersion: SIGNAL_RULE_VERSION })}`,
        topic: trend.topic,
        score,
        trendScore: trend.score,
        communityDemand: demand,
        decision: score >= 75 ? 'RECOMMEND_REVIEW' : 'WATCH',
        humanReviewRequired: true,
        reasons: Object.freeze([...trend.reasons, ...(demand ? ['COMMUNITY_DEMAND_MATCH'] : [])].sort()),
        sourceSignalIds: trend.sourceSignalIds
      });
    })
    .sort((a, b) => b.score - a.score || a.opportunityId.localeCompare(b.opportunityId)));
}

export function buildSignalDirectionPackage(opportunity, { tenantId, projectId, occurredAt, actor = 'signal-radar' }) {
  requireObject(opportunity, 'opportunity');
  requireString(tenantId, 'tenantId');
  requireString(projectId, 'projectId');
  requireTimestamp(occurredAt, 'occurredAt');
  if (opportunity.decision !== 'RECOMMEND_REVIEW' || opportunity.score < 75) return Object.freeze([]);
  const seed = hashId({ opportunityId: opportunity.opportunityId, score: opportunity.score, ruleVersion: SIGNAL_RULE_VERSION });
  const hypothesisId = `hyp_signal_${seed}`;
  const briefId = `brief_signal_${seed}`;
  return Object.freeze([
    Object.freeze({
      schemaVersion: 1,
      id: `evt_${hypothesisId}`,
      tenantId,
      projectId,
      stream: `hypothesis:${hypothesisId}`,
      sequence: 1,
      type: 'HYPOTHESIS_REGISTERED',
      occurredAt,
      actor,
      mode: 'shadow',
      payload: Object.freeze({
        hypothesisId,
        statement: `Community demand and trend opportunity overlap for topic: ${opportunity.topic}.`,
        confidence: round(clamp(0.45 + opportunity.score / 200, 0, 0.95), 2),
        status: 'TESTING'
      })
    }),
    Object.freeze({
      schemaVersion: 1,
      id: `evt_${briefId}`,
      tenantId,
      projectId,
      stream: `brief:${briefId}`,
      sequence: 1,
      type: 'PRODUCTION_BRIEF_REGISTERED',
      occurredAt,
      actor,
      mode: 'shadow',
      payload: Object.freeze({
        productionBriefId: briefId,
        sourceAnalysisId: opportunity.opportunityId,
        priority: opportunity.score >= 90 ? 'CRITICAL' : 'HIGH',
        recommendations: Object.freeze([
          `REVIEW_TOPIC_${opportunity.topic.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
          'VERIFY_RIGHTS_AND_BRAND_FIT',
          'NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL',
          'NO_PUBLIC_ACTION_WITHOUT_HUMAN_APPROVAL'
        ].sort())
      })
    })
  ]);
}

export function buildDailySignalBrief({ communityAggregate, opportunities, asOf }) {
  requireObject(communityAggregate, 'communityAggregate');
  if (!Array.isArray(opportunities)) throw new GrowthValidationError('Opportunities must be an array');
  requireTimestamp(asOf, 'asOf');
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: SIGNAL_RULE_VERSION,
    asOf,
    community: Object.freeze({
      signalCount: communityAggregate.signalCount,
      highPriorityAlerts: communityAggregate.alerts.filter((alert) => URGENCY_RANK[alert.urgency] >= URGENCY_RANK.HIGH),
      episodeIdeaCandidates: communityAggregate.episodeIdeaCandidates,
      topTopics: communityAggregate.topTopics.slice(0, 5),
      topCharacters: communityAggregate.topCharacters.slice(0, 5)
    }),
    opportunities: Object.freeze(opportunities.slice(0, 5)),
    publicActionsExecuted: false,
    replyMode: 'DRAFT_ONLY',
    provenance: 'synthetic_or_authorized_input_only'
  });
}
