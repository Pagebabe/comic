import { createHash } from 'node:crypto';

export const ORCHESTRATOR_SCHEMA_VERSION = 1;
export const ORCHESTRATOR_MODE = 'shadow';
export const ORCHESTRATOR_RULE_VERSION = 'mkt0-005.v1';

export const WORKFLOW_STEPS = Object.freeze([
  'PACKAGING',
  'QA',
  'APPROVAL',
  'SCHEDULING',
  'SHADOW_PUBLISH',
  'MONITORING',
  'ITERATION'
]);

export const TASK_TRANSITIONS = Object.freeze({
  BLOCKED: ['READY', 'CANCELLED'],
  READY: ['RUNNING', 'WAITING_HUMAN', 'CANCELLED'],
  RUNNING: ['COMPLETED', 'WAITING_HUMAN', 'RETRY_WAIT', 'DEAD_LETTER', 'CANCELLED'],
  WAITING_HUMAN: ['READY', 'COMPLETED', 'CANCELLED'],
  RETRY_WAIT: ['READY', 'DEAD_LETTER', 'CANCELLED'],
  COMPLETED: [],
  DEAD_LETTER: [],
  CANCELLED: []
});

export const RISK_FLAGS = Object.freeze([
  'RIGHTS_UNKNOWN',
  'SENSITIVE_CONTENT',
  'COLLABORATION',
  'CRISIS',
  'NEW_FORMAT'
]);

const PLATFORMS = Object.freeze(['tiktok', 'instagram_reels', 'youtube_shorts']);
const PRIORITIES = Object.freeze(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);
const CAMPAIGN_STATUSES = Object.freeze(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']);
const RETRY_DELAYS_SECONDS = Object.freeze([60, 300, 900]);
const SEVERITY = Object.freeze({ DEAD_LETTER: 5, WAITING_HUMAN: 4, RETRY_WAIT: 3, BLOCKED: 2, READY: 1 });

export class OrchestratorValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'OrchestratorValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OrchestratorValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new OrchestratorValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new OrchestratorValidationError(`Missing or invalid boolean: ${field}`, { field, value });
  }
  return value;
}

function requireInteger(value, field, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new OrchestratorValidationError(`Missing or invalid integer: ${field}`, { field, value, min, max });
  }
  return value;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) {
    throw new OrchestratorValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  }
  return text;
}

function requireIsoTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) {
    throw new OrchestratorValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return text;
}

function uniqueSortedStrings(value, field, allowed = null) {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value)) throw new OrchestratorValidationError(`Missing or invalid array: ${field}`, { field });
  const items = [...new Set(value.map((item) => requireString(item, `${field}[]`)))].sort();
  if (allowed) {
    for (const item of items) {
      if (!allowed.includes(item)) throw new OrchestratorValidationError(`Unsupported value in ${field}`, { field, item, allowed });
    }
  }
  return Object.freeze(items);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

function stableHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function addSeconds(timestamp, seconds) {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}

function localDate(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function assertTimeZone(timeZone) {
  const value = requireString(timeZone, 'timezone');
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format(new Date(0));
  } catch {
    throw new OrchestratorValidationError('Unsupported timezone', { timeZone: value });
  }
  return value;
}

function assertNoDependencyCycle(items) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw new OrchestratorValidationError('Content dependency cycle detected', { id });
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependencyId of byId.get(id).dependencies) visit(dependencyId);
    visiting.delete(id);
    visited.add(id);
  };
  for (const item of items) visit(item.id);
}

