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
import { evaluateOperationalState, gateShadowJobs } from './operations.mjs';
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

const PROVIDER_BY_PLATFORM = Object.freeze({
  tiktok: 'tiktok',
  instagram_reels: 'meta',
  youtube_shorts: 'youtube'
});
const FORBIDDEN_KEY = /(token|password|authorization|api[_-]?key|access[_-]?key|private[_-]?key)/i;
const HASH_PATTERN = /^[a-f0-9]{64}$/;

export class RuntimeValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RuntimeValidationError';
    this.details = details;
  }
}

function object(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RuntimeValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function string(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new RuntimeValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function timestamp(value, field) {
  const result = string(value, field);
  if (!result.includes('T') || !Number.isFinite(Date.parse(result))) {
    throw new RuntimeValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return result;
}

function enumValue(value, field, allowed) {
  const result = string(value, field);
  if (!allowed.includes(result)) throw new RuntimeValidationError(`Unsupported value: ${field}`, { field, value: result, allowed });
  return result;
}

function digest(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function stableId(prefix, value) {
  return `${prefix}_${digest(value).slice(0, 20)}`;
}

function plus(base, milliseconds) {
  return new Date(Date.parse(base) + milliseconds).toISOString();
}

function inspectSensitive(value, path = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectSensitive(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key) && key !== 'secretRequirements' && child != null && child !== '') {
      throw new RuntimeValidationError('Credential value is forbidden in runtime input', { path: `${path}.${key}` });
    }
    inspectSensitive(child, `${path}.${key}`);
  }
}

function normalizeProvider(manifest) {
  const value = object(manifest, 'providerManifest');
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    providerId: string(value.providerId, 'providerId'),
    displayName: string(value.displayName, 'displayName'),
    adapterClass: string(value.adapterClass, 'adapterClass'),
    authState: string(value.authState, 'authState'),
    accountAlias: string(value.accountAlias, 'accountAlias'),
    capabilities: Object.freeze([...(value.capabilities ?? [])].map(String).sort()),
    secretRequirements: Object.freeze([...(value.secretRequirements ?? [])].map((item) => Object.freeze({
      name: string(item.name, 'secretRequirement.name'),
      required: item.required === true,
      status: string(item.status, 'secretRequirement.status')
    })).sort((left, right) => left.name.localeCompare(right.name)))
  });
}

export function validateRuntimeInput(raw) {
  const input = object(raw, 'runtimeInput');
  if (input.schemaVersion !== RUNTIME_SCHEMA_VERSION) throw new RuntimeValidationError('runtimeInput.schemaVersion must be 1');
  inspectSensitive(input);
  const providers = Array.isArray(input.providerManifests) ? input.providerManifests.map(normalizeProvider) : [];
  if (providers.length === 0) throw new RuntimeValidationError('providerManifests must not be empty');
  if (new Set(providers.map((item) => item.providerId)).size !== providers.length) throw new RuntimeValidationError('Duplicate provider manifest');
  return Object.freeze({
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    runId: string(input.runId, 'runId'),
    tenantId: string(input.tenantId, 'tenantId'),
    projectId: string(input.projectId, 'projectId'),
    scenario: enumValue(input.scenario, 'scenario', RUNTIME_SCENARIOS),
    timestamp: timestamp(input.timestamp, 'timestamp'),
    episodePackage: object(input.episodePackage, 'episodePackage'),
    metrics: object(input.metrics, 'metrics'),
    baseline: object(input.baseline, 'baseline'),
    providerManifests: Object.freeze(providers.sort((left, right) => left.providerId.localeCompare(right.providerId))),
    operationsConfig: object(input.operationsConfig, 'operationsConfig'),
    incidents: Object.freeze(Array.isArray(input.incidents) ? input.incidents.map((item) => object(item, 'incident')) : []),
    faultFixture: input.faultFixture == null ? null : object(input.faultFixture, 'faultFixture')
  });
}

