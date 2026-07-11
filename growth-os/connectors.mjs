import { createHash } from 'node:crypto';

export const CONNECTOR_SCHEMA_VERSION = 1;
export const CONNECTOR_RULE_VERSION = 'mkt0-008.v1';
export const CONNECTOR_MODE = 'shadow';

export const PROVIDER_IDS = Object.freeze(['postiz', 'meta', 'tiktok', 'youtube']);
export const CAPABILITIES = Object.freeze(['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS']);
export const AUTH_STATES = Object.freeze(['UNCONFIGURED', 'DISCONNECTED', 'SANDBOX_READY', 'BLOCKED', 'EXPIRED']);
export const SECRET_STATES = Object.freeze(['MISSING', 'AVAILABLE', 'EXPIRED', 'BLOCKED', 'NOT_REQUIRED']);
export const ERROR_CLASSES = Object.freeze(['RETRYABLE', 'AUTH', 'RATE_LIMIT', 'VALIDATION', 'PERMANENT', 'UNKNOWN']);
export const REQUEST_METHODS = Object.freeze(['GET', 'POST']);

const CAPABILITY_METHODS = Object.freeze({
  PUBLISH: ['POST'],
  STATUS: ['GET'],
  METRICS: ['GET'],
  COMMENTS: ['GET'],
  REPLIES: ['POST'],
  WEBHOOKS: ['POST']
});

const PROVIDER_TEMPLATES = Object.freeze({
  postiz: Object.freeze({ adapterClass: 'AGGREGATOR', capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'WEBHOOKS'] }),
  meta: Object.freeze({ adapterClass: 'DIRECT_PLATFORM', capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS'] }),
  tiktok: Object.freeze({ adapterClass: 'DIRECT_PLATFORM', capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'WEBHOOKS'] }),
  youtube: Object.freeze({ adapterClass: 'DIRECT_PLATFORM', capabilities: ['PUBLISH', 'STATUS', 'METRICS', 'COMMENTS', 'REPLIES', 'WEBHOOKS'] })
});

const FORBIDDEN_KEY = /(token|secret|password|authorization|api[_-]?key|client[_-]?secret|access[_-]?key|private[_-]?key)/i;
const FORBIDDEN_URL = /^https?:\/\//i;
const REAL_ACCOUNT_PATTERN = /(^|_)(account|channel|page|profile)[_-]?\d{4,}|^[0-9]{6,}$/i;

export class ConnectorValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConnectorValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ConnectorValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ConnectorValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new ConnectorValidationError(`Missing or invalid boolean: ${field}`, { field, value });
  return value;
}

function requireInteger(value, field, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ConnectorValidationError(`Missing or invalid integer: ${field}`, { field, value, min, max });
  }
  return value;
}

function requireNumber(value, field, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new ConnectorValidationError(`Missing or invalid number: ${field}`, { field, value, min, max });
  }
  return value;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) throw new ConnectorValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  return text;
}

function requireIsoTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) {
    throw new ConnectorValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
  }
  return text;
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

function uniqueSorted(values, field, allowed = null) {
  if (!Array.isArray(values)) throw new ConnectorValidationError(`Missing or invalid array: ${field}`, { field });
  const result = [...new Set(values.map((value) => requireString(value, `${field}[]`)))].sort();
  if (allowed) {
    for (const value of result) {
      if (!allowed.includes(value)) throw new ConnectorValidationError(`Unsupported value in ${field}`, { field, value, allowed });
    }
  }
  return Object.freeze(result);
}

function assertNoSensitiveValues(value, path = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveValues(item, `${path}[${index}]`));
    return true;
  }
  if (!value || typeof value !== 'object') return true;
  for (const [key, item] of Object.entries(value)) {
    const next = `${path}.${key}`;
    if (FORBIDDEN_KEY.test(key) && item != null && item !== '' && key !== 'secretRequirements') {
      throw new ConnectorValidationError('Secret or credential value is forbidden', { path: next });
    }
    assertNoSensitiveValues(item, next);
  }
  return true;
}

