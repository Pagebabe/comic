import { createHash } from 'node:crypto';
import { GrowthValidationError } from './core.mjs';

export const GROWTH_RULE_VERSION = 'mkt0-003.v1';

const PLATFORMS = ['tiktok', 'instagram_reels', 'youtube_shorts'];
const FORMATS = ['sketch', 'reaction', 'carousel_video', 'behind_the_scenes', 'compilation'];
const WEIGHTS = Object.freeze({
  holdRate3s: 0.18,
  completionRate: 0.18,
  shareRate: 0.18,
  followerConversionRate: 0.14,
  watchRatio: 0.1,
  rewatchRate: 0.08,
  saveRate: 0.05,
  commentRate: 0.04,
  productionEfficiency: 0.05
});

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new GrowthValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GrowthValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireNumber(value, field, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new GrowthValidationError(`Missing or invalid number: ${field}`, { field, value });
  }
  return value;
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!Number.isFinite(Date.parse(text)) || !text.includes('T')) {
    throw new GrowthValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return text;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) throw new GrowthValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  return text;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function safeRate(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function median(values) {
  if (!Array.isArray(values) || values.length === 0) throw new GrowthValidationError('Median requires values');
  const sorted = values.map((value) => requireNumber(value, 'median[]', { min: Number.NEGATIVE_INFINITY })).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function percentile(values, fraction) {
  if (!Array.isArray(values) || values.length === 0) throw new GrowthValidationError('Percentile requires values');
  requireNumber(fraction, 'fraction', { min: 0, max: 1 });
  const sorted = values.map((value) => requireNumber(value, 'percentile[]', { min: Number.NEGATIVE_INFINITY })).sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function durationBucket(durationSeconds) {
  requireNumber(durationSeconds, 'durationSeconds', { min: 1, max: 600 });
  if (durationSeconds <= 15) return '00-15';
  if (durationSeconds <= 30) return '16-30';
  if (durationSeconds <= 60) return '31-60';
  return '61-600';
}

export function validatePerformanceSnapshot(input) {
  requireObject(input, 'snapshot');
  const snapshot = {
    schemaVersion: input.schemaVersion,
    id: requireString(input.id, 'id'),
    tenantId: requireString(input.tenantId, 'tenantId'),
    projectId: requireString(input.projectId, 'projectId'),
    variantId: requireString(input.variantId, 'variantId'),
    platform: requireEnum(input.platform, 'platform', PLATFORMS),
    format: requireEnum(input.format, 'format', FORMATS),
    seriesId: requireString(input.seriesId, 'seriesId'),
    characterIds: Object.freeze([...new Set((input.characterIds ?? []).map((item) => requireString(item, 'characterIds[]')))].sort()),
    publishedAt: requireTimestamp(input.publishedAt, 'publishedAt'),
    capturedAt: requireTimestamp(input.capturedAt, 'capturedAt'),
    durationSeconds: requireNumber(input.durationSeconds, 'durationSeconds', { min: 1, max: 600 }),
    views: requireNumber(input.views, 'views'),
    starts: requireNumber(input.starts, 'starts'),
    viewersAfter3s: requireNumber(input.viewersAfter3s, 'viewersAfter3s'),
    completions: requireNumber(input.completions, 'completions'),
    shares: requireNumber(input.shares, 'shares'),
    saves: requireNumber(input.saves, 'saves'),
    comments: requireNumber(input.comments, 'comments'),
    profileVisits: requireNumber(input.profileVisits, 'profileVisits'),
    followersGained: requireNumber(input.followersGained, 'followersGained'),
    averageWatchSeconds: requireNumber(input.averageWatchSeconds, 'averageWatchSeconds'),
    rewatches: requireNumber(input.rewatches, 'rewatches'),
    productionHours: requireNumber(input.productionHours, 'productionHours', { min: 0.01 }),
    provenance: requireEnum(input.provenance, 'provenance', ['synthetic_fixture', 'authorized_platform_import'])
  };
  if (snapshot.schemaVersion !== 1) throw new GrowthValidationError('Snapshot schemaVersion must be 1');
  return Object.freeze(snapshot);
}

export function inspectDataQuality(raw) {
  const snapshot = validatePerformanceSnapshot(raw);
  const warnings = [];
  const critical = [];
  if (snapshot.starts === 0) critical.push('ZERO_STARTS');
  if (snapshot.views === 0) critical.push('ZERO_VIEWS');
  if (snapshot.viewersAfter3s > snapshot.starts) warnings.push('VIEWERS_AFTER_3S_EXCEED_STARTS');
  if (snapshot.completions > snapshot.starts * 1.25) warnings.push('COMPLETIONS_EXCEED_REASONABLE_STARTS');
  if (snapshot.averageWatchSeconds > snapshot.durationSeconds * 3) warnings.push('AVERAGE_WATCH_EXCEEDS_3X_DURATION');
  if (Date.parse(snapshot.capturedAt) < Date.parse(snapshot.publishedAt)) critical.push('CAPTURE_BEFORE_PUBLICATION');
  if (snapshot.provenance === 'synthetic_fixture') warnings.push('SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM');
  return Object.freeze({ status: critical.length ? 'HOLD' : 'USABLE', warnings: Object.freeze(warnings.sort()), critical: Object.freeze(critical.sort()) });
}

export function derivePerformanceMetrics(raw) {
  const snapshot = validatePerformanceSnapshot(raw);
  return Object.freeze({
    holdRate3s: round(safeRate(snapshot.viewersAfter3s, snapshot.starts), 6),
    completionRate: round(safeRate(snapshot.completions, snapshot.starts), 6),
    shareRate: round(safeRate(snapshot.shares, snapshot.views), 6),
    saveRate: round(safeRate(snapshot.saves, snapshot.views), 6),
    commentRate: round(safeRate(snapshot.comments, snapshot.views), 6),
    followerConversionRate: round(safeRate(snapshot.followersGained, snapshot.profileVisits || snapshot.views), 6),
    watchRatio: round(safeRate(snapshot.averageWatchSeconds, snapshot.durationSeconds), 6),
    rewatchRate: round(safeRate(snapshot.rewatches, snapshot.views), 6),
    productionEfficiency: round(safeRate(snapshot.views, snapshot.productionHours), 6)
  });
}

export function comparisonSegment(raw) {
  const snapshot = validatePerformanceSnapshot(raw);
  return `${snapshot.platform}|${snapshot.format}|${durationBucket(snapshot.durationSeconds)}`;
}

function baselineFrom(items, scope) {
  const metrics = items.map(derivePerformanceMetrics);
  const baselineMetrics = {};
  for (const key of Object.keys(WEIGHTS)) baselineMetrics[key] = round(median(metrics.map((item) => item[key])), 6);
  return Object.freeze({
    status: 'READY',
    scope,
    sampleSize: items.length,
    metrics: Object.freeze(baselineMetrics),
    viewMedian: round(median(items.map((item) => item.views)), 4),
    viewP90: round(percentile(items.map((item) => item.views), 0.9), 4),
    warnings: Object.freeze([])
  });
}

export function buildRobustBaseline(historyRaw, targetRaw, { minimumSamples = 5 } = {}) {
  if (!Array.isArray(historyRaw)) throw new GrowthValidationError('History must be an array');
  const target = validatePerformanceSnapshot(targetRaw);
  const history = historyRaw.map(validatePerformanceSnapshot).filter((item) => item.id !== target.id);
  const exactKey = comparisonSegment(target);
  const exact = history.filter((item) => comparisonSegment(item) === exactKey);
  if (exact.length >= minimumSamples) return baselineFrom(exact, 'EXACT_SEGMENT');
  const platform = history.filter((item) => item.platform === target.platform);
  if (platform.length >= minimumSamples) {
    const baseline = baselineFrom(platform, 'PLATFORM_FALLBACK');
    return Object.freeze({ ...baseline, warnings: Object.freeze(['EXACT_SEGMENT_INSUFFICIENT']) });
  }
  if (history.length >= minimumSamples) {
    const baseline = baselineFrom(history, 'GLOBAL_FALLBACK');
    return Object.freeze({ ...baseline, warnings: Object.freeze(['EXACT_SEGMENT_INSUFFICIENT', 'PLATFORM_SAMPLE_INSUFFICIENT']) });
  }
  return Object.freeze({
    status: 'INSUFFICIENT_DATA',
    scope: 'NONE',
    sampleSize: history.length,
    metrics: null,
    viewMedian: null,
    viewP90: null,
    warnings: Object.freeze(['INSUFFICIENT_BASELINE'])
  });
}

function calculateIndices(actual, baseline) {
  const indices = {};
  const warnings = [];
  for (const key of Object.keys(WEIGHTS)) {
    const expected = baseline[key];
    if (!Number.isFinite(expected) || expected <= 0) {
      indices[key] = null;
      warnings.push(`ZERO_OR_INVALID_BASELINE_${key.toUpperCase()}`);
    } else {
      indices[key] = round(clamp((actual[key] / expected) * 100, 0, 300), 2);
    }
  }
  return { indices: Object.freeze(indices), warnings };
}

function weightedScore(indices) {
  let weighted = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    if (Number.isFinite(indices[key])) {
      weighted += indices[key] * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? round(weighted / totalWeight, 2) : null;
}

function classification(score) {
  if (!Number.isFinite(score)) return 'INSUFFICIENT_DATA';
  if (score >= 150) return 'OUTLIER';
  if (score >= 120) return 'WINNER';
  if (score >= 85) return 'BASELINE';
  return 'UNDERPERFORMER';
}

function anomalyFlags(snapshot, baseline) {
  if (!baseline || !Number.isFinite(baseline.viewMedian) || baseline.viewMedian <= 0) return [];
  const ratio = snapshot.views / baseline.viewMedian;
  const flags = [];
  if (ratio >= 3) flags.push('HIGH_VIEW_OUTLIER');
  if (ratio <= 0.25) flags.push('LOW_VIEW_OUTLIER');
  if (snapshot.views > baseline.viewP90 * 1.5) flags.push('ABOVE_P90_EXTREME');
  return flags;
}

function recommendationRules({ indices, classification: resultClass, quality, anomalies }) {
  const recommendations = [];
  const add = (code, priority, ruleId, reason) => recommendations.push(Object.freeze({ code, priority, ruleId, reason }));
  if (quality.status === 'HOLD') add('HOLD_DECISION_AND_REPAIR_DATA', 'CRITICAL', 'R-DQ-001', quality.critical.join(','));
  if (Number.isFinite(indices.holdRate3s) && Number.isFinite(indices.completionRate) && indices.holdRate3s < 80 && indices.completionRate >= 100) {
    add('TEST_NEW_HOOK', 'HIGH', 'R-HOOK-001', 'Hold rate is weak while completion remains healthy.');
  }
  if (Number.isFinite(indices.holdRate3s) && Number.isFinite(indices.completionRate) && indices.holdRate3s >= 110 && indices.completionRate < 80) {
    add('SHORTEN_MIDDLE_AND_DELIVER_PAYOFF_EARLIER', 'HIGH', 'R-BODY-001', 'Opening attracts viewers but the body loses them.');
  }
  if (Number.isFinite(indices.shareRate) && indices.shareRate >= 130) add('CREATE_FOLLOW_UP', 'HIGH', 'R-SHARE-001', 'Share rate is materially above baseline.');
  if (Number.isFinite(indices.followerConversionRate) && Number.isFinite(indices.shareRate) && indices.followerConversionRate < 80 && indices.shareRate >= 110) {
    add('STRENGTHEN_SERIES_AND_CHARACTER_SIGNAL', 'NORMAL', 'R-CONVERT-001', 'People share the post but do not convert into followers.');
  }
  if (resultClass === 'OUTLIER') add('PREPARE_CROSS_PLATFORM_AND_LANGUAGE_TEST', 'HIGH', 'R-OUTLIER-001', 'Composite score is an outlier.');
  if (resultClass === 'UNDERPERFORMER') add('PAUSE_AND_REVIEW_FORMAT', 'NORMAL', 'R-LOW-001', 'Composite score is below the comparison baseline.');
  if (anomalies.includes('HIGH_VIEW_OUTLIER')) add('VERIFY_TRAFFIC_SOURCE_BEFORE_SCALING', 'HIGH', 'R-ANOMALY-001', 'Views exceed the robust median by at least three times.');
  return Object.freeze(recommendations.sort((a, b) => a.code.localeCompare(b.code)));
}

export function analyzePerformanceSnapshot(targetRaw, historyRaw, options = {}) {
  const snapshot = validatePerformanceSnapshot(targetRaw);
  const quality = inspectDataQuality(snapshot);
  const baseline = buildRobustBaseline(historyRaw, snapshot, options);
  const actual = derivePerformanceMetrics(snapshot);
  if (quality.status === 'HOLD' || baseline.status !== 'READY') {
    return Object.freeze({
      schemaVersion: 1,
      ruleVersion: GROWTH_RULE_VERSION,
      snapshotId: snapshot.id,
      capturedAt: snapshot.capturedAt,
      variantId: snapshot.variantId,
      seriesId: snapshot.seriesId,
      platform: snapshot.platform,
      segment: comparisonSegment(snapshot),
      status: 'HOLD',
      score: null,
      classification: 'INSUFFICIENT_DATA',
      quality,
      baseline,
      actual,
      indices: Object.freeze({}),
      anomalies: Object.freeze([]),
      recommendations: recommendationRules({ indices: {}, classification: 'INSUFFICIENT_DATA', quality, anomalies: [] })
    });
  }
  const calculated = calculateIndices(actual, baseline.metrics);
  const score = weightedScore(calculated.indices);
  const resultClass = classification(score);
  const anomalies = Object.freeze(anomalyFlags(snapshot, baseline).sort());
  const warnings = Object.freeze([...new Set([...quality.warnings, ...baseline.warnings, ...calculated.warnings])].sort());
  const effectiveQuality = Object.freeze({ ...quality, warnings });
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: GROWTH_RULE_VERSION,
    snapshotId: snapshot.id,
    capturedAt: snapshot.capturedAt,
    variantId: snapshot.variantId,
    seriesId: snapshot.seriesId,
    platform: snapshot.platform,
    segment: comparisonSegment(snapshot),
    status: 'ANALYZED',
    score,
    classification: resultClass,
    quality: effectiveQuality,
    baseline,
    actual,
    indices: calculated.indices,
    anomalies,
    recommendations: recommendationRules({ indices: calculated.indices, classification: resultClass, quality: effectiveQuality, anomalies })
  });
}

export function analyzeMomentum(analysesRaw, seriesId) {
  const analyses = analysesRaw
    .filter((item) => item.seriesId === seriesId && Number.isFinite(item.score) && item.capturedAt)
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
  if (analyses.length < 6) return Object.freeze({ seriesId, status: 'INSUFFICIENT_DATA', sampleSize: analyses.length, delta: null, saturation: false });
  const split = Math.floor(analyses.length / 2);
  const earlier = median(analyses.slice(0, split).map((item) => item.score));
  const recent = median(analyses.slice(split).map((item) => item.score));
  const delta = round(recent - earlier, 2);
  const status = delta > 15 ? 'GROWING' : delta < -15 ? 'DECLINING' : 'STABLE';
  const lastThree = analyses.slice(-3).map((item) => item.score);
  const saturation = status === 'DECLINING' && lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2] && recent < earlier * 0.85;
  return Object.freeze({ seriesId, status, sampleSize: analyses.length, earlierMedian: round(earlier, 2), recentMedian: round(recent, 2), delta, saturation });
}

function hashId(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}

export function buildDirectionPackage(analysis, { tenantId, projectId, occurredAt, actor = 'growth-radar' }) {
  requireObject(analysis, 'analysis');
  requireString(tenantId, 'tenantId');
  requireString(projectId, 'projectId');
  requireTimestamp(occurredAt, 'occurredAt');
  if (analysis.status !== 'ANALYZED' || !analysis.recommendations.length) return Object.freeze([]);
  const seed = hashId({ snapshotId: analysis.snapshotId, ruleVersion: analysis.ruleVersion, recommendations: analysis.recommendations });
  const hypothesisId = `hyp_${seed}`;
  const briefId = `brief_${seed}`;
  const statement = analysis.classification === 'OUTLIER'
    ? `The format behind ${analysis.snapshotId} is materially above its robust comparison baseline.`
    : `The measurable pattern behind ${analysis.snapshotId} requires a controlled follow-up test.`;
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
      payload: Object.freeze({ hypothesisId, statement, confidence: analysis.classification === 'OUTLIER' ? 0.75 : 0.55, status: 'TESTING' })
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
        sourceAnalysisId: analysis.snapshotId,
        priority: ['OUTLIER', 'WINNER'].includes(analysis.classification) ? 'HIGH' : 'NORMAL',
        recommendations: Object.freeze([...new Set([...analysis.recommendations.map((item) => item.code), 'NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL'])].sort())
      })
    })
  ]);
}