export function appendRuntimeEvent(journal, rawEvent) {
  if (!Array.isArray(journal)) throw new RuntimeValidationError('Runtime journal must be an array');
  const event = object(rawEvent, 'runtimeEvent');
  const sequence = journal.length + 1;
  const previousHash = journal.length === 0 ? '0'.repeat(64) : journal.at(-1).hash;
  const record = Object.freeze({
    sequence,
    eventId: string(event.eventId, 'eventId'),
    traceId: string(event.traceId, 'traceId'),
    correlationId: string(event.correlationId, 'correlationId'),
    causationId: journal.length === 0 ? null : journal.at(-1).eventId,
    module: string(event.module, 'module'),
    type: string(event.type, 'type'),
    occurredAt: timestamp(event.occurredAt, 'occurredAt'),
    data: Object.freeze(event.data ?? {}),
    previousHash
  });
  inspectSensitive(record.data, `journal.${sequence}.data`);
  return Object.freeze([...journal, Object.freeze({ ...record, hash: digest(record) })]);
}

export function verifyRuntimeJournal(journal) {
  if (!Array.isArray(journal)) return false;
  let previousHash = '0'.repeat(64);
  const ids = new Set();
  for (let index = 0; index < journal.length; index += 1) {
    const entry = journal[index];
    if (entry.sequence !== index + 1 || entry.previousHash !== previousHash) return false;
    if (ids.has(entry.eventId)) return false;
    ids.add(entry.eventId);
    if (entry.causationId !== (index === 0 ? null : journal[index - 1].eventId)) return false;
    const { hash, ...record } = entry;
    if (!HASH_PATTERN.test(hash) || digest(record) !== hash) return false;
    previousHash = hash;
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
    domainEventCount: 0,
    operationsMode: null,
    connectorPlanCount: 0,
    simulationCount: 0,
    backoffCount: 0,
    authBlockedCount: 0,
    webhookReplayDetected: false,
    signalBriefCreated: false,
    cockpitGenerated: false,
    growthScore: null,
    growthClassification: null,
    blockReasons: [],
    externalActionsExecuted: false
  };
  for (const event of journal) {
    if (event.type === 'RUN_STARTED') state.scenario = event.data.scenario;
    if (event.type === 'CORE_COMPLETED') {
      state.episodePackageId = event.data.episodePackageId;
      state.variantCount = event.data.variantCount;
      state.growthScore = event.data.growthScore;
      state.growthClassification = event.data.growthClassification;
    }
    if (event.type === 'DATA_LAYER_VERIFIED') state.domainEventCount = event.data.domainEventCount;
    if (event.type === 'ORCHESTRATOR_COMPLETED') state.workflowTaskCount = event.data.workflowTaskCount;
    if (event.type === 'OPERATIONS_EVALUATED') state.operationsMode = event.data.effectiveMode;
    if (event.type === 'SIGNAL_BRIEF_CREATED') state.signalBriefCreated = true;
    if (event.type === 'CONNECTOR_PLAN_REGISTERED') state.connectorPlanCount += 1;
    if (event.type === 'CONNECTOR_SIMULATED') state.simulationCount += 1;
    if (event.type === 'CONNECTOR_BACKOFF') state.backoffCount += 1;
    if (event.type === 'CONNECTOR_AUTH_BLOCKED') state.authBlockedCount += 1;
    if (event.type === 'WEBHOOK_REPLAY_DETECTED') state.webhookReplayDetected = true;
    if (event.type === 'COCKPIT_GENERATED') state.cockpitGenerated = true;
    if (event.type === 'RUN_BLOCKED') {
      state.status = event.data.status;
      state.blockReasons.push(...event.data.reasons);
    }
    if (event.type === 'RUN_QUARANTINED') {
      state.status = 'QUARANTINED';
      state.blockReasons.push(...event.data.reasons);
    }
    if (event.type === 'RUN_COMPLETED') state.status = event.data.status;
  }
  return Object.freeze({ ...state, blockReasons: Object.freeze([...new Set(state.blockReasons)].sort()) });
}

export function createRuntimeCheckpoint(journal, label) {
  if (!verifyRuntimeJournal(journal) || journal.length === 0) throw new RuntimeValidationError('Checkpoint requires a valid journal');
  const material = Object.freeze({
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    ruleVersion: RUNTIME_RULE_VERSION,
    label: string(label, 'label'),
    sequence: journal.length,
    journalHead: journal.at(-1).hash,
    projectedStateHash: digest(projectRuntimeState(journal))
  });
  return Object.freeze({ ...material, hash: digest(material) });
}

