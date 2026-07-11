import { createHash } from 'node:crypto';
import { canonicalJson, runShadowPipeline } from './core.mjs';
import { appendStoredEvents, createDomainEvent, verifyStoredEvents } from './data.mjs';
import {
  buildDailyMarketingPlan,
  buildWorkflowPlan,
  simulateScheduler,
  transitionWorkflowTask,
  unlockReadyTasks
} from './orchestrator.mjs';
import { aggregateCommunitySignals, buildDailySignalBrief } from './signals.mjs';
import { buildCockpitViewModel } from './cockpit.mjs';
import { evaluateOperationalState, gateShadowJobs, sha256 } from './operations.mjs';
import {
  buildConnectorPortfolioReadiness,
  buildConnectorReadiness,
  buildRequestPlan,
  evaluateRateLimitBudget,
  normalizeMetricEnvelope,
  normalizePublishEnvelope,
  registerShadowPlan,
  simulateProviderRequest,
  validateWebhookEnvelope
} from './connectors.mjs';

export const RUNTIME_SCHEMA_VERSION = 1;
export const RUNTIME_RULE_VERSION = 'mkt0-009.v1';
export const RUNTIME_SCENARIOS = Object.freeze([
  'HAPPY_PATH',
  'RATE_LIMIT',
  'AUTH_BLOCKED',
  'WEBHOOK_REPLAY',
  'INCIDENT_LOCKDOWN'
]);
export const RUNTIME_TERMINAL_STATES = Object.freeze([
  'COMPLETED',
  'COMPLETED_WITH_BACKOFF',
  'BLOCKED_AUTH',
  'BLOCKED_INCIDENT',
  'QUARANTINED'
]);

const FORBIDDEN_KEY = /(token|password|authorization|api[_-]?key|client[_-]?secret|access[_-]?key|private[_-]?key)/i;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const PROVIDER_BY_PLATFORM = Object.freeze({
  tiktok: 'tiktok',
  instagram_reels: 'meta',
  youtube_shorts: 'youtube'
});

export class RuntimeValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RuntimeValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RuntimeValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RuntimeValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new RuntimeValidationError(`Missing or invalid boolean: ${field}`, { field, value });
  return value;
}

function requireInteger(value, field, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RuntimeValidationError(`Missing or invalid integer: ${field}`, { field, value, min, max });
  }
  return value;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) throw new RuntimeValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  return text;
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) {
    throw new RuntimeValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return text;
}

function hash(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function id(prefix, value) {
  return `${prefix}_${hash(value).slice(0, 20)}`;
}

function at(base, offsetMs) {
  return new Date(Date.parse(base) + offsetMs).toISOString();
}

function assertNoSensitiveValues(value, path = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveValues(item, `${path}[${index}]`));
    return true;
  }
  if (!value || typeof value !== 'object') return true;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key) && key !== 'secretRequirements' && item != null && item !== '') {
      throw new RuntimeValidationError('Secret or credential value is forbidden in runtime input', { path: `${path}.${key}` });
    }
    assertNoSensitiveValues(item, `${path}.${key}`);
  }
  return true;
}

function sanitizeProviderManifest(manifest) {
  return Object.freeze({
    providerId: manifest.providerId,
    accountAlias: manifest.accountAlias,
    authState: manifest.authState,
    capabilities: Object.freeze([...(manifest.capabilities ?? [])].sort()),
    secretRequirements: Object.freeze((manifest.secretRequirements ?? []).map((item) => Object.freeze({
      name: item.name,
      required: item.required,
      status: item.status
    })).sort((a, b) => a.name.localeCompare(b.name)))
  });
}

export function validateRuntimeInput(input) {
  const value = requireObject(input, 'runtimeInput');
  if (value.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new RuntimeValidationError(`runtimeInput.schemaVersion must be ${RUNTIME_SCHEMA_VERSION}`);
  }
  assertNoSensitiveValues(value);
  const providers = Array.isArray(value.providerManifests)
    ? value.providerManifests.map((manifest) => requireObject(manifest, 'providerManifests[]'))
    : (() => { throw new RuntimeValidationError('providerManifests must be an array'); })();
  if (providers.length === 0) throw new RuntimeValidationError('At least one provider manifest is required');
  const providerIds = providers.map((manifest) => requireString(manifest.providerId, 'providerId'));
  if (new Set(providerIds).size !== providerIds.length) throw new RuntimeValidationError('Duplicate provider manifest');
  return Object.freeze({
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    runId: requireString(value.runId, 'runId'),
    tenantId: requireString(value.tenantId, 'tenantId'),
    projectId: requireString(value.projectId, 'projectId'),
    scenario: requireEnum(value.scenario, 'scenario', RUNTIME_SCENARIOS),
    timestamp: requireTimestamp(value.timestamp, 'timestamp'),
    episodePackage: requireObject(value.episodePackage, 'episodePackage'),
    metrics: requireObject(value.metrics, 'metrics'),
    baseline: requireObject(value.baseline, 'baseline'),
    providerManifests: Object.freeze(providers.map(sanitizeProviderManifest).sort((a, b) => a.providerId.localeCompare(b.providerId))),
    operationsConfig: requireObject(value.operationsConfig, 'operationsConfig'),
    incidents: Object.freeze(Array.isArray(value.incidents) ? value.incidents.map((incident) => requireObject(incident, 'incidents[]')) : []),
    faultFixture: value.faultFixture == null ? null : requireObject(value.faultFixture, 'faultFixture')
  });
}