function assertSandboxAlias(value, field) {
  const alias = requireString(value, field);
  if (!alias.startsWith('sandbox_') || REAL_ACCOUNT_PATTERN.test(alias)) {
    throw new ConnectorValidationError('Only synthetic sandbox aliases are allowed', { field, value: alias });
  }
  return alias;
}

function normalizeSecretRequirement(input, index) {
  const value = requireObject(input, `secretRequirements[${index}]`);
  const name = requireString(value.name, `secretRequirements[${index}].name`);
  if (!/^[A-Z][A-Z0-9_]{2,80}$/.test(name)) {
    throw new ConnectorValidationError('Secret requirement must be an uppercase environment-style name', { name });
  }
  return Object.freeze({
    name,
    required: requireBoolean(value.required, `secretRequirements[${index}].required`),
    status: requireEnum(value.status, `secretRequirements[${index}].status`, SECRET_STATES)
  });
}

export function createProviderManifest(input) {
  const value = requireObject(input, 'providerManifest');
  if (value.schemaVersion !== CONNECTOR_SCHEMA_VERSION) {
    throw new ConnectorValidationError(`Provider schemaVersion must be ${CONNECTOR_SCHEMA_VERSION}`);
  }
  assertNoSensitiveValues(value);
  const providerId = requireEnum(value.providerId, 'providerId', PROVIDER_IDS);
  const template = PROVIDER_TEMPLATES[providerId];
  const capabilities = uniqueSorted(value.capabilities, 'capabilities', CAPABILITIES);
  for (const capability of capabilities) {
    if (!template.capabilities.includes(capability)) {
      throw new ConnectorValidationError('Capability is not declared for provider slot', { providerId, capability });
    }
  }
  const secretRequirements = Array.isArray(value.secretRequirements)
    ? value.secretRequirements.map(normalizeSecretRequirement).sort((a, b) => a.name.localeCompare(b.name))
    : (() => { throw new ConnectorValidationError('secretRequirements must be an array'); })();
  const duplicateSecretNames = new Set();
  for (const requirement of secretRequirements) {
    if (duplicateSecretNames.has(requirement.name)) throw new ConnectorValidationError('Duplicate secret requirement', { name: requirement.name });
    duplicateSecretNames.add(requirement.name);
  }
  return Object.freeze({
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    providerId,
    displayName: requireString(value.displayName, 'displayName'),
    adapterClass: requireEnum(value.adapterClass ?? template.adapterClass, 'adapterClass', ['AGGREGATOR', 'DIRECT_PLATFORM']),
    authState: requireEnum(value.authState, 'authState', AUTH_STATES),
    accountAlias: assertSandboxAlias(value.accountAlias, 'accountAlias'),
    capabilities: Object.freeze(capabilities),
    secretRequirements: Object.freeze(secretRequirements),
    sandboxOnly: true,
    networkAllowed: false,
    liveActionsAllowed: false,
    endpointBase: null
  });
}

export function buildCapabilityMatrix(manifests) {
  if (!Array.isArray(manifests) || manifests.length === 0) throw new ConnectorValidationError('manifests must be a non-empty array');
  const normalized = manifests.map(createProviderManifest).sort((a, b) => a.providerId.localeCompare(b.providerId));
  const providerIds = new Set();
  for (const manifest of normalized) {
    if (providerIds.has(manifest.providerId)) throw new ConnectorValidationError('Duplicate provider manifest', { providerId: manifest.providerId });
    providerIds.add(manifest.providerId);
  }
  return Object.freeze({
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    providers: Object.freeze(normalized.map((manifest) => Object.freeze({
      providerId: manifest.providerId,
      authState: manifest.authState,
      accountAlias: manifest.accountAlias,
      capabilities: Object.freeze(CAPABILITIES.map((capability) => Object.freeze({
        capability,
        supported: manifest.capabilities.includes(capability),
        executable: false,
        sandboxPlannable: manifest.authState === 'SANDBOX_READY' && manifest.capabilities.includes(capability)
      })))
    }))),
    networkAllowed: false,
    liveActionsAllowed: false
  });
}

