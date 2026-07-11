import { createHash } from 'node:crypto';

export const OPERATIONS_SCHEMA_VERSION = 1;
export const OPERATIONS_RULE_VERSION = 'mkt0-007.v1';
export const OPERATING_MODES = Object.freeze(['SHADOW', 'PAUSED', 'INCIDENT_LOCKDOWN']);
export const INCIDENT_SEVERITIES = Object.freeze(['SEV0', 'SEV1', 'SEV2', 'SEV3']);
export const MODULES = Object.freeze(['core', 'data', 'analytics', 'signals', 'orchestrator', 'cockpit']);
export const RETENTION_CLASSES = Object.freeze(['EPHEMERAL_7D', 'OPERATIONAL_30D', 'AUDIT_365D', 'LEGAL_HOLD']);

const SEVERITY_RANK = Object.freeze({ SEV0: 4, SEV1: 3, SEV2: 2, SEV3: 1 });
const SECRET_STATUSES = Object.freeze(['PRESENT', 'MISSING_REQUIRED', 'MISSING_OPTIONAL', 'ROTATION_DUE', 'DISABLED']);
const HASH_PATTERN = /^[a-f0-9]{64}$/;

export class OperationsValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'OperationsValidationError';
    this.details = details;
  }
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OperationsValidationError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new OperationsValidationError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') throw new OperationsValidationError(`Missing or invalid boolean: ${field}`, { field, value });
  return value;
}

function requireInteger(value, field, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new OperationsValidationError(`Missing or invalid integer: ${field}`, { field, value, min, max });
  }
  return value;
}

function requireEnum(value, field, allowed) {
  const text = requireString(value, field);
  if (!allowed.includes(text)) throw new OperationsValidationError(`Unsupported value: ${field}`, { field, value: text, allowed });
  return text;
}