function validateContentPlan(input, index) {
  const item = requireObject(input, `contentPlans[${index}]`);
  const windowStart = requireIsoTimestamp(item.windowStart, `contentPlans[${index}].windowStart`);
  const windowEnd = requireIsoTimestamp(item.windowEnd, `contentPlans[${index}].windowEnd`);
  if (Date.parse(windowEnd) <= Date.parse(windowStart)) {
    throw new OrchestratorValidationError('Publishing window end must be after start', { id: item.id, windowStart, windowEnd });
  }
  const knownFormat = requireBoolean(item.knownFormat, `contentPlans[${index}].knownFormat`);
  const riskFlags = uniqueSortedStrings(item.riskFlags, `contentPlans[${index}].riskFlags`, RISK_FLAGS);
  const normalizedRisks = !knownFormat && !riskFlags.includes('NEW_FORMAT')
    ? Object.freeze([...riskFlags, 'NEW_FORMAT'].sort())
    : riskFlags;
  return Object.freeze({
    id: requireString(item.id, `contentPlans[${index}].id`),
    variantId: requireString(item.variantId, `contentPlans[${index}].variantId`),
    platform: requireEnum(item.platform, `contentPlans[${index}].platform`, PLATFORMS),
    formatId: requireString(item.formatId, `contentPlans[${index}].formatId`),
    knownFormat,
    packageReady: requireBoolean(item.packageReady, `contentPlans[${index}].packageReady`),
    priority: requireEnum(item.priority ?? 'NORMAL', `contentPlans[${index}].priority`, PRIORITIES),
    windowStart,
    windowEnd,
    dependencies: uniqueSortedStrings(item.dependencies, `contentPlans[${index}].dependencies`),
    riskFlags: normalizedRisks
  });
}

export function validateCampaignPlan(input) {
  const campaign = requireObject(input, 'campaign');
  if (campaign.schemaVersion !== ORCHESTRATOR_SCHEMA_VERSION) {
    throw new OrchestratorValidationError(`Campaign schemaVersion must be ${ORCHESTRATOR_SCHEMA_VERSION}`);
  }
  const contentPlans = Array.isArray(campaign.contentPlans)
    ? campaign.contentPlans.map(validateContentPlan)
    : (() => { throw new OrchestratorValidationError('contentPlans must be an array'); })();
  if (contentPlans.length === 0) throw new OrchestratorValidationError('Campaign requires at least one content plan');
  const ids = new Set();
  for (const item of contentPlans) {
    if (ids.has(item.id)) throw new OrchestratorValidationError('Duplicate content plan id', { id: item.id });
    ids.add(item.id);
  }
  for (const item of contentPlans) {
    for (const dependencyId of item.dependencies) {
      if (!ids.has(dependencyId)) throw new OrchestratorValidationError('Unknown content dependency', { id: item.id, dependencyId });
      if (dependencyId === item.id) throw new OrchestratorValidationError('Content cannot depend on itself', { id: item.id });
    }
  }
  assertNoDependencyCycle(contentPlans);
  return Object.freeze({
    schemaVersion: ORCHESTRATOR_SCHEMA_VERSION,
    id: requireString(campaign.id, 'id'),
    tenantId: requireString(campaign.tenantId, 'tenantId'),
    projectId: requireString(campaign.projectId, 'projectId'),
    name: requireString(campaign.name, 'name'),
    status: requireEnum(campaign.status, 'status', CAMPAIGN_STATUSES),
    timezone: assertTimeZone(campaign.timezone),
    mode: requireEnum(campaign.mode, 'mode', [ORCHESTRATOR_MODE]),
    automationTrustLevel: requireInteger(campaign.automationTrustLevel, 'automationTrustLevel', 0, 4),
    contentPlans: Object.freeze(contentPlans.sort((left, right) =>
      Date.parse(left.windowStart) - Date.parse(right.windowStart) || left.id.localeCompare(right.id)))
  });
}