export function buildConnectorReadiness(manifestInput) {
  const manifest = createProviderManifest(manifestInput);
  const missingRequired = manifest.secretRequirements
    .filter((requirement) => requirement.required && requirement.status !== 'AVAILABLE')
    .map((requirement) => requirement.name)
    .sort();
  const reasons = [];
  if (manifest.authState !== 'SANDBOX_READY') reasons.push(`AUTH_${manifest.authState}`);
  if (missingRequired.length > 0) reasons.push('REQUIRED_SECRET_STATUS_NOT_READY');
  if (manifest.capabilities.length === 0) reasons.push('NO_CAPABILITIES');
  const sandboxReady = reasons.length === 0;
  return Object.freeze({
    providerId: manifest.providerId,
    accountAlias: manifest.accountAlias,
    status: sandboxReady ? 'SANDBOX_READY' : 'BLOCKED',
    reasons: Object.freeze(reasons.sort()),
    missingRequiredSecretNames: Object.freeze(missingRequired),
    configuredSecretNames: Object.freeze(manifest.secretRequirements.filter((item) => item.status === 'AVAILABLE').map((item) => item.name).sort()),
    credentialValuesIncluded: false,
    networkVerified: false,
    providerRuntimeVerified: false,
    liveReady: false
  });
}

export function buildRequestPlan({ manifest: manifestInput, capability, method, path, payload = null, tenantId, projectId, requestedAt, idempotencySeed }) {
  const manifest = createProviderManifest(manifestInput);
  const readiness = buildConnectorReadiness(manifest);
  const requestedCapability = requireEnum(capability, 'capability', CAPABILITIES);
  if (!manifest.capabilities.includes(requestedCapability)) {
    throw new ConnectorValidationError('Capability not supported by provider manifest', { providerId: manifest.providerId, capability: requestedCapability });
  }
  if (!readiness.status || readiness.status !== 'SANDBOX_READY') {
    throw new ConnectorValidationError('Connector is not sandbox ready', { providerId: manifest.providerId, reasons: readiness.reasons });
  }
  const requestMethod = requireEnum(method, 'method', REQUEST_METHODS);
  if (!CAPABILITY_METHODS[requestedCapability].includes(requestMethod)) {
    throw new ConnectorValidationError('HTTP method is not allowed for capability', { capability: requestedCapability, method: requestMethod });
  }
  const requestPath = requireString(path, 'path');
  if (!requestPath.startsWith('/') || FORBIDDEN_URL.test(requestPath) || requestPath.includes('://')) {
    throw new ConnectorValidationError('Only relative sandbox request paths are allowed', { path: requestPath });
  }
  if (payload != null) assertNoSensitiveValues(payload, 'payload');
  const timestamp = requireIsoTimestamp(requestedAt, 'requestedAt');
  const seed = requireString(idempotencySeed, 'idempotencySeed');
  const requestShape = {
    tenantId: requireString(tenantId, 'tenantId'),
    projectId: requireString(projectId, 'projectId'),
    providerId: manifest.providerId,
    accountAlias: manifest.accountAlias,
    capability: requestedCapability,
    method: requestMethod,
    path: requestPath,
    payload: payload == null ? null : canonicalize(payload),
    requestedAt: timestamp,
    idempotencySeed: seed,
    ruleVersion: CONNECTOR_RULE_VERSION,
    mode: CONNECTOR_MODE
  };
  const payloadHash = stableHash(requestShape.payload);
  const idempotencyKey = stableHash({
    tenantId: requestShape.tenantId,
    projectId: requestShape.projectId,
    providerId: requestShape.providerId,
    accountAlias: requestShape.accountAlias,
    capability: requestShape.capability,
    method: requestShape.method,
    path: requestShape.path,
    payloadHash,
    idempotencySeed: seed,
    mode: CONNECTOR_MODE
  });
  return Object.freeze({
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    id: `connector-plan-${idempotencyKey.slice(0, 16)}`,
    ...requestShape,
    payloadHash,
    idempotencyKey,
    state: 'PLANNED_SHADOW',
    endpointBase: null,
    networkAllowed: false,
    executionAllowed: false,
    liveActionsAllowed: false,
    credentialValuesIncluded: false
  });
}

