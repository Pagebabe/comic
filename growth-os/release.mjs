import { createHash } from 'node:crypto';

export const RELEASE_SCHEMA_VERSION = 1;
export const RELEASE_RULE_VERSION = 'mkt0-010.v1';
export const REQUIRED_MODULES = Object.freeze(Array.from({ length: 9 }, (_, index) => `MKT0-${String(index + 1).padStart(3, '0')}`));
export const RELEASE_STATES = Object.freeze(['PROVEN', 'NOT_PROVEN']);
export const GATE_STATES = Object.freeze(['BLOCKED_EXTERNAL', 'HUMAN_APPROVAL_REQUIRED', 'NOT_PROVEN', 'PROVEN_EXTERNAL']);

const FORBIDDEN_KEYS = /^(access_?token|refresh_?token|api_?key|password|private_?key|client_?secret|authorization|secret_?value|credential_?value)$/i;
const FORBIDDEN_VALUE_PATTERNS = [/\bBearer\s+[A-Za-z0-9._~-]+/i, /\bsk-[A-Za-z0-9_-]{12,}/i, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i];

export class ReleaseValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ReleaseValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReleaseValidationError(`Invalid object: ${field}`, { field });
  }
  return value;
}

function requireArray(value, field) {
  if (!Array.isArray(value)) throw new ReleaseValidationError(`Invalid array: ${field}`, { field });
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ReleaseValidationError(`Invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) {
    throw new ReleaseValidationError(`Invalid timestamp: ${field}`, { field, value });
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

export function stableHash(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

export function containsForbiddenMaterial(value, path = '$') {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = containsForbiddenMaterial(value[index], `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.test(key)) return `${path}.${key}`;
      const found = containsForbiddenMaterial(child, `${path}.${key}`);
      if (found) return found;
    }
    return null;
  }
  if (typeof value === 'string' && FORBIDDEN_VALUE_PATTERNS.some((pattern) => pattern.test(value))) return path;
  return null;
}

function assertNoForbiddenMaterial(value, field) {
  const path = containsForbiddenMaterial(value);
  if (path) throw new ReleaseValidationError(`Forbidden credential material in ${field}`, { path });
}

function validateSha(value, field) {
  const text = requireString(value, field);
  if (!/^[a-f0-9]{64}$/.test(text)) throw new ReleaseValidationError(`Invalid SHA-256: ${field}`, { value: text });
  return text;
}

export function createModuleEvidence(input) {
  const value = requireObject(input, 'moduleEvidence');
  assertNoForbiddenMaterial(value, 'moduleEvidence');
  const moduleId = requireString(value.moduleId, 'moduleId');
  if (!/^MKT0-\d{3}$/.test(moduleId)) throw new ReleaseValidationError('Invalid moduleId', { moduleId });
  const state = requireString(value.state, 'state');
  if (!RELEASE_STATES.includes(state)) throw new ReleaseValidationError('Unsupported module state', { state });
  const artifacts = requireArray(value.artifacts, 'artifacts').map((artifact, index) => {
    const item = requireObject(artifact, `artifacts[${index}]`);
    return Object.freeze({
      path: requireString(item.path, `artifacts[${index}].path`),
      sha256: validateSha(item.sha256, `artifacts[${index}].sha256`)
    });
  }).sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze({
    moduleId,
    ruleVersion: requireString(value.ruleVersion, 'ruleVersion'),
    state,
    ciRunId: requireString(value.ciRunId, 'ciRunId'),
    claims: Object.freeze([...new Set(requireArray(value.claims ?? [], 'claims').map((claim) => requireString(claim, 'claims[]')))].sort()),
    artifacts: Object.freeze(artifacts),
    networkUsed: false,
    liveActionsExecuted: false
  });
}

