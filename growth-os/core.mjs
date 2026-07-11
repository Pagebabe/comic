import { createHash } from 'node:crypto';

export const SHADOW_MODE = 'shadow';
export const LIVE_ACTIONS = new Set(['live_publish', 'live_reply', 'live_delete', 'live_dm']);

export const JOB_TRANSITIONS = Object.freeze({
  DRAFT: ['POLICY_CHECK', 'CANCELLED'],
  POLICY_CHECK: ['WAITING_HUMAN', 'APPROVED_SHADOW', 'CANCELLED'],
  WAITING_HUMAN: ['APPROVED_SHADOW', 'CANCELLED'],
  APPROVED_SHADOW: ['SIMULATED', 'FAILED', 'CANCELLED'],
  SIMULATED: [],
  FAILED: [],
  CANCELLED: []
});

const PLATFORM_SPECS = Object.freeze({
  tiktok: { aspectRatio: '9:16', maxDurationSeconds: 60, captionLimit: 2200 },
  instagram_reels: { aspectRatio: '9:16', maxDurationSeconds: 90, captionLimit: 2200 },
  youtube_shorts: { aspectRatio: '9:16', maxDurationSeconds: 60, captionLimit: 100 }
});

export class GrowthValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'GrowthValidationError';
    this.details = details;
  }
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GrowthValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireFiniteNumber(value, field, { min = 0 } = {}) {
  if (!Number.isFinite(value) || value < min) {
    throw new GrowthValidationError(`Missing or invalid number: ${field}`, { field, value });
  }
  return value;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function validateEpisodePackage(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new GrowthValidationError('EpisodePackage must be an object');
  }
  if (input.schemaVersion !== 1) {
    throw new GrowthValidationError('EpisodePackage schemaVersion must be 1', { schemaVersion: input.schemaVersion });
  }

  const durationSeconds = requireFiniteNumber(input.durationSeconds, 'durationSeconds', { min: 1 });
  if (durationSeconds > 600) {
    throw new GrowthValidationError('durationSeconds exceeds the MKT0 contract', { durationSeconds });
  }

  const contentTags = Array.isArray(input.contentTags)
    ? [...new Set(input.contentTags.map((tag) => requireString(tag, 'contentTags[]').toLowerCase()))].sort()
    : [];
  const characters = Array.isArray(input.characters)
    ? [...new Set(input.characters.map((character) => requireString(character, 'characters[]')))].sort()
    : [];

  const sourceKind = requireString(input.source?.kind, 'source.kind');
  if (!['synthetic_fixture', 'studio_export'].includes(sourceKind)) {
    throw new GrowthValidationError('Unsupported source.kind', { sourceKind });
  }

  const approvalStatus = requireString(input.approval?.status, 'approval.status');
  const allowedApprovalStatuses = sourceKind === 'synthetic_fixture'
    ? ['APPROVED_FOR_SHADOW_DEMO']
    : ['PRODUCTION_APPROVED'];
  if (!allowedApprovalStatuses.includes(approvalStatus)) {
    throw new GrowthValidationError('Approval status does not match source kind', { sourceKind, approvalStatus });
  }

  const musicStatus = requireString(input.rights?.musicStatus, 'rights.musicStatus');
  if (!['cleared', 'not_used', 'unknown'].includes(musicStatus)) {
    throw new GrowthValidationError('Unsupported rights.musicStatus', { musicStatus });
  }

  return Object.freeze({
    schemaVersion: 1,
    id: requireString(input.id, 'id'),
    projectId: requireString(input.projectId, 'projectId'),
    seriesId: requireString(input.seriesId, 'seriesId'),
    episodeId: requireString(input.episodeId, 'episodeId'),
    title: requireString(input.title, 'title'),
    durationSeconds,
    source: Object.freeze({
      kind: sourceKind,
      synthetic: sourceKind === 'synthetic_fixture',
      sourceRef: requireString(input.source?.sourceRef, 'source.sourceRef')
    }),
    assets: Object.freeze({
      masterVideo: requireString(input.assets?.masterVideo, 'assets.masterVideo'),
      subtitles: input.assets?.subtitles ? requireString(input.assets.subtitles, 'assets.subtitles') : null
    }),
    rights: Object.freeze({ musicStatus }),
    approval: Object.freeze({
      status: approvalStatus,
      approvedBy: requireString(input.approval?.approvedBy, 'approval.approvedBy'),
      approvedAt: requireString(input.approval?.approvedAt, 'approval.approvedAt')
    }),
    contentTags: Object.freeze(contentTags),
    characters: Object.freeze(characters)
  });
}