export function registerShadowPlan(planInput, existingIdempotencyKeys = []) {
  const plan = requireObject(planInput, 'plan');
  if (plan.state !== 'PLANNED_SHADOW' || plan.networkAllowed !== false || plan.executionAllowed !== false) {
    throw new ConnectorValidationError('Only non-executable shadow plans may be registered', { planId: plan.id });
  }
  const existing = new Set(uniqueSorted(existingIdempotencyKeys, 'existingIdempotencyKeys'));
  if (existing.has(plan.idempotencyKey)) {
    return Object.freeze({ accepted: false, reason: 'IDEMPOTENT_DUPLICATE', idempotencyKey: plan.idempotencyKey, executionPerformed: false });
  }
  return Object.freeze({ accepted: true, reason: 'REGISTERED_SHADOW', idempotencyKey: plan.idempotencyKey, executionPerformed: false });
}

export function evaluateRateLimitBudget(input) {
  const budget = requireObject(input, 'rateLimitBudget');
  const limit = requireInteger(budget.limit, 'limit', 1, 1000000);
  const used = requireInteger(budget.used, 'used', 0, 1000000);
  const requestedUnits = requireInteger(budget.requestedUnits ?? 1, 'requestedUnits', 1, 1000000);
  const windowStartedAt = requireIsoTimestamp(budget.windowStartedAt, 'windowStartedAt');
  const windowSeconds = requireInteger(budget.windowSeconds, 'windowSeconds', 1, 86400);
  const asOf = requireIsoTimestamp(budget.asOf, 'asOf');
  const resetAt = new Date(Date.parse(windowStartedAt) + windowSeconds * 1000).toISOString();
  const windowExpired = Date.parse(asOf) >= Date.parse(resetAt);
  const effectiveUsed = windowExpired ? 0 : used;
  const projected = effectiveUsed + requestedUnits;
  if (projected <= limit) {
    return Object.freeze({ decision: 'ALLOW_SHADOW_PLAN', effectiveUsed, projected, remaining: limit - projected, resetAt, retryAfterSeconds: 0, executionAllowed: false });
  }
  const retryAfterSeconds = Math.max(1, Math.ceil((Date.parse(resetAt) - Date.parse(asOf)) / 1000));
  return Object.freeze({ decision: windowExpired ? 'BLOCK_INVALID_BUDGET' : 'BACKOFF', effectiveUsed, projected, remaining: Math.max(0, limit - effectiveUsed), resetAt, retryAfterSeconds, executionAllowed: false });
}

export function classifyConnectorError(input) {
  const value = requireObject(input, 'error');
  const status = value.status == null ? null : requireInteger(value.status, 'status', 100, 599);
  const code = typeof value.code === 'string' ? value.code.trim().toUpperCase() : '';
  if (status === 401 || status === 403 || ['AUTH_EXPIRED', 'INVALID_CREDENTIALS'].includes(code)) return 'AUTH';
  if (status === 429 || code === 'RATE_LIMITED') return 'RATE_LIMIT';
  if ([400, 409, 422].includes(status) || ['VALIDATION', 'INVALID_PAYLOAD'].includes(code)) return 'VALIDATION';
  if ((status != null && status >= 500) || ['ETIMEDOUT', 'ECONNRESET', 'TEMPORARY_UNAVAILABLE'].includes(code)) return 'RETRYABLE';
  if ([404, 410].includes(status) || ['UNSUPPORTED', 'PERMANENT_FAILURE'].includes(code)) return 'PERMANENT';
  return 'UNKNOWN';
}