export function buildReleaseManifest(input) {
  const value = requireObject(input, 'release');
  if (value.schemaVersion !== RELEASE_SCHEMA_VERSION) throw new ReleaseValidationError('Invalid release schemaVersion');
  assertNoForbiddenMaterial(value, 'release');
  const modules = requireArray(value.modules, 'modules').map(createModuleEvidence).sort((left, right) => left.moduleId.localeCompare(right.moduleId));
  const ids = new Set();
  for (const module of modules) {
    if (ids.has(module.moduleId)) throw new ReleaseValidationError('Duplicate module evidence', { moduleId: module.moduleId });
    ids.add(module.moduleId);
  }
  const blockers = [];
  for (const required of REQUIRED_MODULES) if (!ids.has(required)) blockers.push(`MISSING_MODULE:${required}`);
  for (const module of modules) {
    if (!REQUIRED_MODULES.includes(module.moduleId)) blockers.push(`UNEXPECTED_MODULE:${module.moduleId}`);
    if (module.state !== 'PROVEN') blockers.push(`${module.moduleId}:${module.state}`);
    if (module.artifacts.length === 0) blockers.push(`${module.moduleId}:NO_ARTIFACTS`);
  }
  const core = Object.freeze({
    schemaVersion: RELEASE_SCHEMA_VERSION,
    ruleVersion: RELEASE_RULE_VERSION,
    releaseId: requireString(value.releaseId, 'releaseId'),
    generatedAt: requireTimestamp(value.generatedAt, 'generatedAt'),
    correlationId: requireString(value.correlationId, 'correlationId'),
    modules: Object.freeze(modules),
    blockers: Object.freeze(blockers.sort()),
    mode: 'shadow',
    networkUsed: false,
    oauthConnected: false,
    liveActionsExecuted: false,
    productionReady: false
  });
  return Object.freeze({
    ...core,
    manifestHash: stableHash(core),
    releaseState: blockers.length === 0 ? 'SHADOW_RELEASE_READY' : 'BLOCKED'
  });
}

export function verifyReleaseManifest(manifest, artifactContents) {
  const value = requireObject(manifest, 'manifest');
  const contents = requireObject(artifactContents, 'artifactContents');
  const copy = { ...value };
  delete copy.manifestHash;
  delete copy.releaseState;
  if (stableHash(copy) !== value.manifestHash) throw new ReleaseValidationError('Release manifest hash mismatch');
  const failures = [];
  for (const module of value.modules) {
    for (const artifact of module.artifacts) {
      if (!(artifact.path in contents)) failures.push(`${artifact.path}:MISSING`);
      else if (stableHash(contents[artifact.path]) !== artifact.sha256) failures.push(`${artifact.path}:HASH_MISMATCH`);
    }
  }
  if (failures.length > 0) throw new ReleaseValidationError('Release artifact verification failed', { failures });
  return Object.freeze({
    verified: true,
    artifactCount: value.modules.reduce((sum, module) => sum + module.artifacts.length, 0),
    manifestHash: value.manifestHash,
    networkUsed: false,
    liveActionsExecuted: false
  });
}

export function buildTraceGraph(input) {
  const value = requireObject(input, 'trace');
  const correlationId = requireString(value.correlationId, 'correlationId');
  const steps = requireArray(value.steps, 'steps').map((step, index) => {
    const item = requireObject(step, `steps[${index}]`);
    return Object.freeze({
      stepId: requireString(item.stepId, 'stepId'),
      moduleId: requireString(item.moduleId, 'moduleId'),
      causationId: item.causationId == null ? null : requireString(item.causationId, 'causationId'),
      state: requireString(item.state, 'state'),
      evidenceRef: requireString(item.evidenceRef, 'evidenceRef'),
      sequence: index + 1
    });
  });
  const seen = new Set();
  for (const step of steps) {
    if (seen.has(step.stepId)) throw new ReleaseValidationError('Duplicate trace step', { stepId: step.stepId });
    if (step.causationId && !seen.has(step.causationId)) {
      throw new ReleaseValidationError('Trace causation points forward or is missing', { stepId: step.stepId, causationId: step.causationId });
    }
    seen.add(step.stepId);
  }
  const material = Object.freeze({ schemaVersion: 1, ruleVersion: RELEASE_RULE_VERSION, correlationId, steps: Object.freeze(steps) });
  return Object.freeze({ ...material, traceHash: stableHash(material), networkUsed: false, liveActionsExecuted: false });
}