export function appendRuntimeEvent(journal, event) {
  if (!Array.isArray(journal)) throw new RuntimeValidationError('Runtime journal must be an array');
  const value = requireObject(event, 'runtimeEvent');
  const sequence = journal.length + 1;
  const previousHash = journal.length === 0 ? '0'.repeat(64) : journal.at(-1).hash;
  const causationId = value.causationId ?? (journal.length === 0 ? null : journal.at(-1).eventId);
  const record = Object.freeze({
    sequence,
    eventId: requireString(value.eventId, 'eventId'),
    traceId: requireString(value.traceId, 'traceId'),
    correlationId: requireString(value.correlationId, 'correlationId'),
    causationId,
    module: requireString(value.module, 'module'),
    type: requireString(value.type, 'type'),
    occurredAt: requireTimestamp(value.occurredAt, 'occurredAt'),
    data: value.data == null ? Object.freeze({}) : Object.freeze(value.data),
    previousHash
  });
  assertNoSensitiveValues(record.data, `journal.${sequence}.data`);
  const recordHash = hash(record);
  return Object.freeze([...journal, Object.freeze({ ...record, hash: recordHash })]);
}

export function verifyRuntimeJournal(journal) {
  if (!Array.isArray(journal)) return false;
  let previousHash = '0'.repeat(64);
  const eventIds = new Set();
  for (let index = 0; index < journal.length; index += 1) {
    const entry = journal[index];
    if (entry.sequence !== index + 1 || entry.previousHash !== previousHash) return false;
    if (eventIds.has(entry.eventId)) return false;
    eventIds.add(entry.eventId);
    const { hash: entryHash, ...record } = entry;
    if (!HASH_PATTERN.test(entryHash) || hash(record) !== entryHash) return false;
    if (index === 0 && entry.causationId !== null) return false;
    if (index > 0 && entry.causationId !== journal[index - 1].eventId) return false;
    previousHash = entryHash;
  }
  return true;
}

export function projectRuntimeState(journal) {
  if (!verifyRuntimeJournal(journal)) throw new RuntimeValidationError('Cannot project invalid runtime journal');
  const state = {
    status: 'RUNNING',
    scenario: null,
    episodePackageId: null,
    variantCount: 0,
    workflowTaskCount: 0,
    operationsMode: null,
    connectorPlanCount: 0,
    simulationCount: 0,
    backoffCount: 0,
    authBlockedCount: 0,
    webhookReplayDetected: false,
    eventStoreValid: false,
    cockpitGenerated: false,
    growthScore: null,
    growthClassification: null,
    blockReasons: [],
    externalActionsExecuted: false
  };
  for (const event of journal) {
    switch (event.type) {
      case 'RUN_STARTED':
        state.scenario = event.data.scenario;
        break;
      case 'CORE_COMPLETED':
        state.episodePackageId = event.data.episodePackageId;
        state.variantCount = event.data.variantCount;
        state.growthScore = event.data.growthScore;
        state.growthClassification = event.data.growthClassification;
        break;
      case 'DATA_LAYER_VERIFIED':
        state.eventStoreValid = event.data.valid === true;
        break;
      case 'ORCHESTRATOR_COMPLETED':
        state.workflowTaskCount = event.data.workflowTaskCount;
        break;
      case 'OPERATIONS_EVALUATED':
        state.operationsMode = event.data.effectiveMode;
        break;
      case 'CONNECTOR_PLAN_REGISTERED':
        state.connectorPlanCount += 1;
        break;
      case 'CONNECTOR_SIMULATED':
        state.simulationCount += 1;
        break;
      case 'CONNECTOR_BACKOFF':
        state.backoffCount += 1;
        break;
      case 'CONNECTOR_AUTH_BLOCKED':
        state.authBlockedCount += 1;
        break;
      case 'WEBHOOK_REPLAY_DETECTED':
        state.webhookReplayDetected = true;
        break;
      case 'COCKPIT_GENERATED':
        state.cockpitGenerated = true;
        break;
      case 'RUN_BLOCKED':
        state.status = event.data.status;
        state.blockReasons.push(...event.data.reasons);
        break;
      case 'RUN_QUARANTINED':
        state.status = 'QUARANTINED';
        state.blockReasons.push(...event.data.reasons);
        break;
      case 'RUN_COMPLETED':
        state.status = event.data.status;
        break;
      default:
        break;
    }
  }
  return Object.freeze({
    ...state,
    blockReasons: Object.freeze([...new Set(state.blockReasons)].sort()),
    externalActionsExecuted: false
  });
}