export function verifyRuntimeCheckpoint(checkpoint, journal) {
  try {
    const value = object(checkpoint, 'checkpoint');
    if (!verifyRuntimeJournal(journal) || value.ruleVersion !== RUNTIME_RULE_VERSION) return false;
    if (!Number.isInteger(value.sequence) || value.sequence < 1 || value.sequence > journal.length) return false;
    const prefix = journal.slice(0, value.sequence);
    const { hash, ...material } = value;
    return prefix.at(-1).hash === value.journalHead && digest(material) === hash && digest(projectRuntimeState(prefix)) === value.projectedStateHash;
  } catch {
    return false;
  }
}

function add(journal, context, module, type, occurredAt, data) {
  return appendRuntimeEvent(journal, {
    eventId: stableId('evt', { traceId: context.traceId, sequence: journal.length + 1, module, type, data }),
    traceId: context.traceId,
    correlationId: context.correlationId,
    module,
    type,
    occurredAt,
    data
  });
}

function campaignFor(input, variants) {
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
      windowStart: plus(input.timestamp, 60_000),
      windowEnd: plus(input.timestamp, 3_600_000),
      dependencies: [],
      riskFlags: []
    }))
  };
}

function completeWorkflow(plan, at) {
  let tasks = plan.tasks;
  for (const step of ['PACKAGING', 'QA', 'APPROVAL', 'SCHEDULING']) {
    tasks = unlockReadyTasks(tasks, at);
    tasks = tasks.map((task) => {
      if (task.step !== step || task.state !== 'READY') return task;
      if (task.requiresHuman) {
        const waiting = transitionWorkflowTask(task, 'WAITING_HUMAN', at, 'SYNTHETIC_RUNTIME_HUMAN_GATE');
        return transitionWorkflowTask(waiting, 'COMPLETED', at, 'SYNTHETIC_HUMAN_APPROVAL_FIXTURE');
      }
      const running = transitionWorkflowTask(task, 'RUNNING', at, 'SYNTHETIC_RUNTIME_START');
      return transitionWorkflowTask(running, 'COMPLETED', at, 'SYNTHETIC_RUNTIME_COMPLETE');
    });
  }
  return unlockReadyTasks(tasks, at);
}

function domainEvents(input, core, schedulerJobs) {
  const common = {
    schemaVersion: 1,
    tenantId: input.tenantId,
    projectId: input.projectId,
    occurredAt: input.timestamp,
    actor: 'mkt0-shadow-runtime',
    mode: 'shadow'
  };
  return Object.freeze([
    createDomainEvent({ ...common, id: `domain:${input.runId}:campaign`, stream: `campaign:${input.runId}`, sequence: 1, type: 'CAMPAIGN_CREATED', payload: { campaignId: `campaign_${input.runId}`, name: `Synthetic Runtime ${input.scenario}`, status: 'ACTIVE' } }),
    createDomainEvent({ ...common, id: `domain:${input.runId}:content`, stream: `content:${core.episode.id}`, sequence: 1, type: 'CONTENT_REGISTERED', payload: { contentId: `content_${core.episode.id}`, campaignId: `campaign_${input.runId}`, episodePackageId: core.episode.id, title: core.episode.title, status: 'READY' } }),
    ...core.variants.map((variant) => createDomainEvent({ ...common, id: `domain:${input.runId}:variant:${variant.platform}`, stream: `variant:${variant.id}`, sequence: 1, type: 'VARIANT_PLANNED', payload: { variantId: variant.id, contentId: `content_${core.episode.id}`, platform: variant.platform, status: 'PLANNED' } })),
    ...schedulerJobs.map((job) => createDomainEvent({ ...common, id: `domain:${input.runId}:job:${job.platform}`, stream: `publish-job:${job.id}`, sequence: 1, type: 'PUBLISH_JOB_RECORDED', payload: { publishJobId: job.id, variantId: job.variantId, state: 'APPROVED_SHADOW' } })),
    createDomainEvent({ ...common, id: `domain:${input.runId}:metric`, stream: `metric:${core.variants[0].id}`, sequence: 1, type: 'METRIC_SNAPSHOT_RECORDED', payload: { metricSnapshotId: `metric_${input.runId}`, variantId: core.variants[0].id, platform: core.variants[0].platform, capturedAt: input.timestamp, metrics: { views: input.metrics.views, watchSeconds: input.metrics.averageWatchSeconds * input.metrics.views, shares: input.metrics.shares, comments: input.metrics.comments, followersGained: input.metrics.followersGained } } }),
    createDomainEvent({ ...common, id: `domain:${input.runId}:brief`, stream: `brief:${core.productionBrief.id}`, sequence: 1, type: 'PRODUCTION_BRIEF_REGISTERED', payload: { productionBriefId: core.productionBrief.id, sourceAnalysisId: `analysis_${input.runId}`, priority: core.productionBrief.priority === 'high' ? 'HIGH' : 'NORMAL', recommendations: core.productionBrief.recommendations.length ? core.productionBrief.recommendations : ['NO_CHANGE'] } })
  ]);
}