const REQUIRED_TABLES = Object.freeze(['tenants', 'projects', 'campaigns', 'content_items', 'social_variants', 'publish_jobs', 'metric_snapshots', 'comment_signals', 'trend_signals', 'hypotheses', 'experiments', 'production_briefs', 'events']);

export function buildPersistenceReadiness(sqlText) {
  const sql = requireString(sqlText, 'sqlText');
  const lower = sql.toLowerCase();
  const checks = [
    { id: 'SCHEMA_DECLARED', passed: lower.includes('create schema if not exists growth_os') },
    ...REQUIRED_TABLES.map((table) => ({ id: `TABLE_${table.toUpperCase()}`, passed: lower.includes(`create table if not exists growth_os.${table}`) })),
    { id: 'EVENTS_APPEND_ONLY', passed: lower.includes('prevent_event_mutation') && lower.includes('before update or delete on growth_os.events') },
    { id: 'RLS_ENABLED', passed: REQUIRED_TABLES.filter((table) => table !== 'tenants').every((table) => lower.includes(`alter table growth_os.${table} enable row level security`)) },
    { id: 'TENANT_SETTING_BOUNDARY', passed: lower.includes("current_setting('app.tenant_id', true)") },
    { id: 'SHADOW_MODE_CONSTRAINT', passed: lower.includes("check (mode = 'shadow')") }
  ];
  const failed = checks.filter((check) => !check.passed).map((check) => check.id);
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: RELEASE_RULE_VERSION,
    state: failed.length === 0 ? 'PROVEN_LOCAL_CONTRACT' : 'NOT_PROVEN',
    checks: Object.freeze(checks.map(Object.freeze)),
    failed: Object.freeze(failed),
    tableCount: REQUIRED_TABLES.length,
    remoteMigrationExecuted: false,
    runtimeRlsVerified: false,
    liveReady: false
  });
}

const DEPLOYMENT_GATE_DEFINITIONS = Object.freeze([
  ['REMOTE_DATABASE', 'platform-engineer', 'BLOCKED_EXTERNAL', 'NO_REMOTE_DATABASE_RUNTIME'],
  ['MIGRATION_DRY_RUN', 'database-engineer', 'BLOCKED_EXTERNAL', 'NO_REMOTE_MIGRATION_DRY_RUN'],
  ['RLS_TENANT_ISOLATION', 'security-engineer', 'BLOCKED_EXTERNAL', 'NO_RUNTIME_RLS_CROSS_TENANT_TEST'],
  ['AUTHENTICATION', 'security-engineer', 'BLOCKED_EXTERNAL', 'NO_AUTH_RUNTIME'],
  ['SECRET_STORE', 'security-engineer', 'BLOCKED_EXTERNAL', 'NO_MANAGED_SECRET_STORE_PROOF'],
  ['QUEUE_WORKERS', 'platform-engineer', 'BLOCKED_EXTERNAL', 'NO_PRODUCTIVE_WORKER_RUNTIME'],
  ['SCHEDULER_RUNTIME', 'platform-engineer', 'BLOCKED_EXTERNAL', 'NO_PRODUCTIVE_SCHEDULER_RUNTIME'],
  ['PROVIDER_OAUTH', 'integration-engineer', 'BLOCKED_EXTERNAL', 'NO_PROVIDER_OAUTH_OR_APP_APPROVAL'],
  ['WEBHOOK_CRYPTOGRAPHY', 'security-engineer', 'BLOCKED_EXTERNAL', 'NO_REAL_SIGNATURE_VERIFICATION'],
  ['REMOTE_BACKUP', 'operations-engineer', 'BLOCKED_EXTERNAL', 'NO_REMOTE_BACKUP_PROOF'],
  ['RESTORE_DRILL', 'operations-engineer', 'BLOCKED_EXTERNAL', 'NO_REAL_RESTORE_DRILL'],
  ['OBSERVABILITY', 'operations-engineer', 'BLOCKED_EXTERNAL', 'NO_PRODUCTIVE_TELEMETRY'],
  ['ALERTING', 'operations-engineer', 'BLOCKED_EXTERNAL', 'NO_EXTERNAL_ALERT_DELIVERY'],
  ['EXTERNAL_AUDIT_ANCHOR', 'security-engineer', 'BLOCKED_EXTERNAL', 'LOCAL_ANCHOR_ONLY'],
  ['SECURITY_REVIEW', 'security-owner', 'HUMAN_APPROVAL_REQUIRED', 'NO_SIGNED_SECURITY_REVIEW'],
  ['LIVE_ACTIVATION', 'product-owner', 'HUMAN_APPROVAL_REQUIRED', 'NO_HUMAN_LIVE_APPROVAL'],
  ['MAIN_INTEGRATION', 'repository-owner', 'HUMAN_APPROVAL_REQUIRED', 'RECOVERY_STOP_RULE']
]);

