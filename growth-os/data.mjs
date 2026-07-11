import { createHash } from 'node:crypto';
import { canonicalJson, GrowthValidationError } from './core.mjs';

export const DATA_SCHEMA_VERSION = 1;
export const SHADOW_DATA_MODE = 'shadow';

export const EVENT_TYPES = Object.freeze([
  'CAMPAIGN_CREATED',
  'CONTENT_REGISTERED',
  'VARIANT_PLANNED',
  'PUBLISH_JOB_RECORDED',
  'METRIC_SNAPSHOT_RECORDED',
  'COMMENT_SIGNAL_RECORDED',
  'TREND_SIGNAL_RECORDED',
  'HYPOTHESIS_REGISTERED',
  'EXPERIMENT_REGISTERED',
  'PRODUCTION_BRIEF_REGISTERED'
]);

const EVENT_TYPE_SET = new Set(EVENT_TYPES);

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

function requireInteger(value, field, min = 1) {
  if (!Number.isInteger(value) || value < min) {
    throw new GrowthValidationError(`Missing or invalid integer: ${field}`, { field, value });
  }
  return value;
}

function requireFiniteNumber(value, field, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new GrowthValidationError(`Missing or invalid number: ${field}`, { field, value });
  }
  return value;
}

function requireIsoTimestamp(value, field) {
  const text = requireString(value, field);
  const timestamp = Date.parse(text);
  if (!Number.isFinite(timestamp) || !text.includes('T')) {
    throw new GrowthValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return text;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) {
    throw new GrowthValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  }
  return text;
}

function requireStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new GrowthValidationError(`Missing or invalid array: ${field}`, { field });
  }
  return Object.freeze([...new Set(value.map((item) => requireString(item, `${field}[]`)))].sort());
}