export function evaluateHumanGate(contentPlan, automationTrustLevel) {
  const content = requireObject(contentPlan, 'contentPlan');
  const trustLevel = requireInteger(automationTrustLevel, 'automationTrustLevel', 0, 4);
  const reasons = [];
  if (!content.knownFormat || content.riskFlags?.includes('NEW_FORMAT')) reasons.push('NEW_FORMAT_REQUIRES_HUMAN');
  if (content.riskFlags?.includes('RIGHTS_UNKNOWN')) reasons.push('RIGHTS_REVIEW_REQUIRED');
  if (content.riskFlags?.includes('SENSITIVE_CONTENT')) reasons.push('SENSITIVE_CONTENT_REVIEW_REQUIRED');
  if (content.riskFlags?.includes('COLLABORATION')) reasons.push('COLLABORATION_APPROVAL_REQUIRED');
  if (content.riskFlags?.includes('CRISIS')) reasons.push('CRISIS_ESCALATION_REQUIRED');
  if (trustLevel === 0) reasons.push('TRUST_LEVEL_0_MANUAL');
  if (trustLevel === 1) reasons.push('TRUST_LEVEL_1_ITEM_APPROVAL');

  let approvalMode = 'AUTO_SHADOW';
  if (reasons.length > 0) approvalMode = 'INDIVIDUAL_HUMAN';
  else if (trustLevel === 2) approvalMode = 'BULK_HUMAN';
  else if (trustLevel < 2) approvalMode = 'INDIVIDUAL_HUMAN';

  return Object.freeze({
    requiresHuman: approvalMode !== 'AUTO_SHADOW',
    approvalMode,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    publicActionAllowed: false,
    mode: ORCHESTRATOR_MODE
  });
}

function taskId(contentId, step) {
  return `${contentId}:${step.toLowerCase()}`;
}

function stepDependencies(content, step) {
  const index = WORKFLOW_STEPS.indexOf(step);
  if (index === 0) return content.dependencies.map((id) => taskId(id, 'ITERATION')).sort();
  return [taskId(content.id, WORKFLOW_STEPS[index - 1])];
}

export function buildWorkflowPlan(rawCampaign) {
  const campaign = validateCampaignPlan(rawCampaign);
  const tasks = [];
  for (const content of campaign.contentPlans) {
    const humanGate = evaluateHumanGate(content, campaign.automationTrustLevel);
    for (const step of WORKFLOW_STEPS) {
      const dependencies = stepDependencies(content, step);
      const initialState = dependencies.length === 0 && step === 'PACKAGING' ? 'READY' : 'BLOCKED';
      tasks.push(Object.freeze({
        id: taskId(content.id, step),
        campaignId: campaign.id,
        contentId: content.id,
        variantId: content.variantId,
        platform: content.platform,
        step,
        state: initialState,
        dependencies: Object.freeze(dependencies),
        requiresHuman: step === 'APPROVAL' ? humanGate.requiresHuman : false,
        approvalMode: step === 'APPROVAL' ? humanGate.approvalMode : 'NOT_APPLICABLE',
        humanGateReasons: step === 'APPROVAL' ? humanGate.reasons : Object.freeze([]),
        priority: content.priority,
        attempts: 0,
        maxAttempts: 3,
        retryAt: null,
        lastErrorCode: null,
        history: Object.freeze([]),
        mode: ORCHESTRATOR_MODE,
        publicActionAllowed: false
      }));
    }
  }
  return Object.freeze({
    schemaVersion: ORCHESTRATOR_SCHEMA_VERSION,
    ruleVersion: ORCHESTRATOR_RULE_VERSION,
    campaign,
    tasks: Object.freeze(tasks.sort((a, b) => a.id.localeCompare(b.id))),
    publicActionsExecuted: false
  });
}

export function transitionWorkflowTask(rawTask, nextState, at, reason) {
  const task = requireObject(rawTask, 'task');
  const timestamp = requireIsoTimestamp(at, 'at');
  const transitionReason = requireString(reason, 'reason');
  const allowed = TASK_TRANSITIONS[task.state] ?? [];
  if (!allowed.includes(nextState)) {
    throw new OrchestratorValidationError('Invalid workflow task transition', {
      taskId: task.id,
      from: task.state,
      to: nextState,
      allowed
    });
  }
  if (task.mode !== ORCHESTRATOR_MODE || task.publicActionAllowed !== false) {
    throw new OrchestratorValidationError('Workflow task left shadow safety boundary', { taskId: task.id });
  }
  return Object.freeze({
    ...task,
    state: nextState,
    history: Object.freeze([...(task.history ?? []), Object.freeze({ from: task.state, to: nextState, at: timestamp, reason: transitionReason })])
  });
}