export function planSocialVariants(episodePackage, platforms = Object.keys(PLATFORM_SPECS)) {
  const episode = validateEpisodePackage(episodePackage);
  const uniquePlatforms = [...new Set(platforms)].sort();
  return uniquePlatforms.map((platform) => {
    const spec = PLATFORM_SPECS[platform];
    if (!spec) throw new GrowthValidationError('Unsupported platform', { platform });
    return Object.freeze({
      id: `${episode.id}:${platform}:v1`,
      episodePackageId: episode.id,
      platform,
      mode: SHADOW_MODE,
      version: 1,
      aspectRatio: spec.aspectRatio,
      targetDurationSeconds: Math.min(episode.durationSeconds, spec.maxDurationSeconds),
      captionLimit: spec.captionLimit,
      sourceAsset: episode.assets.masterVideo,
      renderRequired: episode.durationSeconds > spec.maxDurationSeconds,
      status: 'PLANNED'
    });
  });
}

export function evaluatePolicy({ episodePackage, variant, requestedAction = 'shadow_simulate' }) {
  const episode = validateEpisodePackage(episodePackage);
  if (!variant || variant.episodePackageId !== episode.id) {
    throw new GrowthValidationError('Variant does not belong to EpisodePackage');
  }

  const reasons = [];
  if (LIVE_ACTIONS.has(requestedAction)) {
    return Object.freeze({ decision: 'DENY', reasons: ['MKT0_LIVE_ACTIONS_DISABLED'], requestedAction });
  }
  if (requestedAction !== 'shadow_simulate') {
    return Object.freeze({ decision: 'DENY', reasons: ['UNSUPPORTED_ACTION'], requestedAction });
  }
  if (episode.rights.musicStatus === 'unknown') reasons.push('RIGHTS_REVIEW_REQUIRED');
  if (episode.contentTags.some((tag) => ['politics', 'medical', 'legal', 'minor', 'crisis'].includes(tag))) {
    reasons.push('SENSITIVE_CONTENT_REVIEW_REQUIRED');
  }
  if (episode.source.synthetic) reasons.push('SYNTHETIC_FIXTURE_NO_PUBLIC_ACTION');

  if (reasons.includes('RIGHTS_REVIEW_REQUIRED') || reasons.includes('SENSITIVE_CONTENT_REVIEW_REQUIRED')) {
    return Object.freeze({ decision: 'REQUIRE_HUMAN', reasons, requestedAction });
  }
  return Object.freeze({ decision: 'ALLOW_SHADOW', reasons, requestedAction });
}

export function createPublishJob(variant, createdAt) {
  requireString(createdAt, 'createdAt');
  return Object.freeze({
    id: `job:${variant.id}`,
    variantId: variant.id,
    platform: variant.platform,
    mode: SHADOW_MODE,
    state: 'DRAFT',
    revision: 0,
    createdAt,
    updatedAt: createdAt,
    history: Object.freeze([{ from: null, to: 'DRAFT', at: createdAt, reason: 'JOB_CREATED' }])
  });
}

export function transitionPublishJob(job, nextState, at, reason) {
  requireString(at, 'at');
  requireString(reason, 'reason');
  const allowed = JOB_TRANSITIONS[job.state] ?? [];
  if (!allowed.includes(nextState)) {
    throw new GrowthValidationError('Invalid publish job transition', {
      jobId: job.id,
      from: job.state,
      to: nextState,
      allowed
    });
  }
  return Object.freeze({
    ...job,
    state: nextState,
    revision: job.revision + 1,
    updatedAt: at,
    history: Object.freeze([...job.history, { from: job.state, to: nextState, at, reason }])
  });
}

function safeRatio(value, baseline, fallback = 0) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline <= 0) return fallback;
  return value / baseline;
}

function rate(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return numerator / denominator;
}