function validatePayload(type, input) {
  const payload = requireObject(input, 'payload');
  switch (type) {
    case 'CAMPAIGN_CREATED':
      return Object.freeze({
        campaignId: requireString(payload.campaignId, 'payload.campaignId'),
        name: requireString(payload.name, 'payload.name'),
        status: requireEnum(payload.status, 'payload.status', ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'])
      });
    case 'CONTENT_REGISTERED':
      return Object.freeze({
        contentId: requireString(payload.contentId, 'payload.contentId'),
        campaignId: payload.campaignId ? requireString(payload.campaignId, 'payload.campaignId') : null,
        episodePackageId: requireString(payload.episodePackageId, 'payload.episodePackageId'),
        title: requireString(payload.title, 'payload.title'),
        status: requireEnum(payload.status, 'payload.status', ['READY', 'ARCHIVED'])
      });
    case 'VARIANT_PLANNED':
      return Object.freeze({
        variantId: requireString(payload.variantId, 'payload.variantId'),
        contentId: requireString(payload.contentId, 'payload.contentId'),
        platform: requireEnum(payload.platform, 'payload.platform', ['tiktok', 'instagram_reels', 'youtube_shorts']),
        status: requireEnum(payload.status, 'payload.status', ['PLANNED', 'READY', 'ARCHIVED'])
      });
    case 'PUBLISH_JOB_RECORDED':
      return Object.freeze({
        publishJobId: requireString(payload.publishJobId, 'payload.publishJobId'),
        variantId: requireString(payload.variantId, 'payload.variantId'),
        state: requireEnum(payload.state, 'payload.state', ['DRAFT', 'POLICY_CHECK', 'WAITING_HUMAN', 'APPROVED_SHADOW', 'SIMULATED', 'FAILED', 'CANCELLED'])
      });
    case 'METRIC_SNAPSHOT_RECORDED': {
      const metrics = requireObject(payload.metrics, 'payload.metrics');
      return Object.freeze({
        metricSnapshotId: requireString(payload.metricSnapshotId, 'payload.metricSnapshotId'),
        variantId: requireString(payload.variantId, 'payload.variantId'),
        platform: requireEnum(payload.platform, 'payload.platform', ['tiktok', 'instagram_reels', 'youtube_shorts']),
        capturedAt: requireIsoTimestamp(payload.capturedAt, 'payload.capturedAt'),
        metrics: Object.freeze({
          views: requireFiniteNumber(metrics.views, 'payload.metrics.views'),
          watchSeconds: requireFiniteNumber(metrics.watchSeconds ?? 0, 'payload.metrics.watchSeconds'),
          shares: requireFiniteNumber(metrics.shares ?? 0, 'payload.metrics.shares'),
          comments: requireFiniteNumber(metrics.comments ?? 0, 'payload.metrics.comments'),
          followersGained: requireFiniteNumber(metrics.followersGained ?? 0, 'payload.metrics.followersGained')
        })
      });
    }
    case 'COMMENT_SIGNAL_RECORDED':
      return Object.freeze({
        commentSignalId: requireString(payload.commentSignalId, 'payload.commentSignalId'),
        variantId: requireString(payload.variantId, 'payload.variantId'),
        platform: requireEnum(payload.platform, 'payload.platform', ['tiktok', 'instagram_reels', 'youtube_shorts']),
        category: requireEnum(payload.category, 'payload.category', ['FAN_REACTION', 'QUESTION', 'EPISODE_IDEA', 'CRITICISM', 'RIGHTS', 'COLLAB', 'SPAM', 'CRISIS']),
        urgency: requireEnum(payload.urgency, 'payload.urgency', ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'])
      });
    case 'TREND_SIGNAL_RECORDED':
      return Object.freeze({
        trendSignalId: requireString(payload.trendSignalId, 'payload.trendSignalId'),
        source: requireString(payload.source, 'payload.source'),
        topic: requireString(payload.topic, 'payload.topic'),
        velocity: requireFiniteNumber(payload.velocity, 'payload.velocity', { min: 0, max: 100 }),
        brandFit: requireFiniteNumber(payload.brandFit, 'payload.brandFit', { min: 0, max: 100 })
      });
    case 'HYPOTHESIS_REGISTERED':
      return Object.freeze({
        hypothesisId: requireString(payload.hypothesisId, 'payload.hypothesisId'),
        statement: requireString(payload.statement, 'payload.statement'),
        confidence: requireFiniteNumber(payload.confidence, 'payload.confidence', { min: 0, max: 1 }),
        status: requireEnum(payload.status, 'payload.status', ['OBSERVED', 'TESTING', 'SUPPORTED', 'REJECTED', 'EXPIRED'])
      });
    case 'EXPERIMENT_REGISTERED':
      return Object.freeze({
        experimentId: requireString(payload.experimentId, 'payload.experimentId'),
        hypothesisId: requireString(payload.hypothesisId, 'payload.hypothesisId'),
        changedVariable: requireString(payload.changedVariable, 'payload.changedVariable'),
        status: requireEnum(payload.status, 'payload.status', ['PLANNED', 'RUNNING', 'COMPLETED', 'CANCELLED'])
      });
    case 'PRODUCTION_BRIEF_REGISTERED':
      return Object.freeze({
        productionBriefId: requireString(payload.productionBriefId, 'payload.productionBriefId'),
        sourceAnalysisId: requireString(payload.sourceAnalysisId, 'payload.sourceAnalysisId'),
        priority: requireEnum(payload.priority, 'payload.priority', ['LOW', 'NORMAL', 'HIGH', 'CRITICAL']),
        recommendations: requireStringArray(payload.recommendations, 'payload.recommendations')
      });
    default:
      throw new GrowthValidationError('Unsupported event type', { type });
  }
}

export function createDomainEvent(input) {
  requireObject(input, 'event');
  if (input.schemaVersion !== DATA_SCHEMA_VERSION) {
    throw new GrowthValidationError(`Domain event schemaVersion must be ${DATA_SCHEMA_VERSION}`, { schemaVersion: input.schemaVersion });
  }
  const type = requireString(input.type, 'type');
  if (!EVENT_TYPE_SET.has(type)) throw new GrowthValidationError('Unsupported event type', { type });
  return Object.freeze({
    schemaVersion: DATA_SCHEMA_VERSION,
    id: requireString(input.id, 'id'),
    tenantId: requireString(input.tenantId, 'tenantId'),
    projectId: requireString(input.projectId, 'projectId'),
    stream: requireString(input.stream, 'stream'),
    sequence: requireInteger(input.sequence, 'sequence'),
    type,
    occurredAt: requireIsoTimestamp(input.occurredAt, 'occurredAt'),
    actor: requireString(input.actor, 'actor'),
    mode: requireEnum(input.mode, 'mode', [SHADOW_DATA_MODE]),
    payload: validatePayload(type, input.payload)
  });
}

function normalizeScope(scope) {
  requireObject(scope, 'scope');
  return Object.freeze({
    tenantId: requireString(scope.tenantId, 'scope.tenantId'),
    projectId: requireString(scope.projectId, 'scope.projectId')
  });
}

function hashRecord(record) {
  return createHash('sha256').update(canonicalJson(record)).digest('hex');
}

export function appendStoredEvent(records, rawEvent, rawScope) {
  if (!Array.isArray(records)) throw new GrowthValidationError('Event records must be an array');
  const scope = normalizeScope(rawScope);
  const event = createDomainEvent(rawEvent);
  if (event.tenantId !== scope.tenantId || event.projectId !== scope.projectId) {
    throw new GrowthValidationError('Event scope mismatch', {
      expected: scope,
      actual: { tenantId: event.tenantId, projectId: event.projectId }
    });
  }
  if (records.some((record) => record.event.id === event.id)) {
    throw new GrowthValidationError('Duplicate event id', { id: event.id });
  }
  const streamRecords = records.filter((record) => record.event.stream === event.stream);
  const expectedSequence = streamRecords.length + 1;
  if (event.sequence !== expectedSequence) {
    throw new GrowthValidationError('Invalid stream sequence', {
      stream: event.stream,
      expectedSequence,
      actualSequence: event.sequence
    });
  }
  const previousHash = records.length === 0 ? '0'.repeat(64) : records.at(-1).hash;
  const material = Object.freeze({ previousHash, event });
  const stored = Object.freeze({
    index: records.length + 1,
    previousHash,
    event,
    hash: hashRecord(material)
  });
  return Object.freeze([...records, stored]);
}

export function appendStoredEvents(records, events, scope) {
  if (!Array.isArray(events)) throw new GrowthValidationError('Events must be an array');
  return events.reduce((next, event) => appendStoredEvent(next, event, scope), Object.freeze([...records]));
}

export function verifyStoredEvents(records, rawScope) {
  const scope = normalizeScope(rawScope);
  const ids = new Set();
  const streamSequences = new Map();
  let previousHash = '0'.repeat(64);
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const event = createDomainEvent(record.event);
    if (record.index !== index + 1) return false;
    if (record.previousHash !== previousHash) return false;
    if (event.tenantId !== scope.tenantId || event.projectId !== scope.projectId) return false;
    if (ids.has(event.id)) return false;
    ids.add(event.id);
    const expectedSequence = (streamSequences.get(event.stream) ?? 0) + 1;
    if (event.sequence !== expectedSequence) return false;
    streamSequences.set(event.stream, event.sequence);
    if (record.hash !== hashRecord({ previousHash, event })) return false;
    previousHash = record.hash;
  }
  return true;
}

function createProjection(scope) {
  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    tenantId: scope.tenantId,
    projectId: scope.projectId,
    campaigns: new Map(),
    contentItems: new Map(),
    variants: new Map(),
    publishJobs: new Map(),
    metricSnapshots: new Map(),
    latestMetricsByVariant: new Map(),
    commentSignals: new Map(),
    trendSignals: new Map(),
    hypotheses: new Map(),
    experiments: new Map(),
    productionBriefs: new Map()
  };
}