export function unlockReadyTasks(rawTasks, at) {
  const timestamp = requireIsoTimestamp(at, 'at');
  if (!Array.isArray(rawTasks)) throw new OrchestratorValidationError('tasks must be an array');
  const byId = new Map(rawTasks.map((task) => [task.id, task]));
  return Object.freeze(rawTasks.map((task) => {
    if (task.state !== 'BLOCKED') return task;
    const ready = task.dependencies.every((dependencyId) => byId.get(dependencyId)?.state === 'COMPLETED');
    return ready ? transitionWorkflowTask(task, 'READY', timestamp, 'DEPENDENCIES_COMPLETED') : task;
  }));
}

export function recordTaskFailure(rawTask, at, errorCode) {
  const task = requireObject(rawTask, 'task');
  if (task.state !== 'RUNNING') throw new OrchestratorValidationError('Only RUNNING tasks can fail', { taskId: task.id, state: task.state });
  const timestamp = requireIsoTimestamp(at, 'at');
  const code = requireString(errorCode, 'errorCode');
  const attempts = requireInteger(task.attempts ?? 0, 'task.attempts', 0) + 1;
  const maxAttempts = requireInteger(task.maxAttempts ?? 3, 'task.maxAttempts', 1, 10);
  const terminal = attempts >= maxAttempts;
  const nextState = terminal ? 'DEAD_LETTER' : 'RETRY_WAIT';
  const retryAt = terminal ? null : addSeconds(timestamp, RETRY_DELAYS_SECONDS[Math.min(attempts - 1, RETRY_DELAYS_SECONDS.length - 1)]);
  const transitioned = transitionWorkflowTask(task, nextState, timestamp, terminal ? 'MAX_ATTEMPTS_EXHAUSTED' : 'RETRY_SCHEDULED');
  return Object.freeze({ ...transitioned, attempts, maxAttempts, retryAt, lastErrorCode: code });
}

export function resumeRetry(rawTask, asOf) {
  const task = requireObject(rawTask, 'task');
  const timestamp = requireIsoTimestamp(asOf, 'asOf');
  if (task.state !== 'RETRY_WAIT') return task;
  if (!task.retryAt || Date.parse(timestamp) < Date.parse(task.retryAt)) return task;
  return transitionWorkflowTask(task, 'READY', timestamp, 'RETRY_DUE');
}

function assertTaskSet(plan, tasks) {
  if (!Array.isArray(tasks)) throw new OrchestratorValidationError('tasks must be an array');
  const expected = new Set(plan.tasks.map((task) => task.id));
  const actual = new Set(tasks.map((task) => task.id));
  if (expected.size !== actual.size || [...expected].some((id) => !actual.has(id))) {
    throw new OrchestratorValidationError('Task set does not match workflow plan');
  }
}

export function buildBulkApprovalBatch(rawPlan, rawTasks) {
  const plan = requireObject(rawPlan, 'plan');
  assertTaskSet(plan, rawTasks);
  const byContent = new Map(plan.campaign.contentPlans.map((content) => [content.id, content]));
  const candidates = rawTasks
    .filter((task) => task.step === 'APPROVAL' && task.state === 'WAITING_HUMAN' && task.approvalMode === 'BULK_HUMAN')
    .filter((task) => byContent.get(task.contentId)?.riskFlags.length === 0)
    .sort((a, b) => a.id.localeCompare(b.id));
  return Object.freeze({
    campaignId: plan.campaign.id,
    approvalMode: 'BULK_HUMAN',
    taskIds: Object.freeze(candidates.map((task) => task.id)),
    itemCount: candidates.length,
    humanApprovalRequired: candidates.length > 0,
    publicActionAllowed: false
  });
}