function requireTimestamp(value, field) {
  const text = requireString(value, field);
  if (!text.includes('T') || !Number.isFinite(Date.parse(text))) {
    throw new OperationsValidationError(`Missing or invalid ISO timestamp: ${field}`, { field, value });
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

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function freezeArray(items) {
  return Object.freeze(items.map((item) => item && typeof item === 'object' ? Object.freeze(item) : item));
}

function sortedUniqueStrings(value, field) {
  if (value == null) return Object.freeze([]);
  if (!Array.isArray(value)) throw new OperationsValidationError(`Missing or invalid array: ${field}`, { field });
  return Object.freeze([...new Set(value.map((item) => requireString(item, `${field}[]`)))].sort());
}

export function validateOperationsConfig(input) {
  const config = requireObject(input, 'operationsConfig');
  if (config.schemaVersion !== OPERATIONS_SCHEMA_VERSION) {
    throw new OperationsValidationError(`operationsConfig.schemaVersion must be ${OPERATIONS_SCHEMA_VERSION}`);
  }
  const moduleSwitches = requireObject(config.moduleSwitches, 'moduleSwitches');
  const normalizedSwitches = {};
  for (const moduleName of MODULES) normalizedSwitches[moduleName] = requireBoolean(moduleSwitches[moduleName], `moduleSwitches.${moduleName}`);
  const recoveryObjectives = requireObject(config.recoveryObjectives, 'recoveryObjectives');
  const retentionPolicies = validateRetentionPolicies(config.retentionPolicies);
  return Object.freeze({
    schemaVersion: OPERATIONS_SCHEMA_VERSION,
    ruleVersion: OPERATIONS_RULE_VERSION,
    tenantId: requireString(config.tenantId, 'tenantId'),
    projectId: requireString(config.projectId, 'projectId'),
    mode: requireEnum(config.mode, 'mode', OPERATING_MODES),
    globalKillSwitch: requireBoolean(config.globalKillSwitch, 'globalKillSwitch'),
    moduleSwitches: Object.freeze(normalizedSwitches),
    recoveryObjectives: Object.freeze({
      rpoMinutesTarget: requireInteger(recoveryObjectives.rpoMinutesTarget, 'recoveryObjectives.rpoMinutesTarget', 1, 10080),
      rtoMinutesTarget: requireInteger(recoveryObjectives.rtoMinutesTarget, 'recoveryObjectives.rtoMinutesTarget', 1, 10080),
      evidenceStatus: requireEnum(recoveryObjectives.evidenceStatus ?? 'NOT_PROVEN', 'recoveryObjectives.evidenceStatus', ['NOT_PROVEN'])
    }),
    retentionPolicies,
    automaticLockdownReleaseAllowed: false,
    liveActionsAllowed: false
  });
}

export function validateIncident(input) {
  const incident = requireObject(input, 'incident');
  if (incident.schemaVersion !== 1) throw new OperationsValidationError('incident.schemaVersion must be 1');
  const status = requireEnum(incident.status, 'incident.status', ['OPEN', 'MITIGATED', 'RESOLVED']);
  const detectedAt = requireTimestamp(incident.detectedAt, 'incident.detectedAt');
  const resolvedAt = incident.resolvedAt == null ? null : requireTimestamp(incident.resolvedAt, 'incident.resolvedAt');
  if (status === 'RESOLVED' && !resolvedAt) throw new OperationsValidationError('Resolved incident requires resolvedAt');
  if (resolvedAt && Date.parse(resolvedAt) < Date.parse(detectedAt)) throw new OperationsValidationError('resolvedAt cannot precede detectedAt');
  return Object.freeze({
    schemaVersion: 1,
    id: requireString(incident.id, 'incident.id'),
    tenantId: requireString(incident.tenantId, 'incident.tenantId'),
    projectId: requireString(incident.projectId, 'incident.projectId'),
    severity: requireEnum(incident.severity, 'incident.severity', INCIDENT_SEVERITIES),
    category: requireEnum(incident.category, 'incident.category', ['SECURITY', 'DATA_INTEGRITY', 'AVAILABILITY', 'RIGHTS', 'PRIVACY', 'PLATFORM', 'UNKNOWN']),
    status,
    detectedAt,
    resolvedAt,
    summary: requireString(incident.summary, 'incident.summary').slice(0, 500),
    evidenceRefs: sortedUniqueStrings(incident.evidenceRefs, 'incident.evidenceRefs'),
    humanOwner: incident.humanOwner == null ? null : requireString(incident.humanOwner, 'incident.humanOwner'),
    publicActionsExecuted: false
  });
}

export function triageIncident(rawIncident) {
  const incident = validateIncident(rawIncident);
  const lockdownRequired = ['SEV0', 'SEV1'].includes(incident.severity) && incident.status !== 'RESOLVED';
  const notify = incident.severity === 'SEV0' ? 'IMMEDIATE_HUMAN_ESCALATION' : incident.severity === 'SEV1' ? 'URGENT_HUMAN_ESCALATION' : 'HUMAN_REVIEW_QUEUE';
  const responseTargetMinutes = Object.freeze({ SEV0: 5, SEV1: 15, SEV2: 60, SEV3: 240 })[incident.severity];
  return Object.freeze({
    incidentId: incident.id,
    severity: incident.severity,
    lockdownRequired,
    operatingModeRequired: lockdownRequired ? 'INCIDENT_LOCKDOWN' : null,
    notificationPolicy: notify,
    responseTargetMinutes,
    automaticResolutionAllowed: false,
    communicationDraftOnly: true,
    publicActionsExecuted: false
  });
}

export function evaluateOperationalState(rawConfig, rawIncidents = []) {
  const config = validateOperationsConfig(rawConfig);
  if (!Array.isArray(rawIncidents)) throw new OperationsValidationError('incidents must be an array');
  const incidents = rawIncidents.map(validateIncident);
  const scopeMismatch = incidents.some((incident) => incident.tenantId !== config.tenantId || incident.projectId !== config.projectId);
  if (scopeMismatch) throw new OperationsValidationError('Incident scope mismatch');
  const active = incidents.filter((incident) => incident.status !== 'RESOLVED');
  const highestSeverity = active.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.id.localeCompare(b.id))[0]?.severity ?? null;
  const incidentLockdown = active.some((incident) => ['SEV0', 'SEV1'].includes(incident.severity));
  const effectiveMode = incidentLockdown ? 'INCIDENT_LOCKDOWN' : config.globalKillSwitch ? 'PAUSED' : config.mode;
  const moduleAvailability = Object.fromEntries(MODULES.map((moduleName) => [moduleName, effectiveMode === 'SHADOW' && config.moduleSwitches[moduleName]]));
  const reasons = [];
  if (incidentLockdown) reasons.push('ACTIVE_SEV0_OR_SEV1');
  if (config.globalKillSwitch) reasons.push('GLOBAL_KILL_SWITCH_ACTIVE');
  if (config.mode === 'PAUSED') reasons.push('CONFIGURED_PAUSED');
  if (config.mode === 'INCIDENT_LOCKDOWN') reasons.push('CONFIGURED_INCIDENT_LOCKDOWN');
  for (const moduleName of MODULES) if (!config.moduleSwitches[moduleName]) reasons.push(`MODULE_DISABLED_${moduleName.toUpperCase()}`);
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: OPERATIONS_RULE_VERSION,
    tenantId: config.tenantId,
    projectId: config.projectId,
    configuredMode: config.mode,
    effectiveMode,
    highestActiveSeverity: highestSeverity,
    activeIncidentCount: active.length,
    globalKillSwitch: config.globalKillSwitch,
    moduleAvailability: Object.freeze(moduleAvailability),
    reasons: Object.freeze(reasons.sort()),
    shadowJobsAllowed: effectiveMode === 'SHADOW' && config.moduleSwitches.orchestrator,
    liveActionsAllowed: false,
    automaticLockdownReleaseAllowed: false
  });
}