function assertReference(map, id, field) {
  if (!map.has(id)) throw new GrowthValidationError(`Projection reference missing: ${field}`, { field, id });
}

function applyEvent(state, event) {
  const payload = event.payload;
  switch (event.type) {
    case 'CAMPAIGN_CREATED':
      state.campaigns.set(payload.campaignId, payload);
      break;
    case 'CONTENT_REGISTERED':
      if (payload.campaignId) assertReference(state.campaigns, payload.campaignId, 'campaignId');
      state.contentItems.set(payload.contentId, payload);
      break;
    case 'VARIANT_PLANNED':
      assertReference(state.contentItems, payload.contentId, 'contentId');
      state.variants.set(payload.variantId, payload);
      break;
    case 'PUBLISH_JOB_RECORDED':
      assertReference(state.variants, payload.variantId, 'variantId');
      state.publishJobs.set(payload.publishJobId, payload);
      break;
    case 'METRIC_SNAPSHOT_RECORDED': {
      assertReference(state.variants, payload.variantId, 'variantId');
      state.metricSnapshots.set(payload.metricSnapshotId, payload);
      const previous = state.latestMetricsByVariant.get(payload.variantId);
      if (!previous || Date.parse(payload.capturedAt) >= Date.parse(previous.capturedAt)) {
        state.latestMetricsByVariant.set(payload.variantId, payload);
      }
      break;
    }
    case 'COMMENT_SIGNAL_RECORDED':
      assertReference(state.variants, payload.variantId, 'variantId');
      state.commentSignals.set(payload.commentSignalId, payload);
      break;
    case 'TREND_SIGNAL_RECORDED':
      state.trendSignals.set(payload.trendSignalId, payload);
      break;
    case 'HYPOTHESIS_REGISTERED':
      state.hypotheses.set(payload.hypothesisId, payload);
      break;
    case 'EXPERIMENT_REGISTERED':
      assertReference(state.hypotheses, payload.hypothesisId, 'hypothesisId');
      state.experiments.set(payload.experimentId, payload);
      break;
    case 'PRODUCTION_BRIEF_REGISTERED':
      state.productionBriefs.set(payload.productionBriefId, payload);
      break;
    default:
      throw new GrowthValidationError('Unsupported projection event', { type: event.type });
  }
  return state;
}