function normalizeExternalEvidence(input = {}) {
  const evidence = requireObject(input, 'externalEvidence');
  assertNoForbiddenMaterial(evidence, 'externalEvidence');
  return evidence;
}

export function buildDeploymentReadiness({ manifest, persistence, externalEvidence = {} }) {
  requireObject(manifest, 'manifest');
  requireObject(persistence, 'persistence');
  const supplied = normalizeExternalEvidence(externalEvidence);
  const gates = DEPLOYMENT_GATE_DEFINITIONS.map(([area, ownerRole, defaultState, defaultReason]) => {
    const candidate = supplied[area];
    if (candidate == null) return Object.freeze({ area, ownerRole, state: defaultState, reason: defaultReason, evidenceRef: null, verifiedAt: null, verifiedByHuman: false });
    const value = requireObject(candidate, `externalEvidence.${area}`);
    const state = requireString(value.state, `${area}.state`);
    if (state !== 'PROVEN_EXTERNAL') throw new ReleaseValidationError('External gate can only be supplied as PROVEN_EXTERNAL', { area, state });
    if (value.verifiedByHuman !== true) throw new ReleaseValidationError('External gate requires human verification', { area });
    return Object.freeze({
      area,
      ownerRole,
      state,
      reason: 'EXTERNAL_EVIDENCE_VERIFIED',
      evidenceRef: requireString(value.evidenceRef, `${area}.evidenceRef`),
      verifiedAt: requireTimestamp(value.verifiedAt, `${area}.verifiedAt`),
      verifiedByHuman: true
    });
  });
  const shadowReleaseReady = manifest.releaseState === 'SHADOW_RELEASE_READY' && persistence.state === 'PROVEN_LOCAL_CONTRACT';
  const externalReady = gates.every((gate) => gate.state === 'PROVEN_EXTERNAL');
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: RELEASE_RULE_VERSION,
    local: Object.freeze({ releaseManifest: manifest.releaseState, persistenceContract: persistence.state, shadowReleaseReady }),
    gates: Object.freeze(gates),
    blockedGateCount: gates.filter((gate) => gate.state !== 'PROVEN_EXTERNAL').length,
    shadowReleaseReady,
    liveReady: shadowReleaseReady && externalReady,
    networkUsed: false,
    oauthConnected: false,
    liveActionsExecuted: false
  });
}

export function buildActivationChecklist(readiness) {
  const value = requireObject(readiness, 'readiness');
  const items = value.gates.map((gate, index) => Object.freeze({
    order: index + 1,
    area: gate.area,
    ownerRole: gate.ownerRole,
    state: gate.state,
    evidenceRequired: gate.state !== 'PROVEN_EXTERNAL',
    automaticCompletionAllowed: false,
    evidenceRef: gate.evidenceRef
  }));
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: RELEASE_RULE_VERSION,
    items: Object.freeze(items),
    completed: items.filter((item) => !item.evidenceRequired).length,
    total: items.length,
    liveActivationAllowed: value.liveReady === true,
    humanApprovalRequired: true
  });
}