export function analyzeGrowth(raw, baseline, context = {}) {
  const views = requireFiniteNumber(raw.views, 'metrics.views');
  const durationSeconds = requireFiniteNumber(context.durationSeconds, 'context.durationSeconds', { min: 1 });
  const productionHours = requireFiniteNumber(raw.productionHours, 'metrics.productionHours', { min: 0.01 });

  const actual = {
    holdRate3s: clamp(requireFiniteNumber(raw.holdRate3s, 'metrics.holdRate3s'), 0, 1),
    completionRate: clamp(requireFiniteNumber(raw.completionRate, 'metrics.completionRate'), 0, 1),
    shareRate: rate(raw.shares, views),
    saveRate: rate(raw.saves, views),
    commentRate: rate(raw.comments, views),
    followerConversionRate: rate(raw.followersGained, raw.profileVisits || views),
    watchRatio: clamp(rate(raw.averageWatchSeconds, durationSeconds), 0, 3),
    productionEfficiency: views / productionHours
  };

  const expected = {
    holdRate3s: requireFiniteNumber(baseline.holdRate3s, 'baseline.holdRate3s', { min: 0.000001 }),
    completionRate: requireFiniteNumber(baseline.completionRate, 'baseline.completionRate', { min: 0.000001 }),
    shareRate: requireFiniteNumber(baseline.shareRate, 'baseline.shareRate', { min: 0.000001 }),
    saveRate: requireFiniteNumber(baseline.saveRate, 'baseline.saveRate', { min: 0.000001 }),
    commentRate: requireFiniteNumber(baseline.commentRate, 'baseline.commentRate', { min: 0.000001 }),
    followerConversionRate: requireFiniteNumber(baseline.followerConversionRate, 'baseline.followerConversionRate', { min: 0.000001 }),
    watchRatio: requireFiniteNumber(baseline.watchRatio, 'baseline.watchRatio', { min: 0.000001 }),
    productionEfficiency: requireFiniteNumber(baseline.productionEfficiency, 'baseline.productionEfficiency', { min: 0.000001 })
  };

  const indices = Object.fromEntries(Object.entries(actual).map(([key, value]) => [
    key,
    round(clamp(safeRatio(value, expected[key]) * 100, 0, 300))
  ]));

  const score = round(
    indices.holdRate3s * 0.2 +
    indices.completionRate * 0.2 +
    indices.shareRate * 0.2 +
    indices.followerConversionRate * 0.15 +
    indices.watchRatio * 0.1 +
    indices.saveRate * 0.05 +
    indices.commentRate * 0.05 +
    indices.productionEfficiency * 0.05
  );

  const classification = score >= 150 ? 'OUTLIER' : score >= 120 ? 'WINNER' : score >= 85 ? 'BASELINE' : 'UNDERPERFORMER';
  const diagnostics = [];
  const actions = [];

  if (indices.holdRate3s < 80 && indices.completionRate >= 100) {
    diagnostics.push('WEAK_HOOK_STRONG_BODY');
    actions.push('TEST_NEW_HOOK');
  }
  if (indices.holdRate3s >= 110 && indices.completionRate < 80) {
    diagnostics.push('STRONG_HOOK_WEAK_BODY');
    actions.push('SHORTEN_MIDDLE_AND_DELIVER_PAYOFF_EARLIER');
  }
  if (indices.shareRate >= 130) actions.push('CREATE_FOLLOW_UP');
  if (indices.followerConversionRate < 80 && indices.shareRate >= 110) actions.push('STRENGTHEN_SERIES_AND_CHARACTER_SIGNAL');
  if (classification === 'UNDERPERFORMER' && actions.length === 0) actions.push('PAUSE_AND_REVIEW_FORMAT');
  if (classification === 'OUTLIER') actions.push('PREPARE_CROSS_PLATFORM_AND_LANGUAGE_TEST');

  return Object.freeze({
    schemaVersion: 1,
    score,
    classification,
    actual: Object.freeze(Object.fromEntries(Object.entries(actual).map(([key, value]) => [key, round(value, 6)]))),
    baseline: Object.freeze(expected),
    indices: Object.freeze(indices),
    diagnostics: Object.freeze([...new Set(diagnostics)]),
    recommendedActions: Object.freeze([...new Set(actions)])
  });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function appendAuditEvent(chain, event) {
  if (!Array.isArray(chain)) throw new GrowthValidationError('Audit chain must be an array');
  const previousHash = chain.length === 0 ? '0'.repeat(64) : chain.at(-1).hash;
  const record = {
    sequence: chain.length + 1,
    timestamp: requireString(event.timestamp, 'event.timestamp'),
    type: requireString(event.type, 'event.type'),
    actor: requireString(event.actor, 'event.actor'),
    previousHash,
    data: event.data ?? {}
  };
  const hash = createHash('sha256').update(canonicalJson(record)).digest('hex');
  return Object.freeze([...chain, Object.freeze({ ...record, hash })]);
}

export function verifyAuditChain(chain) {
  if (!Array.isArray(chain)) return false;
  let previousHash = '0'.repeat(64);
  for (let index = 0; index < chain.length; index += 1) {
    const entry = chain[index];
    if (entry.sequence !== index + 1 || entry.previousHash !== previousHash) return false;
    const { hash, ...record } = entry;
    const expectedHash = createHash('sha256').update(canonicalJson(record)).digest('hex');
    if (hash !== expectedHash) return false;
    previousHash = hash;
  }
  return true;
}

export function buildProductionBrief({ episode, analysis, generatedAt }) {
  return Object.freeze({
    schemaVersion: 1,
    id: `brief:${episode.id}:${analysis.classification.toLowerCase()}`,
    episodePackageId: episode.id,
    generatedAt,
    source: 'MKT0_SHADOW_ANALYSIS',
    confidence: analysis.classification === 'OUTLIER' ? 0.8 : analysis.classification === 'WINNER' ? 0.7 : 0.55,
    priority: ['OUTLIER', 'WINNER'].includes(analysis.classification) ? 'high' : 'normal',
    recommendations: analysis.recommendedActions,
    constraints: Object.freeze([
      'NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL',
      'NO_LIVE_PUBLISHING_FROM_MKT0_CORE',
      'SYNTHETIC_DATA_IS_NOT_REAL_PLATFORM_EVIDENCE'
    ])
  });
}

export function runShadowPipeline({ episodePackage, metrics, baseline, timestamp }) {
  const episode = validateEpisodePackage(episodePackage);
  const variants = planSocialVariants(episode);
  let audit = [];
  audit = appendAuditEvent(audit, {
    timestamp,
    type: 'EPISODE_PACKAGE_VALIDATED',
    actor: 'growth-os-core',
    data: { episodePackageId: episode.id, sourceKind: episode.source.kind }
  });

  const jobs = variants.map((variant) => {
    const policy = evaluatePolicy({ episodePackage: episode, variant, requestedAction: 'shadow_simulate' });
    let job = createPublishJob(variant, timestamp);
    job = transitionPublishJob(job, 'POLICY_CHECK', timestamp, 'POLICY_EVALUATION_STARTED');
    if (policy.decision === 'ALLOW_SHADOW') {
      job = transitionPublishJob(job, 'APPROVED_SHADOW', timestamp, 'POLICY_ALLOWED_SHADOW');
      job = transitionPublishJob(job, 'SIMULATED', timestamp, 'OFFLINE_SIMULATION_COMPLETED');
    } else if (policy.decision === 'REQUIRE_HUMAN') {
      job = transitionPublishJob(job, 'WAITING_HUMAN', timestamp, policy.reasons.join(','));
    } else {
      job = transitionPublishJob(job, 'CANCELLED', timestamp, policy.reasons.join(','));
    }
    audit = appendAuditEvent(audit, {
      timestamp,
      type: 'PUBLISH_JOB_TERMINAL_SHADOW_STATE',
      actor: 'growth-os-core',
      data: { jobId: job.id, platform: job.platform, state: job.state, policy }
    });
    return Object.freeze({ job, policy });
  });

  const analysis = analyzeGrowth(metrics, baseline, { durationSeconds: episode.durationSeconds });
  audit = appendAuditEvent(audit, {
    timestamp,
    type: 'GROWTH_ANALYSIS_CREATED',
    actor: 'growth-os-core',
    data: { episodePackageId: episode.id, score: analysis.score, classification: analysis.classification }
  });

  const productionBrief = buildProductionBrief({ episode, analysis, generatedAt: timestamp });
  audit = appendAuditEvent(audit, {
    timestamp,
    type: 'PRODUCTION_BRIEF_CREATED',
    actor: 'growth-os-core',
    data: { productionBriefId: productionBrief.id, recommendations: productionBrief.recommendations }
  });

  return Object.freeze({
    schemaVersion: 1,
    mode: SHADOW_MODE,
    episode,
    variants: Object.freeze(variants),
    jobs: Object.freeze(jobs),
    analysis,
    productionBrief,
    audit,
    auditValid: verifyAuditChain(audit),
    liveActionsExecuted: false
  });
}