function signalBrief(input, variantId) {
  const signals = [1, 2].map((number) => ({
    schemaVersion: 1,
    id: `signal_${input.runId}_${number}`,
    tenantId: input.tenantId,
    projectId: input.projectId,
    variantId,
    platform: 'tiktok',
    observedAt: plus(input.timestamp, 120_000 + number),
    provenance: 'synthetic_fixture',
    authorRef: number === 1 ? 'anon_1234abcd' : 'anon_5678abcd',
    text: 'Bitte eine Folge über den verlorenen DJ USB machen',
    topics: ['dj usb'],
    characterIds: ['char_ricco']
  }));
  const aggregate = aggregateCommunitySignals(signals);
  return buildDailySignalBrief({ communityAggregate: aggregate, opportunities: [], asOf: plus(input.timestamp, 123_000) });
}

function cockpitFor(input, core, dailyPlan, signals, journal, operations) {
  const winner = ['WINNER', 'OUTLIER'].includes(core.analysis.classification);
  return buildCockpitViewModel({
    asOf: plus(input.timestamp, 180_000),
    scope: { tenantId: input.tenantId, projectId: input.projectId },
    growthBrief: {
      schemaVersion: 1,
      ruleVersion: 'mkt0-003.v1',
      asOf: plus(input.timestamp, 170_000),
      counts: { total: core.variants.length, analyzed: core.variants.length, held: 0, winners: winner ? 1 : 0 },
      topWinners: winner ? [{ snapshotId: `snapshot_${input.runId}`, score: core.analysis.score, classification: core.analysis.classification }] : [],
      alerts: [],
      recommendations: core.analysis.recommendedActions,
      provenance: 'synthetic_or_authorized_input_only'
    },
    analyses: core.variants.map((variant) => ({
      snapshotId: `snapshot_${input.runId}_${variant.platform}`,
      variantId: variant.id,
      platform: variant.platform,
      seriesId: core.episode.seriesId,
      status: 'ANALYZED',
      score: core.analysis.score,
      classification: core.analysis.classification,
      quality: { warnings: ['SYNTHETIC_DATA_NO_REAL_WORLD_CLAIM'], critical: [] },
      anomalies: [],
      recommendations: core.analysis.recommendedActions.map((code) => ({ code, priority: 'HIGH', ruleId: 'MKT0-009-CORE', reason: 'Synthetic integrated runtime recommendation.' }))
    })),
    signalBrief: signals,
    dailyPlan: { ...dailyPlan, provenance: 'synthetic_fixture' },
    hypotheses: [{ hypothesisId: `hyp_${input.runId}`, statement: 'Synthetic integrated runtime output merits a controlled shadow follow-up.', confidence: 0.5, status: 'TESTING', sourceRef: `analysis_${input.runId}` }],
    systemHealth: {
      ruleVersion: RUNTIME_RULE_VERSION,
      asOf: plus(input.timestamp, 175_000),
      provenance: 'synthetic_fixture',
      components: [
        { component: 'runtime-journal', status: 'PASS', checkedAt: plus(input.timestamp, 175_000), evidenceRef: 'growth-os/evidence/MKT0-009.md' },
        { component: 'operations-gate', status: operations.shadowJobsAllowed ? 'PASS' : 'WARN', checkedAt: plus(input.timestamp, 175_000), evidenceRef: 'growth-os/evidence/MKT0-007.md' }
      ]
    },
    auditEntries: journal.map((event) => ({ id: event.eventId, occurredAt: event.occurredAt, status: 'PASS', code: event.type, reference: event.module, hash: event.hash }))
  });
}

function summary(input) {
  return Object.freeze({
    runId: input.runId,
    scenario: input.scenario,
    tenantId: input.tenantId,
    projectId: input.projectId,
    timestamp: input.timestamp,
    episodePackageId: input.episodePackage.id,
    providers: Object.freeze(input.providerManifests.map((provider) => Object.freeze({ providerId: provider.providerId, accountAlias: provider.accountAlias, authState: provider.authState, capabilities: provider.capabilities, secretRequirements: provider.secretRequirements }))),
    operationsMode: input.operationsConfig.mode,
    globalKillSwitch: input.operationsConfig.globalKillSwitch,
    incidentCount: input.incidents.length,
    faultFixture: input.faultFixture == null ? null : Object.freeze({ type: input.faultFixture.type ?? 'DECLARATIVE_FIXTURE' }),
    synthetic: true
  });
}

function bundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, cockpit) {
  if (!verifyRuntimeJournal(journal)) throw new RuntimeValidationError('Runtime journal invalid before evidence bundle creation');
  const finalState = projectRuntimeState(journal);
  const material = Object.freeze({
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    ruleVersion: RUNTIME_RULE_VERSION,
    traceId: context.traceId,
    correlationId: context.correlationId,
    inputSummary,
    inputHash,
    journal,
    checkpoints: Object.freeze(checkpoints),
    finalState,
    eventStoreHead: storedEvents.at(-1)?.hash ?? null,
    connectorSummary: connectorOutputs == null ? null : Object.freeze(connectorOutputs.map((item) => Object.freeze({ providerId: item.providerId, planId: item.plan?.id ?? null, rateLimitDecision: item.rateLimit?.decision ?? null, simulationState: item.simulation?.state ?? null }))),
    cockpitSummary: cockpit == null ? null : Object.freeze({ ruleVersion: cockpit.ruleVersion, sections: cockpit.navigation.length, readOnly: cockpit.capabilities.readOnly }),
    externalActions: Object.freeze({ networkUsed: false, oauthConnected: false, livePublishing: false, publicReplies: false, deletes: false, directMessages: false, realImports: false }),
    nonClaims: Object.freeze(['NO_PROVIDER_RUNTIME_VERIFIED', 'NO_REAL_PLATFORM_DATA', 'NO_OAUTH_CONNECTED', 'NO_LIVE_ACTION_EXECUTED', 'NO_CANON_OR_PRODUCTION_CHANGE'])
  });
  return Object.freeze({ ...material, journalHash: digest(journal), finalStateHash: digest(finalState), bundleHash: digest(material), replayStatus: 'NOT_YET_REPLAYED' });
}