export function buildDailyGrowthBrief(analysesRaw, asOf) {
  requireTimestamp(asOf, 'asOf');
  if (!Array.isArray(analysesRaw)) throw new GrowthValidationError('Analyses must be an array');
  const analyses = analysesRaw.map((item) => requireObject(item, 'analysis'));
  const ranked = analyses.filter((item) => Number.isFinite(item.score)).sort((a, b) => b.score - a.score || a.snapshotId.localeCompare(b.snapshotId));
  const holds = analyses.filter((item) => item.status === 'HOLD').map((item) => item.snapshotId).sort();
  const alerts = [...new Set(analyses.flatMap((item) => [...(item.quality?.critical ?? []), ...(item.anomalies ?? [])]))].sort();
  const recommendations = [...new Set(analyses.flatMap((item) => (item.recommendations ?? []).map((entry) => entry.code)))].sort();
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: GROWTH_RULE_VERSION,
    asOf,
    counts: Object.freeze({ total: analyses.length, analyzed: analyses.filter((item) => item.status === 'ANALYZED').length, held: holds.length, winners: analyses.filter((item) => ['WINNER', 'OUTLIER'].includes(item.classification)).length }),
    topWinners: Object.freeze(ranked.slice(0, 3).map((item) => Object.freeze({ snapshotId: item.snapshotId, score: item.score, classification: item.classification }))),
    heldSnapshots: Object.freeze(holds),
    alerts: Object.freeze(alerts),
    recommendations: Object.freeze(recommendations),
    provenance: 'synthetic_or_authorized_input_only'
  });
}