export function simulateScheduler({ workflowPlan, tasks, asOf, existingIdempotencyKeys = [] }) {
  const plan = requireObject(workflowPlan, 'workflowPlan');
  assertTaskSet(plan, tasks);
  const timestamp = requireIsoTimestamp(asOf, 'asOf');
  const existing = new Set(uniqueSortedStrings(existingIdempotencyKeys, 'existingIdempotencyKeys'));
  const byTaskId = new Map(tasks.map((task) => [task.id, task]));
  const jobs = [];
  const skipped = [];
  const alerts = [];

  for (const content of plan.campaign.contentPlans) {
    const publishTask = byTaskId.get(taskId(content.id, 'SHADOW_PUBLISH'));
    const approvalTask = byTaskId.get(taskId(content.id, 'APPROVAL'));
    const schedulingTask = byTaskId.get(taskId(content.id, 'SCHEDULING'));
    const now = Date.parse(timestamp);
    if (now >= Date.parse(content.windowEnd)) {
      alerts.push(Object.freeze({ code: 'PUBLISH_WINDOW_MISSED', contentId: content.id, priority: content.priority }));
      continue;
    }
    if (now < Date.parse(content.windowStart)) {
      skipped.push(Object.freeze({ contentId: content.id, reason: 'WINDOW_NOT_OPEN' }));
      continue;
    }
    if (approvalTask.state !== 'COMPLETED' || schedulingTask.state !== 'COMPLETED' || publishTask.state !== 'READY') {
      skipped.push(Object.freeze({ contentId: content.id, reason: 'WORKFLOW_NOT_READY' }));
      continue;
    }
    const idempotencyKey = stableHash({
      tenantId: plan.campaign.tenantId,
      projectId: plan.campaign.projectId,
      campaignId: plan.campaign.id,
      contentId: content.id,
      variantId: content.variantId,
      windowStart: content.windowStart,
      mode: ORCHESTRATOR_MODE
    });
    if (existing.has(idempotencyKey)) {
      skipped.push(Object.freeze({ contentId: content.id, reason: 'IDEMPOTENT_DUPLICATE', idempotencyKey }));
      continue;
    }
    jobs.push(Object.freeze({
      id: `shadow-job-${idempotencyKey.slice(0, 16)}`,
      tenantId: plan.campaign.tenantId,
      projectId: plan.campaign.projectId,
      campaignId: plan.campaign.id,
      contentId: content.id,
      variantId: content.variantId,
      platform: content.platform,
      scheduledAt: timestamp,
      windowEnd: content.windowEnd,
      idempotencyKey,
      state: 'APPROVED_SHADOW',
      mode: ORCHESTRATOR_MODE,
      publicActionAllowed: false
    }));
    existing.add(idempotencyKey);
  }

  return Object.freeze({
    asOf: timestamp,
    jobs: Object.freeze(jobs.sort((a, b) => a.id.localeCompare(b.id))),
    skipped: Object.freeze(skipped.sort((a, b) => a.contentId.localeCompare(b.contentId))),
    alerts: Object.freeze(alerts.sort((a, b) => a.contentId.localeCompare(b.contentId))),
    publicActionsExecuted: false
  });
}

export function buildPublishJobEvent(job, { occurredAt, sequence = 1, actor = 'mkt0-orchestrator' }) {
  const value = requireObject(job, 'job');
  if (value.mode !== ORCHESTRATOR_MODE || value.publicActionAllowed !== false || value.state !== 'APPROVED_SHADOW') {
    throw new OrchestratorValidationError('Only approved shadow jobs may become domain events', { jobId: value.id });
  }
  return Object.freeze({
    schemaVersion: 1,
    id: `event:${value.id}:approved-shadow`,
    tenantId: requireString(value.tenantId, 'job.tenantId'),
    projectId: requireString(value.projectId, 'job.projectId'),
    stream: `publish-job:${value.id}`,
    sequence: requireInteger(sequence, 'sequence', 1),
    type: 'PUBLISH_JOB_RECORDED',
    occurredAt: requireIsoTimestamp(occurredAt, 'occurredAt'),
    actor: requireString(actor, 'actor'),
    mode: ORCHESTRATOR_MODE,
    payload: Object.freeze({
      publishJobId: requireString(value.id, 'job.id'),
      variantId: requireString(value.variantId, 'job.variantId'),
      state: 'APPROVED_SHADOW'
    })
  });
}