export function createRuntimeCheckpoint(journal, label) {
  if (!verifyRuntimeJournal(journal) || journal.length === 0) throw new RuntimeValidationError('Checkpoint requires a valid non-empty journal');
  const checkpoint = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    ruleVersion: RUNTIME_RULE_VERSION,
    label: requireString(label, 'label'),
    sequence: journal.length,
    journalHead: journal.at(-1).hash,
    projectedStateHash: hash(projectRuntimeState(journal))
  };
  return Object.freeze({ ...checkpoint, hash: hash(checkpoint) });
}

export function verifyRuntimeCheckpoint(checkpoint, journal) {
  try {
    requireObject(checkpoint, 'checkpoint');
    if (!verifyRuntimeJournal(journal)) return false;
    if (checkpoint.ruleVersion !== RUNTIME_RULE_VERSION) return false;
    if (checkpoint.sequence < 1 || checkpoint.sequence > journal.length) return false;
    const prefix = journal.slice(0, checkpoint.sequence);
    if (prefix.at(-1).hash !== checkpoint.journalHead) return false;
    const { hash: checkpointHash, ...material } = checkpoint;
    if (hash(material) !== checkpointHash) return false;
    return hash(projectRuntimeState(prefix)) === checkpoint.projectedStateHash;
  } catch {
    return false;
  }
}

function append(journal, context, module, type, timestamp, data) {
  return appendRuntimeEvent(journal, {
    eventId: id('evt', { traceId: context.traceId, sequence: journal.length + 1, module, type, data }),
    traceId: context.traceId,
    correlationId: context.correlationId,
    module,
    type,
    occurredAt: timestamp,
    data
  });
}

function advanceWorkflow(plan, baseTimestamp) {
  let tasks = plan.tasks;
  for (const step of ['PACKAGING', 'QA', 'APPROVAL', 'SCHEDULING']) {
    tasks = unlockReadyTasks(tasks, baseTimestamp);
    tasks = tasks.map((task) => {
      if (task.step !== step || task.state !== 'READY') return task;
      if (task.requiresHuman) {
        const waiting = transitionWorkflowTask(task, 'WAITING_HUMAN', baseTimestamp, 'SYNTHETIC_RUNTIME_HUMAN_GATE');
        return transitionWorkflowTask(waiting, 'COMPLETED', baseTimestamp, 'SYNTHETIC_HUMAN_APPROVAL_FIXTURE');
      }
      const running = transitionWorkflowTask(task, 'RUNNING', baseTimestamp, 'SYNTHETIC_RUNTIME_START');
      return transitionWorkflowTask(running, 'COMPLETED', baseTimestamp, 'SYNTHETIC_RUNTIME_COMPLETE');
    });
  }
  return unlockReadyTasks(tasks, baseTimestamp);
}

function createCampaign(input, variants) {
  return {
    schemaVersion: 1,
    id: `campaign_${input.runId}`,
    tenantId: input.tenantId,
    projectId: input.projectId,
    name: `Synthetic Runtime ${input.scenario}`,
    status: 'ACTIVE',
    timezone: 'Europe/Berlin',
    mode: 'shadow',
    automationTrustLevel: 3,
    contentPlans: variants.map((variant, index) => ({
      id: `content_${index + 1}_${variant.platform}`,
      variantId: variant.id,
      platform: variant.platform,
      formatId: 'synthetic_runtime_v1',
      knownFormat: true,
      packageReady: true,
      priority: index === 0 ? 'HIGH' : 'NORMAL',
      windowStart: at(input.timestamp, 60_000),
      windowEnd: at(input.timestamp, 3_600_000),
      dependencies: [],
      riskFlags: []
    }))
  };
}