export function runIntegratedShadowRuntime(rawInput) {
  const input = validateRuntimeInput(rawInput);
  const inputSummary = summary(input);
  const inputHash = digest(inputSummary);
  const context = Object.freeze({ traceId: stableId('trace', { runId: input.runId, inputHash, ruleVersion: RUNTIME_RULE_VERSION }), correlationId: stableId('corr', { tenantId: input.tenantId, projectId: input.projectId, runId: input.runId }) });
  const checkpoints = [];
  let journal = [];
  journal = add(journal, context, 'runtime', 'RUN_STARTED', input.timestamp, { runId: input.runId, scenario: input.scenario, inputHash, ruleVersion: RUNTIME_RULE_VERSION });

  const core = runShadowPipeline({ episodePackage: input.episodePackage, metrics: input.metrics, baseline: input.baseline, timestamp: plus(input.timestamp, 1_000) });
  journal = add(journal, context, 'core', 'CORE_COMPLETED', plus(input.timestamp, 2_000), { episodePackageId: core.episode.id, variantCount: core.variants.length, growthScore: core.analysis.score, growthClassification: core.analysis.classification, auditValid: core.auditValid, liveActionsExecuted: false });

  const campaign = campaignFor(input, core.variants);
  const workflowPlan = buildWorkflowPlan(campaign);
  const tasks = completeWorkflow(workflowPlan, plus(input.timestamp, 3_000));
  const scheduler = simulateScheduler({ workflowPlan, tasks, asOf: plus(input.timestamp, 120_000) });
  const dailyPlan = buildDailyMarketingPlan({ workflowPlan, tasks, asOf: plus(input.timestamp, 120_000) });
  journal = add(journal, context, 'orchestrator', 'ORCHESTRATOR_COMPLETED', plus(input.timestamp, 4_000), { campaignId: campaign.id, workflowTaskCount: tasks.length, schedulerJobCount: scheduler.jobs.length, humanApprovals: dailyPlan.summary.humanApprovals, publicActionsExecuted: false });

  const storedEvents = appendStoredEvents([], domainEvents(input, core, scheduler.jobs), { tenantId: input.tenantId, projectId: input.projectId });
  journal = add(journal, context, 'data', 'DATA_LAYER_VERIFIED', plus(input.timestamp, 5_000), { domainEventCount: storedEvents.length, valid: verifyStoredEvents(storedEvents, { tenantId: input.tenantId, projectId: input.projectId }), eventStoreHead: storedEvents.at(-1)?.hash ?? null });

  const signals = signalBrief(input, core.variants[0].id);
  journal = add(journal, context, 'signals', 'SIGNAL_BRIEF_CREATED', plus(input.timestamp, 6_000), { signalCount: signals.community.signalCount, opportunityCount: signals.opportunities.length, replyMode: signals.replyMode, publicActionsExecuted: false });

  let incidents = input.incidents;
  if (input.scenario === 'INCIDENT_LOCKDOWN' && incidents.length === 0) incidents = [{ schemaVersion: 1, id: `incident_${input.runId}`, tenantId: input.tenantId, projectId: input.projectId, severity: 'SEV1', category: 'DATA_INTEGRITY', status: 'OPEN', detectedAt: plus(input.timestamp, 7_000), resolvedAt: null, summary: 'Synthetic runtime incident lockdown fixture', evidenceRefs: ['evidence://mkt0-009/incident-lockdown'], humanOwner: 'runtime_operator' }];
  const operations = evaluateOperationalState(input.operationsConfig, incidents);
  journal = add(journal, context, 'operations', 'OPERATIONS_EVALUATED', plus(input.timestamp, 8_000), { effectiveMode: operations.effectiveMode, shadowJobsAllowed: operations.shadowJobsAllowed, reasons: operations.reasons, activeIncidentCount: operations.activeIncidentCount, liveActionsAllowed: false });
  checkpoints.push(createRuntimeCheckpoint(journal, 'AFTER_OPERATIONS_GATE'));

  const gatedJobs = gateShadowJobs(scheduler.jobs, operations);
  if (!operations.shadowJobsAllowed) {
    journal = add(journal, context, 'runtime', 'RUN_BLOCKED', plus(input.timestamp, 9_000), { status: 'BLOCKED_INCIDENT', reasons: operations.reasons.length ? operations.reasons : [operations.effectiveMode], connectorPlanningStarted: false, externalActionsExecuted: false });
    return bundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, null, null);
  }

  const providers = new Map(input.providerManifests.map((provider) => [provider.providerId, provider]));
  const connectorOutputs = [];
  const idempotencyKeys = [];
  let replayDetected = false;
  for (let index = 0; index < gatedJobs.length; index += 1) {
    const job = gatedJobs[index];
    if (job.operationsGate !== 'ALLOWED_SHADOW') continue;
    const providerId = PROVIDER_BY_PLATFORM[job.platform];
    let provider = providers.get(providerId);
    if (!provider) throw new RuntimeValidationError('Missing provider manifest', { providerId, platform: job.platform });
    if (input.scenario === 'AUTH_BLOCKED' && index === 0) provider = Object.freeze({ ...provider, authState: 'DISCONNECTED' });
    const readiness = buildConnectorReadiness(provider);
    if (readiness.status !== 'SANDBOX_READY') {
      journal = add(journal, context, 'connectors', 'CONNECTOR_AUTH_BLOCKED', plus(input.timestamp, 10_000 + index), { providerId, platform: job.platform, reasons: readiness.reasons, liveReady: false });
      continue;
    }
    const plan = buildRequestPlan({ manifest: provider, capability: 'PUBLISH', method: 'POST', path: `/sandbox/${providerId}/publish`, payload: { variantAlias: `sandbox_variant_${index + 1}`, publishJobAlias: `sandbox_job_${index + 1}` }, tenantId: input.tenantId, projectId: input.projectId, requestedAt: plus(input.timestamp, 11_000 + index), idempotencySeed: `${input.runId}:${job.id}` });
    const registration = registerShadowPlan(plan, idempotencyKeys);
    if (!registration.accepted) continue;
    idempotencyKeys.push(plan.idempotencyKey);
    journal = add(journal, context, 'connectors', 'CONNECTOR_PLAN_REGISTERED', plus(input.timestamp, 12_000 + index), { providerId, platform: job.platform, planId: plan.id, payloadHash: plan.payloadHash, idempotencyKey: plan.idempotencyKey, state: plan.state, networkAllowed: false });
    const rateLimit = evaluateRateLimitBudget({ limit: 100, used: input.scenario === 'RATE_LIMIT' && index === 0 ? 100 : 10, requestedUnits: 1, windowStartedAt: input.timestamp, windowSeconds: 3600, asOf: plus(input.timestamp, 13_000 + index) });
    if (rateLimit.decision === 'BACKOFF') {
      journal = add(journal, context, 'connectors', 'CONNECTOR_BACKOFF', plus(input.timestamp, 14_000 + index), { providerId, planId: plan.id, retryAfterSeconds: rateLimit.retryAfterSeconds, executionAllowed: false });
      connectorOutputs.push(Object.freeze({ providerId, plan, rateLimit, simulation: null }));
      continue;
    }
    const simulation = simulateProviderRequest(plan, { resultCode: 'SYNTHETIC_ACCEPTED' });
    const publishEnvelope = normalizePublishEnvelope({ providerId, accountAlias: provider.accountAlias, sourceRequestId: plan.id, observedAt: plus(input.timestamp, 15_000 + index), provenance: 'synthetic_fixture', remoteObjectAlias: `sandbox_media_${index + 1}`, publishState: 'ACCEPTED_SHADOW' });
    const metricEnvelope = normalizeMetricEnvelope({ providerId, accountAlias: provider.accountAlias, sourceRequestId: plan.id, observedAt: plus(input.timestamp, 16_000 + index), provenance: 'synthetic_fixture', remoteObjectAlias: `sandbox_media_${index + 1}`, metrics: { views: input.metrics.views, likes: Math.floor(input.metrics.views * 0.08), comments: input.metrics.comments, shares: input.metrics.shares, watchSeconds: Math.round(input.metrics.averageWatchSeconds * input.metrics.views) } });
    journal = add(journal, context, 'connectors', 'CONNECTOR_SIMULATED', plus(input.timestamp, 17_000 + index), { providerId, planId: plan.id, simulationId: simulation.simulationId, state: simulation.state, publishState: publishEnvelope.publishState, metricViews: metricEnvelope.metrics.views, networkUsed: false, liveActionPerformed: false });
    connectorOutputs.push(Object.freeze({ providerId, plan, rateLimit, simulation, publishEnvelope, metricEnvelope }));
    if (input.scenario === 'WEBHOOK_REPLAY' && index === 0) {
      const webhook = { providerId, accountAlias: provider.accountAlias, eventId: `webhook_${input.runId}`, eventType: 'media.status.updated', occurredAt: plus(input.timestamp, 18_000), receivedAt: plus(input.timestamp, 19_000), signatureStatus: 'SIMULATED_VALID' };
      validateWebhookEnvelope(webhook, { asOf: plus(input.timestamp, 20_000) });
      try {
        validateWebhookEnvelope(webhook, { asOf: plus(input.timestamp, 20_000), seenEventIds: [webhook.eventId] });
      } catch (error) {
        replayDetected = true;
        journal = add(journal, context, 'connectors', 'WEBHOOK_REPLAY_DETECTED', plus(input.timestamp, 21_000), { providerId, eventId: webhook.eventId, errorClass: error.name, quarantined: true });
      }
      break;
    }
  }
  checkpoints.push(createRuntimeCheckpoint(journal, 'AFTER_CONNECTOR_STAGE'));

  if (replayDetected) {
    journal = add(journal, context, 'runtime', 'RUN_QUARANTINED', plus(input.timestamp, 22_000), { reasons: ['WEBHOOK_REPLAY_DETECTED'], externalActionsExecuted: false });
    return bundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, null);
  }
  if (input.scenario === 'AUTH_BLOCKED') {
    journal = add(journal, context, 'runtime', 'RUN_BLOCKED', plus(input.timestamp, 23_000), { status: 'BLOCKED_AUTH', reasons: ['CONNECTOR_AUTH_NOT_READY'], externalActionsExecuted: false });
    return bundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, null);
  }

  const cockpit = cockpitFor(input, core, dailyPlan, signals, journal, operations);
  journal = add(journal, context, 'cockpit', 'COCKPIT_GENERATED', plus(input.timestamp, 24_000), { ruleVersion: cockpit.ruleVersion, sectionCount: cockpit.navigation.length, readOnly: cockpit.capabilities.readOnly, mutations: cockpit.capabilities.mutations, networkRequests: cockpit.capabilities.networkRequests, publicActionsExecuted: false });
  journal = add(journal, context, 'runtime', 'RUN_COMPLETED', plus(input.timestamp, 25_000), { status: input.scenario === 'RATE_LIMIT' ? 'COMPLETED_WITH_BACKOFF' : 'COMPLETED', connectorPlanCount: connectorOutputs.length, externalActionsExecuted: false });
  return bundle(input, inputSummary, inputHash, context, journal, checkpoints, storedEvents, connectorOutputs, cockpit);
}