export function buildCalendarProjection(rawPlan) {
  const plan = requireObject(rawPlan, 'plan');
  const days = new Map();
  for (const content of plan.campaign.contentPlans) {
    const date = localDate(content.windowStart, plan.campaign.timezone);
    if (!days.has(date)) days.set(date, []);
    days.get(date).push(Object.freeze({
      contentId: content.id,
      variantId: content.variantId,
      platform: content.platform,
      priority: content.priority,
      windowStart: content.windowStart,
      windowEnd: content.windowEnd,
      approvalMode: evaluateHumanGate(content, plan.campaign.automationTrustLevel).approvalMode,
      mode: ORCHESTRATOR_MODE
    }));
  }
  return Object.freeze({
    campaignId: plan.campaign.id,
    timezone: plan.campaign.timezone,
    days: Object.freeze([...days.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => Object.freeze({
      date,
      items: Object.freeze(items.sort((a, b) => Date.parse(a.windowStart) - Date.parse(b.windowStart) || a.contentId.localeCompare(b.contentId)))
    }))),
    publicActionsExecuted: false
  });
}

export function buildBottleneckReport(rawTasks) {
  if (!Array.isArray(rawTasks)) throw new OrchestratorValidationError('tasks must be an array');
  const grouped = new Map();
  for (const task of rawTasks) {
    if (!SEVERITY[task.state]) continue;
    const key = `${task.state}:${task.step}`;
    const current = grouped.get(key) ?? { state: task.state, step: task.step, count: 0, taskIds: [] };
    current.count += 1;
    current.taskIds.push(task.id);
    grouped.set(key, current);
  }
  const bottlenecks = [...grouped.values()]
    .map((item) => Object.freeze({ ...item, taskIds: Object.freeze(item.taskIds.sort()), severity: SEVERITY[item.state] }))
    .sort((a, b) => b.severity - a.severity || b.count - a.count || a.step.localeCompare(b.step));
  return Object.freeze({
    bottlenecks: Object.freeze(bottlenecks),
    criticalCount: rawTasks.filter((task) => task.state === 'DEAD_LETTER').length,
    humanQueueCount: rawTasks.filter((task) => task.state === 'WAITING_HUMAN').length,
    publicActionsExecuted: false
  });
}

export function buildDailyMarketingPlan({ workflowPlan, tasks, asOf }) {
  const plan = requireObject(workflowPlan, 'workflowPlan');
  assertTaskSet(plan, tasks);
  const timestamp = requireIsoTimestamp(asOf, 'asOf');
  const date = localDate(timestamp, plan.campaign.timezone);
  const contentToday = plan.campaign.contentPlans
    .filter((content) => localDate(content.windowStart, plan.campaign.timezone) === date)
    .map((content) => Object.freeze({
      contentId: content.id,
      platform: content.platform,
      windowStart: content.windowStart,
      priority: content.priority
    }));
  const approvals = tasks.filter((task) => task.state === 'WAITING_HUMAN').map((task) => task.id).sort();
  const ready = tasks.filter((task) => task.state === 'READY').map((task) => task.id).sort();
  const retries = tasks.filter((task) => task.state === 'RETRY_WAIT').map((task) => Object.freeze({ taskId: task.id, retryAt: task.retryAt })).sort((a, b) => a.taskId.localeCompare(b.taskId));
  const deadLetters = tasks.filter((task) => task.state === 'DEAD_LETTER').map((task) => task.id).sort();
  const bottlenecks = buildBottleneckReport(tasks);
  return Object.freeze({
    schemaVersion: ORCHESTRATOR_SCHEMA_VERSION,
    ruleVersion: ORCHESTRATOR_RULE_VERSION,
    date,
    asOf: timestamp,
    campaignId: plan.campaign.id,
    contentToday: Object.freeze(contentToday),
    approvalsRequired: Object.freeze(approvals),
    readyTasks: Object.freeze(ready),
    retries: Object.freeze(retries),
    deadLetters: Object.freeze(deadLetters),
    bottlenecks,
    summary: Object.freeze({
      plannedContent: contentToday.length,
      humanApprovals: approvals.length,
      readyTasks: ready.length,
      retries: retries.length,
      deadLetters: deadLetters.length
    }),
    mode: ORCHESTRATOR_MODE,
    publicActionsExecuted: false
  });
}