function normalizeEnvelopeCommon(input, kind) {
  const value = requireObject(input, 'providerEnvelope');
  assertNoSensitiveValues(value, 'providerEnvelope');
  const providerId = requireEnum(value.providerId, 'providerId', PROVIDER_IDS);
  return {
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    envelopeKind: kind,
    providerId,
    accountAlias: assertSandboxAlias(value.accountAlias, 'accountAlias'),
    sourceRequestId: requireString(value.sourceRequestId, 'sourceRequestId'),
    observedAt: requireIsoTimestamp(value.observedAt, 'observedAt'),
    provenance: requireEnum(value.provenance ?? 'synthetic_fixture', 'provenance', ['synthetic_fixture', 'authorized_sandbox_fixture']),
    state: 'SIMULATED',
    networkUsed: false,
    credentialValuesIncluded: false,
    realAccountIdIncluded: false
  };
}

export function normalizePublishEnvelope(input) {
  const value = requireObject(input, 'publishEnvelope');
  const common = normalizeEnvelopeCommon(value, 'PUBLISH');
  return Object.freeze({ ...common, remoteObjectAlias: assertSandboxAlias(value.remoteObjectAlias, 'remoteObjectAlias'), publishState: requireEnum(value.publishState, 'publishState', ['ACCEPTED_SHADOW', 'PROCESSING_SHADOW', 'REJECTED_SHADOW']) });
}

export function normalizeStatusEnvelope(input) {
  const value = requireObject(input, 'statusEnvelope');
  const common = normalizeEnvelopeCommon(value, 'STATUS');
  return Object.freeze({ ...common, remoteObjectAlias: assertSandboxAlias(value.remoteObjectAlias, 'remoteObjectAlias'), status: requireEnum(value.status, 'status', ['PENDING_SHADOW', 'READY_SHADOW', 'FAILED_SHADOW', 'UNKNOWN_SHADOW']) });
}

export function normalizeMetricEnvelope(input) {
  const value = requireObject(input, 'metricEnvelope');
  const common = normalizeEnvelopeCommon(value, 'METRIC');
  return Object.freeze({
    ...common,
    remoteObjectAlias: assertSandboxAlias(value.remoteObjectAlias, 'remoteObjectAlias'),
    metrics: Object.freeze({
      views: requireInteger(value.metrics?.views, 'metrics.views', 0),
      likes: requireInteger(value.metrics?.likes, 'metrics.likes', 0),
      comments: requireInteger(value.metrics?.comments, 'metrics.comments', 0),
      shares: requireInteger(value.metrics?.shares, 'metrics.shares', 0),
      watchSeconds: requireNumber(value.metrics?.watchSeconds, 'metrics.watchSeconds', 0)
    })
  });
}