export function gateShadowJobs(rawJobs, operationalState) {
  if (!Array.isArray(rawJobs)) throw new OperationsValidationError('jobs must be an array');
  const state = requireObject(operationalState, 'operationalState');
  return Object.freeze(rawJobs.map((job) => {
    const value = requireObject(job, 'job');
    if (value.mode !== 'shadow' || value.publicActionAllowed !== false) {
      throw new OperationsValidationError('Only shadow jobs can pass the operations gate', { jobId: value.id });
    }
    if (!state.shadowJobsAllowed) {
      return Object.freeze({ ...value, operationsGate: 'BLOCKED', blockedReason: state.effectiveMode, publicActionAllowed: false });
    }
    return Object.freeze({ ...value, operationsGate: 'ALLOWED_SHADOW', blockedReason: null, publicActionAllowed: false });
  }));
}

export function releaseIncidentLockdown(rawConfig, { approvedByHuman, approvedAt, evidenceRef }) {
  const config = validateOperationsConfig(rawConfig);
  if (config.mode !== 'INCIDENT_LOCKDOWN') throw new OperationsValidationError('Config is not in incident lockdown');
  if (approvedByHuman !== true) throw new OperationsValidationError('Incident lockdown requires explicit human approval');
  const at = requireTimestamp(approvedAt, 'approvedAt');
  const ref = requireString(evidenceRef, 'evidenceRef');
  return Object.freeze({
    ...config,
    mode: 'PAUSED',
    globalKillSwitch: true,
    lockdownRelease: Object.freeze({ approvedByHuman: true, approvedAt: at, evidenceRef: ref }),
    automaticLockdownReleaseAllowed: false,
    liveActionsAllowed: false
  });
}