export function replayRuntimeEvidence(rawBundle, expectedRuleVersion = RUNTIME_RULE_VERSION) {
  const evidence = object(rawBundle, 'evidenceBundle');
  if (evidence.ruleVersion !== expectedRuleVersion || evidence.ruleVersion !== RUNTIME_RULE_VERSION) return Object.freeze({ status: 'QUARANTINED', reason: 'RULE_VERSION_MISMATCH', replayMatched: false, externalActionsExecuted: false });
  if (!verifyRuntimeJournal(evidence.journal)) return Object.freeze({ status: 'QUARANTINED', reason: 'JOURNAL_INTEGRITY_FAILURE', replayMatched: false, externalActionsExecuted: false });
  if ((evidence.checkpoints ?? []).some((checkpoint) => !verifyRuntimeCheckpoint(checkpoint, evidence.journal))) return Object.freeze({ status: 'QUARANTINED', reason: 'CHECKPOINT_INTEGRITY_FAILURE', replayMatched: false, externalActionsExecuted: false });
  const finalState = projectRuntimeState(evidence.journal);
  const finalStateHash = digest(finalState);
  const journalHash = digest(evidence.journal);
  const replayMatched = finalStateHash === evidence.finalStateHash && journalHash === evidence.journalHash;
  return Object.freeze({ status: replayMatched ? 'REPLAY_MATCHED' : 'QUARANTINED', reason: replayMatched ? null : 'REPLAY_HASH_MISMATCH', replayMatched, finalState, replayFinalStateHash: finalStateHash, replayJournalHash: journalHash, externalActionsExecuted: false });
}