function createDataEvents(input, coreResult, schedulerJobs) {
  const common = {
    schemaVersion: 1,
    tenantId: input.tenantId,
    projectId: input.projectId,
    occurredAt: input.timestamp,
    actor: 'mkt0-shadow-runtime',
    mode: 'shadow'
  };
  const events = [
    createDomainEvent({
      ...common,
      id: `domain:${input.runId}:campaign`,
      stream: `campaign:${input.runId}`,
      sequence: 1,
      type: 'CAMPAIGN_CREATED',
      payload: { campaignId: `campaign_${input.runId}`, name: `Synthetic Runtime ${input.scenario}`, status: 'ACTIVE' }
    }),
    createDomainEvent({
      ...common,
      id: `domain:${input.runId}:content`,
      stream: `content:${coreResult.episode.id}`,
      sequence: 1,
      type: 'CONTENT_REGISTERED',
      payload: {
        contentId: `content_${coreResult.episode.id}`,
        campaignId: `campaign_${input.runId}`,
        episodePackageId: coreResult.episode.id,
        title: coreResult.episode.title,
        status: 'READY'
      }
    }),
    ...coreResult.variants.map((variant) => createDomainEvent({
      ...common,
      id: `domain:${input.runId}:variant:${variant.platform}`,
      stream: `variant:${variant.id}`,
      sequence: 1,
      type: 'VARIANT_PLANNED',
      payload: { variantId: variant.id, contentId: `content_${coreResult.episode.id}`, platform: variant.platform, status: 'PLANNED' }
    })),
    ...schedulerJobs.map((job) => createDomainEvent({
      ...common,
      id: `domain:${input.runId}:job:${job.platform}`,
      stream: `publish-job:${job.id}`,
      sequence: 1,
      type: 'PUBLISH_JOB_RECORDED',
      payload: { publishJobId: job.id, variantId: job.variantId, state: 'APPROVED_SHADOW' }
    })),
    createDomainEvent({
      ...common,
      id: `domain:${input.runId}:metric`,
      stream: `metric:${coreResult.variants[0].id}`,
      sequence: 1,
      type: 'METRIC_SNAPSHOT_RECORDED',
      payload: {
        metricSnapshotId: `metric_${input.runId}`,
        variantId: coreResult.variants[0].id,
        platform: coreResult.variants[0].platform,
        capturedAt: input.timestamp,
        metrics: {
          views: input.metrics.views,
          watchSeconds: input.metrics.averageWatchSeconds * input.metrics.views,
          shares: input.metrics.shares,
          comments: input.metrics.comments,
          followersGained: input.metrics.followersGained
        }
      }
    }),
    createDomainEvent({
      ...common,
      id: `domain:${input.runId}:brief`,
      stream: `brief:${coreResult.productionBrief.id}`,
      sequence: 1,
      type: 'PRODUCTION_BRIEF_REGISTERED',
      payload: {
        productionBriefId: coreResult.productionBrief.id,
        sourceAnalysisId: `analysis_${input.runId}`,
        priority: coreResult.productionBrief.priority === 'high' ? 'HIGH' : 'NORMAL',
        recommendations: coreResult.productionBrief.recommendations.length > 0 ? coreResult.productionBrief.recommendations : ['NO_CHANGE']
      }
    })
  ];
  return Object.freeze(events);
}

function createSignalBrief(input, variantId) {
  const rawSignals = [
    {
      schemaVersion: 1,
      id: `signal_${input.runId}_1`,
      tenantId: input.tenantId,
      projectId: input.projectId,
      variantId,
      platform: 'tiktok',
      observedAt: at(input.timestamp, 120_000),
      provenance: 'synthetic_fixture',
      authorRef: 'anon_1234abcd',
      text: 'Bitte eine Folge über den verlorenen DJ USB machen',
      topics: ['dj usb'],
      characterIds: ['char_ricco']
    },
    {
      schemaVersion: 1,
      id: `signal_${input.runId}_2`,
      tenantId: input.tenantId,
      projectId: input.projectId,
      variantId,
      platform: 'tiktok',
      observedAt: at(input.timestamp, 121_000),
      provenance: 'synthetic_fixture',
      authorRef: 'anon_5678abcd',
      text: 'Bitte eine Folge über den verlorenen DJ USB machen',
      topics: ['dj usb'],
      characterIds: ['char_ricco']
    }
  ];
  const aggregate = aggregateCommunitySignals(rawSignals);
  return buildDailySignalBrief({ communityAggregate: aggregate, opportunities: [], asOf: at(input.timestamp, 122_000) });
}

function createCockpit(input, coreResult, dailyPlan, signalBrief, journal, operationalState) {
  const analysis = coreResult.analysis;
  return buildCockpitViewModel({
    asOf: at(input.timestamp, 180_000),
    scope: { tenantId: input.tenantId, projectId: input.projectId },
    growthBrief: {
      schemaVersion: 1,
      ruleVersion: 'mkt0-003.v1',
      asOf: at(input.timestamp, 170_000),
      counts: { total: coreResult.variants.length, analyzed: coreResult.variants.length, held: 0, winners: ['WINNER', 'OUTLIER'].includes(analysis.classification) ? 1 : 0 },
      topWinners: ['WINNER', 'OUTLIER'].includes(analysis.classification) ? [{ snapshotId: `snapshot_${input.runId}`, score: analysis.score, classification: analysis.classification }] : [],
      alerts: [],
      recommendations: analysis.recommendedActions,
      provenance: 'synthetic_or_authorized_input_only'
    },
    analyses: coreResult.variants.map((variant) => ({
      snapshotId: `snapshot_${input.runId}_${variant.platform}`,
      variantId: variant.id,
      platform: variant.platform,
      seriesId: coreResult.episode.seriesId,
      status: 'ANALYZED',
      score: analysis.score,
      classification: analysis.classification,
      quality: { warnings: ['SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM'], critical: [] },
      anomalies: [],
      recommendations: analysis.recommendedActions.map((code) => ({ code, priority: 'HIGH', ruleId: 'MKT0-009-CORE', reason: 'Synthetic integrated runtime recommendation.' }))
    })),
    signalBrief,
    dailyPlan: { ...dailyPlan, provenance: 'synthetic_fixture' },
    hypotheses: [{
      hypothesisId: `hyp_${input.runId}`,
      statement: 'Synthetic integrated runtime output merits a controlled shadow follow-up.',
      confidence: 0.5,
      status: 'TESTING',
      sourceRef: `analysis_${input.runId}`
    }],
    systemHealth: {
      ruleVersion: RUNTIME_RULE_VERSION,
      asOf: at(input.timestamp, 175_000),
      provenance: 'synthetic_fixture',
      components: [
        { component: 'runtime-journal', status: 'PASS', checkedAt: at(input.timestamp, 175_000), evidenceRef: 'growth-os/evidence/MKT0-009.md' },
        { component: 'operations-gate', status: operationalState.shadowJobsAllowed ? 'PASS' : 'DEGRADED', checkedAt: at(input.timestamp, 175_000), evidenceRef: 'growth-os/evidence/MKT0-007.md' }
      ]
    },
    auditEntries: journal.map((event) => ({
      id: event.eventId,
      occurredAt: event.occurredAt,
      status: 'PASS',
      code: event.type,
      reference: event.module,
      hash: event.hash
    }))
  });
}