function validateBackupArtifact(input, index) {
  const artifact = requireObject(input, `artifacts[${index}]`);
  const hash = requireString(artifact.sha256, `artifacts[${index}].sha256`).toLowerCase();
  if (!HASH_PATTERN.test(hash)) throw new OperationsValidationError('Invalid artifact sha256', { index, hash });
  return Object.freeze({
    path: requireString(artifact.path, `artifacts[${index}].path`),
    sha256: hash,
    sizeBytes: requireInteger(artifact.sizeBytes, `artifacts[${index}].sizeBytes`, 0),
    retentionClass: requireEnum(artifact.retentionClass, `artifacts[${index}].retentionClass`, RETENTION_CLASSES),
    requiredForRestore: requireBoolean(artifact.requiredForRestore, `artifacts[${index}].requiredForRestore`)
  });
}

export function buildBackupManifest({ backupId, tenantId, projectId, createdAt, artifacts, sourceCommit }) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) throw new OperationsValidationError('Backup requires artifacts');
  const normalized = artifacts.map(validateBackupArtifact).sort((a, b) => a.path.localeCompare(b.path));
  const paths = new Set();
  for (const artifact of normalized) {
    if (paths.has(artifact.path)) throw new OperationsValidationError('Duplicate backup artifact path', { path: artifact.path });
    paths.add(artifact.path);
  }
  const ordered = normalized.map((artifact, index) => Object.freeze({ ...artifact, restoreOrder: index + 1 }));
  const body = Object.freeze({
    schemaVersion: 1,
    ruleVersion: OPERATIONS_RULE_VERSION,
    backupId: requireString(backupId, 'backupId'),
    tenantId: requireString(tenantId, 'tenantId'),
    projectId: requireString(projectId, 'projectId'),
    createdAt: requireTimestamp(createdAt, 'createdAt'),
    sourceCommit: requireString(sourceCommit, 'sourceCommit'),
    artifacts: freezeArray(ordered),
    artifactCount: ordered.length,
    totalSizeBytes: ordered.reduce((sum, artifact) => sum + artifact.sizeBytes, 0),
    remoteBackupExecuted: false
  });
  return Object.freeze({ ...body, manifestHash: sha256(body) });
}

export function verifyBackupManifest(rawManifest) {
  const manifest = requireObject(rawManifest, 'manifest');
  if (manifest.schemaVersion !== 1) throw new OperationsValidationError('manifest.schemaVersion must be 1');
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) throw new OperationsValidationError('Manifest requires artifacts');
  const artifacts = manifest.artifacts.map(validateBackupArtifact);
  const paths = new Set();
  artifacts.forEach((artifact, index) => {
    if (paths.has(artifact.path)) throw new OperationsValidationError('Duplicate backup artifact path', { path: artifact.path });
    paths.add(artifact.path);
    if (manifest.artifacts[index].restoreOrder !== index + 1) throw new OperationsValidationError('Invalid restore order', { index });
    if (index > 0 && artifacts[index - 1].path.localeCompare(artifact.path) > 0) throw new OperationsValidationError('Artifacts are not sorted');
  });
  if (manifest.artifactCount !== artifacts.length) throw new OperationsValidationError('Manifest artifactCount mismatch');
  const totalSizeBytes = artifacts.reduce((sum, artifact) => sum + artifact.sizeBytes, 0);
  if (manifest.totalSizeBytes !== totalSizeBytes) throw new OperationsValidationError('Manifest totalSizeBytes mismatch');
  const body = {
    schemaVersion: manifest.schemaVersion,
    ruleVersion: requireString(manifest.ruleVersion, 'manifest.ruleVersion'),
    backupId: requireString(manifest.backupId, 'manifest.backupId'),
    tenantId: requireString(manifest.tenantId, 'manifest.tenantId'),
    projectId: requireString(manifest.projectId, 'manifest.projectId'),
    createdAt: requireTimestamp(manifest.createdAt, 'manifest.createdAt'),
    sourceCommit: requireString(manifest.sourceCommit, 'manifest.sourceCommit'),
    artifacts: manifest.artifacts,
    artifactCount: manifest.artifactCount,
    totalSizeBytes: manifest.totalSizeBytes,
    remoteBackupExecuted: requireBoolean(manifest.remoteBackupExecuted, 'manifest.remoteBackupExecuted')
  };
  const expected = sha256(body);
  if (manifest.manifestHash !== expected) throw new OperationsValidationError('Manifest hash mismatch', { expected, actual: manifest.manifestHash });
  return Object.freeze({ valid: true, backupId: body.backupId, artifactCount: artifacts.length, manifestHash: expected });
}