export function planResumeFromCheckpoint(rawBundle, checkpointLabel) {
  const evidence = object(rawBundle, 'evidenceBundle');
  const label = string(checkpointLabel, 'checkpointLabel');
  const checkpoint = (evidence.checkpoints ?? []).find((item) => item.label === label);
  if (!checkpoint) throw new RuntimeValidationError('Checkpoint not found', { label });
  if (!verifyRuntimeCheckpoint(checkpoint, evidence.journal)) throw new RuntimeValidationError('Checkpoint integrity verification failed', { label });
  return Object.freeze({ schemaVersion: RUNTIME_SCHEMA_VERSION, ruleVersion: RUNTIME_RULE_VERSION, runId: evidence.inputSummary.runId, checkpointLabel: label, resumeAfterSequence: checkpoint.sequence, journalHead: checkpoint.journalHead, state: 'RESUME_PLANNED_SHADOW', executionAllowed: false, networkAllowed: false, liveActionsAllowed: false, humanApprovalRequired: true });
}

export function compareRuntimeBundles(leftInput, rightInput) {
  const left = object(leftInput, 'leftBundle');
  const right = object(rightInput, 'rightBundle');
  const result = { sameInputHash: left.inputHash === right.inputHash, sameJournalHash: left.journalHash === right.journalHash, sameFinalStateHash: left.finalStateHash === right.finalStateHash, sameBundleHash: left.bundleHash === right.bundleHash };
  return Object.freeze({ ...result, deterministic: Object.values(result).every(Boolean) });
}

export function runtimeEvidenceContainsForbiddenMaterial(rawBundle) {
  const text = canonicalJson(object(rawBundle, 'bundle'));
  return /(bearer\s+|access[_-]?token\s*[:=]|password\s*[:=]\s*["'][^"']+|https?:\/\/)/i.test(text);
}

export function buildRuntimePortfolioReadiness(rawBundle, providerManifests) {
  const evidence = object(rawBundle, 'bundle');
  const connectorPortfolio = buildConnectorPortfolioReadiness(providerManifests);
  return Object.freeze({ schemaVersion: RUNTIME_SCHEMA_VERSION, ruleVersion: RUNTIME_RULE_VERSION, runtimeStatus: evidence.finalState.status, journalValid: verifyRuntimeJournal(evidence.journal), replayMatched: replayRuntimeEvidence(evidence).replayMatched, connectorPortfolio, readyForLive: false, readyForAuthorizedSandboxRuntime: false, externalActionsExecuted: false });
}