function manifestSummary(input) {
  return Object.freeze({
    runId: input.runId,
    scenario: input.scenario,
    tenantId: input.tenantId,
    projectId: input.projectId,
    timestamp: input.timestamp,
    episodePackageId: input.episodePackage.id,
    providerManifests: Object.freeze(input.providerManifests.map(sanitizeProviderManifest)),
    operationsMode: input.operationsConfig.mode,
    globalKillSwitch: input.operationsConfig.globalKillSwitch,
    incidentCount: input.incidents.length,
    synthetic: true
  });
}

export function runIntegratedShadowRuntime(rawInput) {
  const input = validateRuntimeInput(rawInput);
  const inputSummary = manifestSummary(input);
  const inputHash = hash(inputSummary);
  const context = Object.freeze({
    traceId: id('trace', { runId: input.runId, inputHash, ruleVersion: RUNTIME_RULE_VERSION }),
    correlationId: id('corr', { tenantId: input.tenantId, projectId: input.projectId, runId: input.runId })
  });
  let journal = [];
  const checkpoints = [];
  journal = append(journal, context, 'runtime', 'RUN_STARTED', input.timestamp, {
    runId: input.runId,
    scenario: input.scenario,
    inputHash,
    ruleVersion: RUNTIME_RULE_VERSION
  });

  const coreResult = runShadowPipeline({
    episodePackage: input.episodePackage,
    metrics: input.metrics,
    baseline: input.baseline,
    timestamp: at(input.timestamp, 1_000)
  });
  journal = append(journal, context, 'core', 'CORE_COMPLETED', at(input.timestamp, 2_000), {
    episodePackageId: coreResult.episode.id,
    variantCount: coreResult.variants.length,
    growthScore: coreResult.analysis.score,
    growthClassification: coreResult.analysis.classification,
    auditValid: coreResult.auditValid,
    liveActionsExecuted: false
  });

  const campaign = createCampaign(input, coreResult.variants);
  const workflowPlan = buildWorkflowPlan(campaign);
  const tasks = advanceWorkflow(workflowPlan, at(input.timestamp, 3_000));
  const scheduler = simulateScheduler({ workflowPlan, tasks, asOf: at(input.timestamp, 120_000) });
  const dailyPlan = buildDailyMarketingPlan({ workflowPlan, tasks, asOf: at(input.timestamp, 120_000) });
  journal = append(journal, context, 'orchestrator', 'ORCHESTRATOR_COMPLETED', at(input.timestamp, 4_000), {
    campaignId: campaign.id,
    workflowTaskCount: tasks.length,
    schedulerJobCount: scheduler.jobs.length,
    humanApprovals: dailyPlan.summary.humanApprovals,
    publicActionsExecuted: false
  });

  const domainEvents = createDataEvents(input, coreResult, scheduler.jobs);
  const storedEvents = appendStoredEvents([], domainEvents, { tenantId: input.tenantId, projectId: input.projectId });
  const eventStoreValid = verifyStoredEvents(storedEvents, { tenantId: input.tenantId, projectId: input.projectId });
  journal = append(journal, context, 'data', 'DATA_LAYER_VERIFIED', at(input.timestamp, 5_000), {
    domainEventCount: storedEvents.length,
    valid: eventStoreValid,
    eventStoreHead: storedEvents.at(-1)?.hash ?? null
  });

  const signalBrief = createSignalBrief(input, coreResult.variants[0].id);
  journal = append(journal, context, 'signals', 'SIGNAL_BRIEF_CREATED', at(input.timestamp, 6_000), {
    signalCount: signalBrief.community.signalCount,
    opportunityCount: signalBrief.opportunities.length,
    replyMode: signalBrief.replyMode,
    publicActionsExecuted: false
  });

  let incidents = input.incidents;
  if (input.scenario === 'INCIDENT_LOCKDOWN' && incidents.length === 0) {
    incidents = [{
      schemaVersion: 1,
      id: `incident_${input.runId}`,
      tenantId: input.tenantId,
      projectId: input.projectId,
      severity: 'SEV1',
      category: 'DATA_INTEGRITY',
      status: 'OPEN',
      detectedAt: at(input.timestamp, 7_000),
      resolvedAt: null,
      summary: 'Synthetic runtime incident lockdown fixture',
      evidenceRefs: ['evidence://mkt0-009/incident-lockdown'],
      humanOwner: 'runtime_operator'
    }];
  }
  const operationalState = evaluateOperationalState(input.operationsConfig, incidents);
  journal = append(journal, context, 'operations', 'OPERATIONS_EVALUATED', at(input.timestamp, 8_000), {
    effectiveMode: operationalState.effectiveMode,
    shadowJobsAllowed: operationalState.shadowJobsAllowed,
    reasons: operationalState.reasons,
    activeIncidentCount: operationalState.activeIncidentCount,
    liveActionsAllowed: false
  });
  checkpoints.push(createRuntimeCheckpoint(journal, 'AFTER_OPERATIONS_GATE'));

  const gatedJobs = gateShadowJobs(scheduler.jobs, operationalState);
  if (!operationalState.shadowJobsAllowed) {
    journal = append(journal, context, 'runtime', 'RUN_BLOCKED', at(input.timestamp, 9_000), {
      status: 'BLOCKED_INCIDENT',
      reasons: operationalState.reasons.length > 0 ? operationalState.reasons : [operationalState.effectiveMode],
      connectorPlanningStarted: false,
      externalActionsExecuted: false
    });
    return buildEvidenceBundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, null, null);
  }

  const providerById = new Map(input.providerManifests.map((provider) => [provider.providerId, provider]));
  const connectorOutputs = [];
  const idempotencyKeys = [];
  let webhookReplayDetected = false;
  for (let index = 0; index < gatedJobs.length; index += 1) {
    const job = gatedJobs[index];
    if (job.operationsGate !== 'ALLOWED_SHADOW') continue;
    const providerId = PROVIDER_BY_PLATFORM[job.platform];
    let provider = providerById.get(providerId);
    if (!provider) throw new RuntimeValidationError('Missing provider manifest for platform', { platform: job.platform, providerId });
    if (input.scenario === 'AUTH_BLOCKED' && index === 0) provider = { ...provider, authState: 'DISCONNECTED' };
    const readiness = buildConnectorReadiness(provider);
    if (readiness.status !== 'SANDBOX_READY') {
      journal = append(journal, context, 'connectors', 'CONNECTOR_AUTH_BLOCKED', at(input.timestamp, 10_000 + index), {
        providerId,
        platform: job.platform,
        reasons: readiness.reasons,
        liveReady: false
      });
      continue;
    }

    const plan = buildRequestPlan({
      manifest: provider,
      capability: 'PUBLISH',
      method: 'POST',
      path: `/sandbox/${providerId}/publish`,
      payload: { variantAlias: `sandbox_variant_${index + 1}`, publishJobAlias: `sandbox_job_${index + 1}` },
      tenantId: input.tenantId,
      projectId: input.projectId,
      requestedAt: at(input.timestamp, 11_000 + index),
      idempotencySeed: `${input.runId}:${job.id}`
    });
    const registration = registerShadowPlan(plan, idempotencyKeys);
    if (!registration.accepted) continue;
    idempotencyKeys.push(plan.idempotencyKey);
    journal = append(journal, context, 'connectors', 'CONNECTOR_PLAN_REGISTERED', at(input.timestamp, 12_000 + index), {
      providerId,
      platform: job.platform,
      planId: plan.id,
      payloadHash: plan.payloadHash,
      idempotencyKey: plan.idempotencyKey,
      state: plan.state,
      networkAllowed: false
    });

    const rateLimit = evaluateRateLimitBudget({
      limit: 100,
      used: input.scenario === 'RATE_LIMIT' && index === 0 ? 100 : 10,
      requestedUnits: 1,
      windowStartedAt: input.timestamp,
      windowSeconds: 3600,
      asOf: at(input.timestamp, 13_000 + index)
    });
    if (rateLimit.decision === 'BACKOFF') {
      journal = append(journal, context, 'connectors', 'CONNECTOR_BACKOFF', at(input.timestamp, 14_000 + index), {
        providerId,
        planId: plan.id,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        executionAllowed: false
      });
      connectorOutputs.push(Object.freeze({ providerId, plan, rateLimit, simulation: null }));
      continue;
    }

    const simulation = simulateProviderRequest(plan, { resultCode: 'SYNTHETIC_ACCEPTED' });
    const publishEnvelope = normalizePublishEnvelope({
      providerId,
      accountAlias: provider.accountAlias,
      sourceRequestId: plan.id,
      observedAt: at(input.timestamp, 15_000 + index),
      provenance: 'synthetic_fixture',
      remoteObjectAlias: `sandbox_media_${index + 1}`,
      publishState: 'ACCEPTED_SHADOW'
    });
    const metricEnvelope = normalizeMetricEnvelope({
      providerId,
      accountAlias: provider.accountAlias,
      sourceRequestId: plan.id,
      observedAt: at(input.timestamp, 16_000 + index),
      provenance: 'synthetic_fixture',
      remoteObjectAlias: `sandbox_media_${index + 1}`,
      metrics: {
        views: input.metrics.views,
        likes: Math.floor(input.metrics.views * 0.08),
        comments: input.metrics.comments,
        shares: input.metrics.shares,
        watchSeconds: Math.round(input.metrics.averageWatchSeconds * input.metrics.views)
      }
    });
    journal = append(journal, context, 'connectors', 'CONNECTOR_SIMULATED', at(input.timestamp, 17_000 + index), {
      providerId,
      planId: plan.id,
      simulationId: simulation.simulationId,
      state: simulation.state,
      publishState: publishEnvelope.publishState,
      metricViews: metricEnvelope.metrics.views,
      networkUsed: false,
      liveActionPerformed: false
    });
    connectorOutputs.push(Object.freeze({ providerId, plan, rateLimit, simulation, publishEnvelope, metricEnvelope }));

    if (input.scenario === 'WEBHOOK_REPLAY' && index === 0) {
      const webhookFixture = {
        providerId,
        accountAlias: provider.accountAlias,
        eventId: `webhook_${input.runId}`,
        eventType: 'media.status.updated',
        occurredAt: at(input.timestamp, 18_000),
        receivedAt: at(input.timestamp, 19_000),
        signatureStatus: 'SIMULATED_VALID'
      };
      validateWebhookEnvelope(webhookFixture, { asOf: at(input.timestamp, 20_000) });
      try {
        validateWebhookEnvelope(webhookFixture, { asOf: at(input.timestamp, 20_000), seenEventIds: [webhookFixture.eventId] });
      } catch (error) {
        webhookReplayDetected = true;
        journal = append(journal, context, 'connectors', 'WEBHOOK_REPLAY_DETECTED', at(input.timestamp, 21_000), {
          providerId,
          eventId: webhookFixture.eventId,
          errorClass: error.name,
          quarantined: true
        });
      }
      break;
    }
  }
  checkpoints.push(createRuntimeCheckpoint(journal, 'AFTER_CONNECTOR_STAGE'));

  if (webhookReplayDetected) {
    journal = append(journal, context, 'runtime', 'RUN_QUARANTINED', at(input.timestamp, 22_000), {
      reasons: ['WEBHOOK_REPLAY_DETECTED'],
      externalActionsExecuted: false
    });
    return buildEvidenceBundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, null);
  }

  if (input.scenario === 'AUTH_BLOCKED') {
    journal = append(journal, context, 'runtime', 'RUN_BLOCKED', at(input.timestamp, 23_000), {
      status: 'BLOCKED_AUTH',
      reasons: ['CONNECTOR_AUTH_NOT_READY'],
      externalActionsExecuted: false
    });
    return buildEvidenceBundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, null);
  }

  const cockpit = createCockpit(input, coreResult, dailyPlan, signalBrief, journal, operationalState);
  journal = append(journal, context, 'cockpit', 'COCKPIT_GENERATED', at(input.timestamp, 24_000), {
    ruleVersion: cockpit.ruleVersion,
    sectionCount: cockpit.navigation.length,
    readOnly: cockpit.capabilities.readOnly,
    mutations: cockpit.capabilities.mutations,
    networkRequests: cockpit.capabilities.networkRequests,
    publicActionsExecuted: false
  });
  const terminalStatus = input.scenario === 'RATE_LIMIT' ? 'COMPLETED_WITH_BACKOFF' : 'COMPLETED';
  journal = append(journal, context, 'runtime', 'RUN_COMPLETED', at(input.timestamp, 25_000), {
    status: terminalStatus,
    connectorPlanCount: connectorOutputs.length,
    externalActionsExecuted: false
  });
  return buildEvidenceBundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, cockpit);
}

function buildEvidenceBundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, cockpit) {
  if (!verifyRuntimeJournal(journal)) throw new RuntimeValidationError('Runtime journal verification failed before bundle creation');
  const finalState = projectRuntimeState(journal);
  const bundleMaterial = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    ruleVersion: RUNTIME_RULE_VERSION,
    traceId: context.traceId,
    correlationId: context.correlationId,
    inputSummary,
    inputHash,
    journal,
    checkpoints,
    finalState,
    eventStoreHead: storedEvents.at(-1)?.hash ?? null,
    connectorSummary: connectorOutputs == null ? null : connectorOutputs.map((item) => ({
      providerId: item.providerId,
      planId: item.plan?.id ?? null,
      rateLimitDecision: item.rateLimit?.decision ?? null,
      simulationState: item.simulation?.state ?? null
    })),
    cockpitSummary: cockpit == null ? null : {
      ruleVersion: cockpit.ruleVersion,
      sections: cockpit.navigation.length,
      readOnly: cockpit.capabilities.readOnly
    },
    externalActions: {
      networkUsed: false,
      oauthConnected: false,
      livePublishing: false,
      publicReplies: false,
      deletes: false,
      directMessages: false,
      realImports: false
    },
    nonClaims: [
      'NO_PROVIDER_RUNTIME_VERIFIED',
      'NO_REAL_PLATFORM_DATA',
      'NO_OAUTH_CONNECTED',
      'NO_LIVE_ACTION_EXECUTED',
      'NO_CANON_OR_PRODUCTION_CHANGE'
    ]
  };
  return Object.freeze({
    ...bundleMaterial,
    journalHash: hash(journal),
    finalStateHash: hash(finalState),
    bundleHash: hash(bundleMaterial),
    replayStatus: 'NOT_YET_REPLAYED'
  });
}