export function buildRestorePlan(rawManifest, { restoreId, requestedAt, rollbackPointRef }) {
  const verification = verifyBackupManifest(rawManifest);
  const manifest = rawManifest;
  const requiredArtifacts = manifest.artifacts.filter((artifact) => artifact.requiredForRestore);
  if (requiredArtifacts.length === 0) throw new OperationsValidationError('Restore plan requires at least one required artifact');
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: OPERATIONS_RULE_VERSION,
    restoreId: requireString(restoreId, 'restoreId'),
    backupId: verification.backupId,
    tenantId: manifest.tenantId,
    projectId: manifest.projectId,
    requestedAt: requireTimestamp(requestedAt, 'requestedAt'),
    mode: 'DRY_RUN_ONLY',
    preconditions: Object.freeze([
      'INCIDENT_LOCKDOWN_OR_PAUSED',
      'MANIFEST_HASH_VERIFIED',
      'SCOPE_VERIFIED',
      'ROLLBACK_POINT_RECORDED',
      'HUMAN_APPROVAL_REQUIRED_BEFORE_REAL_RESTORE'
    ]),
    rollbackPointRef: requireString(rollbackPointRef, 'rollbackPointRef'),
    steps: freezeArray(requiredArtifacts.map((artifact, index) => ({
      order: index + 1,
      action: 'VERIFY_AND_STAGE_ARTIFACT',
      path: artifact.path,
      expectedSha256: artifact.sha256,
      expectedSizeBytes: artifact.sizeBytes
    }))),
    verifySteps: Object.freeze(['VERIFY_ARTIFACT_COUNT', 'VERIFY_HASHES', 'VERIFY_SCOPE', 'VERIFY_EVENT_CHAIN', 'VERIFY_READ_ONLY_STARTUP']),
    realRestoreExecuted: false,
    automaticExecutionAllowed: false
  });
}

export function runSyntheticRestoreDrill({ restorePlan, providedArtifacts, operationalState }) {
  const plan = requireObject(restorePlan, 'restorePlan');
  const state = requireObject(operationalState, 'operationalState');
  if (!['PAUSED', 'INCIDENT_LOCKDOWN'].includes(state.effectiveMode)) {
    throw new OperationsValidationError('Restore drill requires PAUSED or INCIDENT_LOCKDOWN');
  }
  if (!Array.isArray(providedArtifacts)) throw new OperationsValidationError('providedArtifacts must be an array');
  const byPath = new Map(providedArtifacts.map((artifact, index) => {
    const normalized = validateBackupArtifact({ ...artifact, retentionClass: artifact.retentionClass ?? 'AUDIT_365D', requiredForRestore: artifact.requiredForRestore ?? true }, index);
    return [normalized.path, normalized];
  }));
  const results = plan.steps.map((step) => {
    const provided = byPath.get(step.path);
    const status = !provided ? 'MISSING' : provided.sha256 !== step.expectedSha256 ? 'HASH_MISMATCH' : provided.sizeBytes !== step.expectedSizeBytes ? 'SIZE_MISMATCH' : 'VERIFIED';
    return Object.freeze({ path: step.path, status });
  });
  const failures = results.filter((result) => result.status !== 'VERIFIED');
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: OPERATIONS_RULE_VERSION,
    restoreId: plan.restoreId,
    backupId: plan.backupId,
    status: failures.length ? 'FAILED' : 'PASS',
    results: freezeArray(results),
    rollbackPointRef: plan.rollbackPointRef,
    realRestoreExecuted: false,
    remoteServicesTouched: false,
    humanApprovalStillRequired: true
  });
}