function sortedValues(map) {
  return Object.freeze([...map.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value));
}

export function projectGrowthState(records, rawScope) {
  const scope = normalizeScope(rawScope);
  if (!verifyStoredEvents(records, scope)) throw new GrowthValidationError('Event store integrity check failed');
  const state = records.reduce((projection, record) => applyEvent(projection, record.event), createProjection(scope));
  return Object.freeze({
    schemaVersion: DATA_SCHEMA_VERSION,
    tenantId: scope.tenantId,
    projectId: scope.projectId,
    eventCount: records.length,
    eventHead: records.length ? records.at(-1).hash : '0'.repeat(64),
    campaigns: sortedValues(state.campaigns),
    contentItems: sortedValues(state.contentItems),
    variants: sortedValues(state.variants),
    publishJobs: sortedValues(state.publishJobs),
    metricSnapshots: sortedValues(state.metricSnapshots),
    latestMetricsByVariant: sortedValues(state.latestMetricsByVariant),
    commentSignals: sortedValues(state.commentSignals),
    trendSignals: sortedValues(state.trendSignals),
    hypotheses: sortedValues(state.hypotheses),
    experiments: sortedValues(state.experiments),
    productionBriefs: sortedValues(state.productionBriefs)
  });
}

export function summarizeGrowthState(state) {
  requireObject(state, 'state');
  return Object.freeze({
    tenantId: requireString(state.tenantId, 'state.tenantId'),
    projectId: requireString(state.projectId, 'state.projectId'),
    eventCount: requireInteger(state.eventCount, 'state.eventCount', 0),
    campaigns: state.campaigns?.length ?? 0,
    contentItems: state.contentItems?.length ?? 0,
    variants: state.variants?.length ?? 0,
    publishJobs: state.publishJobs?.length ?? 0,
    metricSnapshots: state.metricSnapshots?.length ?? 0,
    commentSignals: state.commentSignals?.length ?? 0,
    trendSignals: state.trendSignals?.length ?? 0,
    hypotheses: state.hypotheses?.length ?? 0,
    experiments: state.experiments?.length ?? 0,
    productionBriefs: state.productionBriefs?.length ?? 0
  });
}