export function replayRuntimeEvidence(bundleInput, expectedRuleVersion = RUNTIME_RULE_VERSION) {
  const bundle = requireObject(bundleInput, 'evidenceBundle');
  if (bundle.ruleVersion !== expectedRuleVersion || bundle.ruleVersion !== RUNTIME_RULE_VERSION) {
    return Object.freeze({ status: 'QUARANTINED', reason: 'RULE_VERSION_MISMATCH', replayMatched: false, externalActionsExecuted: false });
  }
  if (!verifyRuntimeJournal(bundle.journal)) {
    return Object.freeze({ status: 'QUARANTINED', reason: 'JOURNAL_INTEGRITY_FAILURE', replayMatched: false, externalActionsExecuted: false });
  }
  const invalidCheckpoint = (bundle.checkpoints ?? []).some((checkpoint) => !verifyRuntimeCheckpoint(checkpoint, bundle.journal));
  if (invalidCheckpoint) {
    return Object.freeze({ status: 'QUARANTINED', reason: 'CHECKPOINT_INTEGRITY_FAILURE', replayMatched: false, externalActionsExecuted: false });
  }
  const finalState = projectRuntimeState(bundle.journal);
  const replayFinalStateHash = hash(finalState);
  const replayJournalHash = hash(bundle.journal);
  const replayMatched = replayFinalStateHash === bundle.finalStateHash && replayJournalHash === bundle.journalHash;
  return Object.freeze({
    status: replayMatched ? 'REPLAY_MATCHED' : 'QUARANTINED',
    reason: replayMatched ? null : 'REPLAY_HASH_MISMATCH',
    replayMatched,
    finalState,
    replayFinalStateHash,
    replayJournalHash,
    externalActionsExecuted: false
  });
}