export function validateRetentionPolicies(input) {
  if (!Array.isArray(input) || input.length === 0) throw new OperationsValidationError('retentionPolicies must be a non-empty array');
  const policies = input.map((raw, index) => {
    const policy = requireObject(raw, `retentionPolicies[${index}]`);
    const retentionClass = requireEnum(policy.retentionClass, `retentionPolicies[${index}].retentionClass`, RETENTION_CLASSES);
    const legalHold = retentionClass === 'LEGAL_HOLD';
    const days = legalHold ? null : requireInteger(policy.days, `retentionPolicies[${index}].days`, 1, 3650);
    return Object.freeze({
      retentionClass,
      days,
      deletionMode: legalHold ? 'NO_AUTOMATIC_DELETION' : requireEnum(policy.deletionMode, `retentionPolicies[${index}].deletionMode`, ['EXPIRE_METADATA_ONLY', 'DELETE_AFTER_VERIFIED_BACKUP', 'MANUAL_REVIEW']),
      humanApprovalRequired: legalHold || requireBoolean(policy.humanApprovalRequired, `retentionPolicies[${index}].humanApprovalRequired`)
    });
  }).sort((a, b) => a.retentionClass.localeCompare(b.retentionClass));
  if (new Set(policies.map((policy) => policy.retentionClass)).size !== policies.length) throw new OperationsValidationError('Duplicate retention class');
  return freezeArray(policies);
}

export function buildRetentionDecision({ itemId, retentionClass, createdAt, asOf, policies }) {
  const normalizedPolicies = validateRetentionPolicies(policies);
  const policy = normalizedPolicies.find((entry) => entry.retentionClass === retentionClass);
  if (!policy) throw new OperationsValidationError('Missing retention policy', { retentionClass });
  const created = requireTimestamp(createdAt, 'createdAt');
  const now = requireTimestamp(asOf, 'asOf');
  const expiresAt = policy.days == null ? null : new Date(Date.parse(created) + policy.days * 86400000).toISOString();
  const expired = expiresAt != null && Date.parse(now) >= Date.parse(expiresAt);
  return Object.freeze({
    itemId: requireString(itemId, 'itemId'),
    retentionClass,
    createdAt: created,
    asOf: now,
    expiresAt,
    status: policy.retentionClass === 'LEGAL_HOLD' ? 'RETAIN' : expired ? 'REVIEW_FOR_DISPOSITION' : 'RETAIN',
    deletionMode: policy.deletionMode,
    humanApprovalRequired: policy.humanApprovalRequired,
    automaticDeletionExecuted: false
  });
}

export function validateSecretInventory(input) {
  if (!Array.isArray(input)) throw new OperationsValidationError('secretInventory must be an array');
  const forbiddenKeys = /(value|secret|token|password|credential|privatekey|apikey)/i;
  const names = new Set();
  const entries = input.map((raw, index) => {
    const entry = requireObject(raw, `secretInventory[${index}]`);
    for (const key of Object.keys(entry)) {
      if (key !== 'name' && key !== 'status' && key !== 'required' && key !== 'lastRotatedAt' && key !== 'ownerRole') {
        if (forbiddenKeys.test(key) || typeof entry[key] === 'string') throw new OperationsValidationError('Secret inventory contains forbidden field', { index, key });
      }
    }
    const name = requireString(entry.name, `secretInventory[${index}].name`);
    if (names.has(name)) throw new OperationsValidationError('Duplicate secret inventory name', { name });
    names.add(name);
    const required = requireBoolean(entry.required, `secretInventory[${index}].required`);
    const status = requireEnum(entry.status, `secretInventory[${index}].status`, SECRET_STATUSES);
    if (required && status === 'MISSING_OPTIONAL') throw new OperationsValidationError('Required secret cannot be optional missing');
    return Object.freeze({
      name,
      required,
      status,
      lastRotatedAt: entry.lastRotatedAt == null ? null : requireTimestamp(entry.lastRotatedAt, `secretInventory[${index}].lastRotatedAt`),
      ownerRole: requireString(entry.ownerRole, `secretInventory[${index}].ownerRole`),
      valueIncluded: false
    });
  }).sort((a, b) => a.name.localeCompare(b.name));
  return freezeArray(entries);
}

