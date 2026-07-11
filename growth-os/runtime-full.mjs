import { createHash } from 'node:crypto';
import { canonicalJson } from './core.mjs';
import { analyzePerformanceSnapshot, buildDailyGrowthBrief, buildDirectionPackage } from './analytics.mjs';
import {
  RUNTIME_RULE_VERSION,
  appendRuntimeEvent,
  projectRuntimeState,
  replayRuntimeEvidence,
  runIntegratedShadowRuntime,
  verifyRuntimeCheckpoint,
  verifyRuntimeJournal
} from './runtime.mjs';

export const FULL_RUNTIME_RULE_VERSION = 'mkt0-009.full.v1';

function digest(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function plus(base, milliseconds) {
  return new Date(Date.parse(base) + milliseconds).toISOString();
}

function snapshot(input, id, overrides = {}) {
  const views = input.metrics.views;
  return {
    schemaVersion: 1,
    id,
    tenantId: input.tenantId,
    projectId: input.projectId,
    variantId: `variant_${id}`,
    platform: 'tiktok',
    format: 'synthetic_runtime',
    seriesId: input.episodePackage.seriesId,
    characterIds: input.episodePackage.characters,
    publishedAt: plus(input.timestamp, -86_400_000),
    capturedAt: input.timestamp,
    durationSeconds: input.episodePackage.durationSeconds,
    views,
    starts: views,
    viewersAfter3s: Math.round(views * input.metrics.holdRate3s),
    completions: Math.round(views * input.metrics.completionRate),
    shares: input.metrics.shares,
    saves: input.metrics.saves,
    comments: input.metrics.comments,
    profileVisits: input.metrics.profileVisits,
    followersGained: input.metrics.followersGained,
    averageWatchSeconds: input.metrics.averageWatchSeconds,
    rewatches: Math.round(views * 0.12),
    productionHours: input.metrics.productionHours,
    provenance: 'synthetic_fixture',
    ...overrides
  };
}

function analyticsPackage(input) {
  const history = Array.from({ length: 6 }, (_, index) => snapshot(input, `history_${index}`, {
    views: 8_000 + index * 700,
    starts: 8_000 + index * 700,
    viewersAfter3s: 4_800 + index * 420,
    completions: 3_000 + index * 300,
    shares: 120 + index * 12,
    saves: 70 + index * 7,
    comments: 50 + index * 5,
    profileVisits: 350 + index * 20,
    followersGained: 30 + index * 3,
    averageWatchSeconds: 10.5 + index * 0.2,
    rewatches: 450 + index * 35,
    productionHours: 4
  }));
  const target = snapshot(input, `runtime_${input.runId}`);
  const analysis = analyzePerformanceSnapshot(target, history);
  const dailyBrief = buildDailyGrowthBrief([analysis], plus(input.timestamp, 200_000));
  const directionEvents = buildDirectionPackage(analysis, {
    tenantId: input.tenantId,
    projectId: input.projectId,
    occurredAt: plus(input.timestamp, 201_000)
  });
  return Object.freeze({ analysis, dailyBrief, directionEvents });
}

function insertAnalyticsEvent(baseBundle, analytics) {
  const terminal = baseBundle.journal.at(-1);
  const prefix = baseBundle.journal.slice(0, -1);
  let journal = appendRuntimeEvent(prefix, {
    eventId: `evt_analytics_${digest({ traceId: baseBundle.traceId, score: analytics.analysis.score, classification: analytics.analysis.classification }).slice(0, 20)}`,
    traceId: baseBundle.traceId,
    correlationId: baseBundle.correlationId,
    module: 'analytics',
    type: 'ANALYTICS_RADAR_COMPLETED',
    occurredAt: new Date(Date.parse(terminal.occurredAt) - 1).toISOString(),
    data: {
      ruleVersion: analytics.analysis.ruleVersion,
      status: analytics.analysis.status,
      score: analytics.analysis.score,
      classification: analytics.analysis.classification,
      recommendationCount: analytics.analysis.recommendations.length,
      directionEventCount: analytics.directionEvents.length,
      dailyBriefWinnerCount: analytics.dailyBrief.counts.winners,
      provenance: 'synthetic_fixture',
      liveActionsExecuted: false
    }
  });
  journal = appendRuntimeEvent(journal, {
    eventId: `evt_terminal_${digest({ traceId: baseBundle.traceId, type: terminal.type, data: terminal.data }).slice(0, 20)}`,
    traceId: baseBundle.traceId,
    correlationId: baseBundle.correlationId,
    module: terminal.module,
    type: terminal.type,
    occurredAt: terminal.occurredAt,
    data: terminal.data
  });
  return journal;
}

function projectFullState(journal) {
  const base = projectRuntimeState(journal);
  const analyticsEvent = journal.find((entry) => entry.type === 'ANALYTICS_RADAR_COMPLETED');
  return Object.freeze({
    ...base,
    analyticsRadarCompleted: Boolean(analyticsEvent),
    analyticsRuleVersion: analyticsEvent?.data.ruleVersion ?? null,
    analyticsStatus: analyticsEvent?.data.status ?? null,
    analyticsScore: analyticsEvent?.data.score ?? null,
    analyticsClassification: analyticsEvent?.data.classification ?? null,
    directionEventCount: analyticsEvent?.data.directionEventCount ?? 0
  });
}

export function runFullShadowRuntime(input) {
  const baseBundle = runIntegratedShadowRuntime(input);
  const analytics = analyticsPackage(input);
  const journal = insertAnalyticsEvent(baseBundle, analytics);
  if (!verifyRuntimeJournal(journal)) throw new Error('Full runtime journal integrity failure');
  const finalState = projectFullState(journal);
  const material = Object.freeze({
    schemaVersion: 1,
    ruleVersion: FULL_RUNTIME_RULE_VERSION,
    baseRuleVersion: RUNTIME_RULE_VERSION,
    traceId: baseBundle.traceId,
    correlationId: baseBundle.correlationId,
    inputSummary: baseBundle.inputSummary,
    inputHash: baseBundle.inputHash,
    journal,
    checkpoints: baseBundle.checkpoints,
    finalState,
    analytics: Object.freeze({
      ruleVersion: analytics.analysis.ruleVersion,
      status: analytics.analysis.status,
      score: analytics.analysis.score,
      classification: analytics.analysis.classification,
      recommendations: analytics.analysis.recommendations,
      directionEventCount: analytics.directionEvents.length,
      dailyBrief: analytics.dailyBrief
    }),
    baseEvidenceHash: baseBundle.bundleHash,
    eventStoreHead: baseBundle.eventStoreHead,
    connectorSummary: baseBundle.connectorSummary,
    cockpitSummary: baseBundle.cockpitSummary,
    externalActions: baseBundle.externalActions,
    nonClaims: baseBundle.nonClaims
  });
  return Object.freeze({
    ...material,
    journalHash: digest(journal),
    finalStateHash: digest(finalState),
    analyticsHash: digest(material.analytics),
    bundleHash: digest(material),
    replayStatus: 'NOT_YET_REPLAYED'
  });
}

export function replayFullRuntimeEvidence(bundle) {
  if (!bundle || typeof bundle !== 'object') return Object.freeze({ status: 'QUARANTINED', reason: 'INVALID_BUNDLE', replayMatched: false });
  if (bundle.ruleVersion !== FULL_RUNTIME_RULE_VERSION || bundle.baseRuleVersion !== RUNTIME_RULE_VERSION) {
    return Object.freeze({ status: 'QUARANTINED', reason: 'RULE_VERSION_MISMATCH', replayMatched: false, externalActionsExecuted: false });
  }
  if (!verifyRuntimeJournal(bundle.journal)) {
    return Object.freeze({ status: 'QUARANTINED', reason: 'JOURNAL_INTEGRITY_FAILURE', replayMatched: false, externalActionsExecuted: false });
  }
  if ((bundle.checkpoints ?? []).some((checkpoint) => !verifyRuntimeCheckpoint(checkpoint, bundle.journal))) {
    return Object.freeze({ status: 'QUARANTINED', reason: 'CHECKPOINT_INTEGRITY_FAILURE', replayMatched: false, externalActionsExecuted: false });
  }
  const finalState = projectFullState(bundle.journal);
  const finalStateHash = digest(finalState);
  const journalHash = digest(bundle.journal);
  const analyticsHash = digest(bundle.analytics);
  const storedFinalStateValid = digest(bundle.finalState) === bundle.finalStateHash;
  const replayMatched = finalStateHash === bundle.finalStateHash && journalHash === bundle.journalHash && analyticsHash === bundle.analyticsHash && storedFinalStateValid;
  return Object.freeze({
    status: replayMatched ? 'REPLAY_MATCHED' : 'QUARANTINED',
    reason: replayMatched ? null : 'EVIDENCE_HASH_MISMATCH',
    replayMatched,
    finalState,
    replayFinalStateHash: finalStateHash,
    replayJournalHash: journalHash,
    replayAnalyticsHash: analyticsHash,
    externalActionsExecuted: false
  });
}

export function compareFullRuntimeBundles(left, right) {
  const result = Object.freeze({
    sameInputHash: left.inputHash === right.inputHash,
    sameJournalHash: left.journalHash === right.journalHash,
    sameFinalStateHash: left.finalStateHash === right.finalStateHash,
    sameAnalyticsHash: left.analyticsHash === right.analyticsHash,
    sameBundleHash: left.bundleHash === right.bundleHash
  });
  return Object.freeze({ ...result, deterministic: Object.values(result).every(Boolean) });
}

export function verifyBaseAndFullReplay(input) {
  const base = runIntegratedShadowRuntime(input);
  const full = runFullShadowRuntime(input);
  return Object.freeze({
    baseReplayMatched: replayRuntimeEvidence(base).replayMatched,
    fullReplayMatched: replayFullRuntimeEvidence(full).replayMatched,
    baseStatus: base.finalState.status,
    fullStatus: full.finalState.status,
    analyticsRadarCompleted: full.finalState.analyticsRadarCompleted,
    externalActionsExecuted: false
  });
}