export function planResumeFromCheckpoint(bundleInput, checkpointLabel) {
  const bundle = requireObject(bundleInput, 'evidenceBundle');
  const label = requireString(checkpointLabel, 'checkpointLabel');
  const checkpoint = (bundle.checkpoints ?? []).find((item) => item.label === label);
  if (!checkpoint) throw new RuntimeValidationError('Checkpoint not found', { label });
  if (!verifyRuntimeCheckpoint(checkpoint, bundle.journal)) throw new RuntimeValidationError('Checkpoint integrity verification failed', { label });
  return Object.freeze({
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    ruleVersion: RUNTIME_RULE_VERSION,
    runId: bundle.inputSummary.runId,
    checkpointLabel: label,
    resumeAfterSequence: checkpoint.sequence,
    journalHead: checkpoint.journalHead,
    state: 'RESUME_PLANNED_SHADOW',
    executionAllowed: false,
    networkAllowed: false,
    liveActionsAllowed: false,
    humanApprovalRequired: true
  });
}

export function compareRuntimeBundles(leftInput, rightInput) {
  const left = requireObject(leftInput, 'leftBundle');
  const right = requireObject(rightInput, 'rightBundle');
  return Object.freeze({
    sameInputHash: left.inputHash === right.inputHash,
    sameJournalHash: left.journalHash === right.journalHash,
    sameFinalStateHash: left.finalStateHash === right.finalStateHash,
    sameBundleHash: left.bundleHash === right.bundleHash,
    deterministic: left.inputHash === right.inputHash && left.journalHash === right.journalHash && left.finalStateHash === right.finalStateHash && left.bundleHash === right.bundleHash
  });
}

export function runtimeEvidenceContainsForbiddenMaterial(bundleInput) {
  const text = canonicalJson(requireObject(bundleInput, 'bundle'));
  return /(bearer\s+|access[_-]?token|client[_-]?secret\s*[:=]\s*["'][^"']+|password\s*[:=]\s*["'][^"']+|https?:\/\/)/i.test(text);
}

export function buildRuntimePortfolioReadiness(bundleInput, providerManifests) {
  const bundle = requireObject(bundleInput, 'bundle');
  requireBoolean(bundle.externalActions.networkUsed, 'externalActions.networkUsed');
  const connectorPortfolio = buildConnectorPortfolioReadiness(providerManifests);
  return Object.freeze({
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    ruleVersion: RUNTIME_RULE_VERSION,
    runtimeStatus: bundle.finalState.status,
    journalValid: verifyRuntimeJournal(bundle.journal),
    replayMatched: replayRuntimeEvidence(bundle).replayMatched,
    connectorPortfolio,
    readyForLive: false,
    readyForAuthorizedSandboxRuntime: false,
    externalActionsExecuted: false
  });
}