export function buildAuditAnchorManifest({ tenantId, projectId, createdAt, eventHashes, sourceCommit }) {
  const hashes = sortedUniqueStrings(eventHashes, 'eventHashes').map((hash) => {
    const value = hash.toLowerCase();
    if (!HASH_PATTERN.test(value)) throw new OperationsValidationError('Invalid event hash', { hash });
    return value;
  });
  if (hashes.length === 0) throw new OperationsValidationError('Audit anchor requires hashes');
  const body = Object.freeze({
    schemaVersion: 1,
    ruleVersion: OPERATIONS_RULE_VERSION,
    tenantId: requireString(tenantId, 'tenantId'),
    projectId: requireString(projectId, 'projectId'),
    createdAt: requireTimestamp(createdAt, 'createdAt'),
    sourceCommit: requireString(sourceCommit, 'sourceCommit'),
    eventHashes: Object.freeze(hashes),
    eventCount: hashes.length,
    externalAnchorExecuted: false,
    externalAnchorProvider: 'NOT_CONFIGURED'
  });
  return Object.freeze({ ...body, rootHash: sha256(body) });
}

export function buildReadinessProjection({ config, incidents = [], secretInventory = [], lastVerifiedBackupAt = null, lastRestoreDrill = null, asOf }) {
  const operationalState = evaluateOperationalState(config, incidents);
  const secrets = validateSecretInventory(secretInventory);
  const timestamp = requireTimestamp(asOf, 'asOf');
  const blockers = [];
  const warnings = [];
  if (operationalState.effectiveMode === 'INCIDENT_LOCKDOWN') blockers.push('INCIDENT_LOCKDOWN_ACTIVE');
  if (operationalState.effectiveMode === 'PAUSED') warnings.push('SYSTEM_PAUSED');
  for (const secret of secrets) {
    if (secret.status === 'MISSING_REQUIRED') blockers.push(`SECRET_MISSING_${secret.name}`);
    if (secret.status === 'ROTATION_DUE') warnings.push(`SECRET_ROTATION_DUE_${secret.name}`);
  }
  let backupAgeMinutes = null;
  if (lastVerifiedBackupAt) {
    const backupAt = requireTimestamp(lastVerifiedBackupAt, 'lastVerifiedBackupAt');
    backupAgeMinutes = Math.floor((Date.parse(timestamp) - Date.parse(backupAt)) / 60000);
    if (backupAgeMinutes < 0) blockers.push('BACKUP_TIMESTAMP_IN_FUTURE');
    if (backupAgeMinutes > config.recoveryObjectives.rpoMinutesTarget) warnings.push('RPO_TARGET_EXCEEDED_UNPROVEN_RUNTIME');
  } else {
    warnings.push('NO_VERIFIED_BACKUP_RUNTIME_PROOF');
  }
  if (!lastRestoreDrill) warnings.push('NO_RESTORE_DRILL_RESULT');
  else if (lastRestoreDrill.status !== 'PASS') blockers.push('LATEST_RESTORE_DRILL_FAILED');
  const status = blockers.length ? 'NOT_READY' : warnings.length ? 'DEGRADED' : 'READY_SHADOW';
  return Object.freeze({
    schemaVersion: 1,
    ruleVersion: OPERATIONS_RULE_VERSION,
    asOf: timestamp,
    status,
    operatingMode: operationalState.effectiveMode,
    blockers: Object.freeze(blockers.sort()),
    warnings: Object.freeze(warnings.sort()),
    moduleAvailability: operationalState.moduleAvailability,
    backupAgeMinutes,
    recoveryObjectives: config.recoveryObjectives,
    recoveryObjectivesProvenInProduction: false,
    liveActionsAllowed: false,
    automaticRecoveryAllowed: false
  });
}