export function normalizeCommunityEnvelope(input) {
  const value = requireObject(input, 'communityEnvelope');
  const common = normalizeEnvelopeCommon(value, 'COMMUNITY');
  const items = Array.isArray(value.items) ? value.items : (() => { throw new ConnectorValidationError('items must be an array'); })();
  return Object.freeze({
    ...common,
    items: Object.freeze(items.map((item, index) => {
      const entry = requireObject(item, `items[${index}]`);
      return Object.freeze({
        itemAlias: assertSandboxAlias(entry.itemAlias, `items[${index}].itemAlias`),
        category: requireEnum(entry.category, `items[${index}].category`, ['QUESTION', 'IDEA', 'PRAISE', 'CRITICISM', 'RIGHTS', 'CRISIS', 'SPAM']),
        sentiment: requireEnum(entry.sentiment, `items[${index}].sentiment`, ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNKNOWN']),
        rawTextIncluded: false,
        personalProfileIncluded: false
      });
    }))
  });
}

export function validateWebhookEnvelope(input, { asOf, seenEventIds = [], maxAgeSeconds = 900, maxFutureSkewSeconds = 60 }) {
  const value = requireObject(input, 'webhookEnvelope');
  assertNoSensitiveValues(value, 'webhookEnvelope');
  const now = requireIsoTimestamp(asOf, 'asOf');
  const eventId = requireString(value.eventId, 'eventId');
  if (new Set(uniqueSorted(seenEventIds, 'seenEventIds')).has(eventId)) {
    throw new ConnectorValidationError('Webhook replay detected', { eventId });
  }
  const occurredAt = requireIsoTimestamp(value.occurredAt, 'occurredAt');
  const receivedAt = requireIsoTimestamp(value.receivedAt, 'receivedAt');
  const ageSeconds = Math.floor((Date.parse(now) - Date.parse(occurredAt)) / 1000);
  if (ageSeconds > requireInteger(maxAgeSeconds, 'maxAgeSeconds', 1, 86400)) {
    throw new ConnectorValidationError('Webhook event is stale', { eventId, ageSeconds });
  }
  if (ageSeconds < -requireInteger(maxFutureSkewSeconds, 'maxFutureSkewSeconds', 0, 3600)) {
    throw new ConnectorValidationError('Webhook event is too far in the future', { eventId, ageSeconds });
  }
  if (Date.parse(receivedAt) < Date.parse(occurredAt) - maxFutureSkewSeconds * 1000) {
    throw new ConnectorValidationError('Webhook receivedAt precedes occurredAt beyond allowed skew', { eventId });
  }
  return Object.freeze({
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    providerId: requireEnum(value.providerId, 'providerId', PROVIDER_IDS),
    accountAlias: assertSandboxAlias(value.accountAlias, 'accountAlias'),
    eventId,
    eventType: requireString(value.eventType, 'eventType'),
    occurredAt,
    receivedAt,
    signatureStatus: requireEnum(value.signatureStatus, 'signatureStatus', ['SIMULATED_VALID', 'SIMULATED_INVALID', 'NOT_VERIFIED']),
    accepted: value.signatureStatus === 'SIMULATED_VALID',
    state: 'SIMULATED',
    replayDetected: false,
    networkUsed: false,
    credentialValuesIncluded: false
  });
}

export function simulateProviderRequest(planInput, fixtureInput) {
  const plan = requireObject(planInput, 'plan');
  const fixture = requireObject(fixtureInput, 'fixture');
  if (plan.state !== 'PLANNED_SHADOW' || plan.executionAllowed !== false || plan.networkAllowed !== false) {
    throw new ConnectorValidationError('Only non-executable shadow plans may be simulated', { planId: plan.id });
  }
  assertNoSensitiveValues(fixture, 'fixture');
  return Object.freeze({
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    simulationId: `simulation-${stableHash({ planId: plan.id, fixture }).slice(0, 16)}`,
    planId: plan.id,
    providerId: plan.providerId,
    accountAlias: plan.accountAlias,
    capability: plan.capability,
    resultCode: requireString(fixture.resultCode, 'fixture.resultCode'),
    state: 'SIMULATED',
    networkUsed: false,
    executionPerformed: false,
    liveActionPerformed: false,
    credentialValuesIncluded: false
  });
}

export function buildConnectorPortfolioReadiness(manifests) {
  if (!Array.isArray(manifests) || manifests.length === 0) throw new ConnectorValidationError('manifests must be a non-empty array');
  const connectors = manifests.map(buildConnectorReadiness).sort((a, b) => a.providerId.localeCompare(b.providerId));
  return Object.freeze({
    schemaVersion: CONNECTOR_SCHEMA_VERSION,
    ruleVersion: CONNECTOR_RULE_VERSION,
    connectors: Object.freeze(connectors),
    summary: Object.freeze({
      total: connectors.length,
      sandboxReady: connectors.filter((item) => item.status === 'SANDBOX_READY').length,
      blocked: connectors.filter((item) => item.status === 'BLOCKED').length,
      liveReady: 0
    }),
    networkVerified: false,
    providerRuntimeVerified: false,
    liveActionsAllowed: false
  });
}