export function evaluateFailureScenario(input) {
  const value = requireObject(input, 'failure');
  const type = requireString(value.type, 'type');
  const outcomes = {
    KILL_SWITCH: 'SAFE_BLOCKED', AUTH_NOT_READY: 'SAFE_BLOCKED', RATE_LIMIT: 'SAFE_BACKOFF', WEBHOOK_REPLAY: 'SAFE_QUARANTINED',
    MANIFEST_TAMPER: 'SAFE_REJECTED', INSUFFICIENT_METRICS: 'SAFE_HOLD', RLS_FAILURE: 'SAFE_LOCKDOWN', RESTORE_FAILURE: 'SAFE_LOCKDOWN'
  };
  if (!(type in outcomes)) throw new ReleaseValidationError('Unknown failure scenario', { type });
  return Object.freeze({
    type,
    outcome: outcomes[type],
    networkUsed: false,
    liveActionsExecuted: false,
    recoveryRequiresHuman: ['KILL_SWITCH', 'MANIFEST_TAMPER', 'RLS_FAILURE', 'RESTORE_FAILURE'].includes(type)
  });
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function renderReleaseHtml(report) {
  const value = requireObject(report, 'report');
  const gateRows = value.readiness.gates.map((gate) => `<tr><td>${escapeHtml(gate.area)}</td><td>${escapeHtml(gate.state)}</td><td>${escapeHtml(gate.ownerRole)}</td><td>${escapeHtml(gate.reason)}</td></tr>`).join('');
  const modules = value.manifest.modules.map((module) => `<li>${escapeHtml(module.moduleId)} · ${escapeHtml(module.state)} · ${escapeHtml(module.ruleVersion)}</li>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'; script-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>MKT0 Shadow Release</title><style>body{font-family:system-ui;margin:0;background:#101216;color:#eef}main{max-width:1100px;margin:auto;padding:2rem}.banner{padding:1rem;background:#4a2f10;border:1px solid #b47b25}.ok{color:#8fe39b}.bad{color:#ffaaa0}table{border-collapse:collapse;width:100%;margin-top:1rem}td,th{border:1px solid #445;padding:.6rem;text-align:left}code{word-break:break-all}@media(max-width:700px){main{padding:1rem}table{font-size:.78rem}td,th{padding:.35rem}}</style></head><body><main><h1>MKT0 Shadow Release Candidate</h1><p class="banner">SHADOW RELEASE READY bedeutet nicht LIVE READY. Externe Gates bleiben gesperrt.</p><p>Release: ${escapeHtml(value.manifest.releaseId)}</p><p>Manifest: <code>${escapeHtml(value.manifest.manifestHash)}</code></p><p>Shadow: <strong class="${value.readiness.shadowReleaseReady ? 'ok' : 'bad'}">${escapeHtml(value.readiness.shadowReleaseReady)}</strong> · Live: <strong class="bad">${escapeHtml(value.readiness.liveReady)}</strong></p><h2>Module</h2><ul>${modules}</ul><h2>Produktive Gates</h2><table><thead><tr><th>Bereich</th><th>Status</th><th>Owner</th><th>Grund</th></tr></thead><tbody>${gateRows}</tbody></table></main></body></html>`;
}

export function assertReadOnlyReleaseHtml(html) {
  const text = requireString(html, 'html');
  if (!text.includes("default-src 'none'")) throw new ReleaseValidationError('Missing restrictive CSP');
  if (/<(script|form|button|input|textarea|select|iframe|object)\b/i.test(text) || /https?:\/\//i.test(text) || /fetch\s*\(/i.test(text) || /XMLHttpRequest/i.test(text)) {
    throw new ReleaseValidationError('Release HTML is not read-only/offline');
  }
  return true;
}
