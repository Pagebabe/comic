import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OperationsValidationError,
  buildAuditAnchorManifest,
  buildBackupManifest,
  buildReadinessProjection,
  buildRestorePlan,
  buildRetentionDecision,
  evaluateOperationalState,
  gateShadowJobs,
  releaseIncidentLockdown,
  runSyntheticRestoreDrill,
  sha256,
  triageIncident,
  validateOperationsConfig,
  validateSecretInventory,
  verifyBackupManifest
} from '../growth-os/operations.mjs';

const policies = [
  { retentionClass: 'EPHEMERAL_7D', days: 7, deletionMode: 'EXPIRE_METADATA_ONLY', humanApprovalRequired: false },
  { retentionClass: 'OPERATIONAL_30D', days: 30, deletionMode: 'DELETE_AFTER_VERIFIED_BACKUP', humanApprovalRequired: true },
  { retentionClass: 'AUDIT_365D', days: 365, deletionMode: 'MANUAL_REVIEW', humanApprovalRequired: true },
  { retentionClass: 'LEGAL_HOLD', deletionMode: 'NO_AUTOMATIC_DELETION', humanApprovalRequired: true }
];

const config = (overrides = {}) => ({
  schemaVersion: 1,
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  mode: 'SHADOW',
  globalKillSwitch: false,
  moduleSwitches: {
    core: true,
    data: true,
    analytics: true,
    signals: true,
    orchestrator: true,
    cockpit: true
  },
  recoveryObjectives: {
    rpoMinutesTarget: 60,
    rtoMinutesTarget: 120,
    evidenceStatus: 'NOT_PROVEN'
  },
  retentionPolicies: policies,
  ...overrides
});

const incident = (overrides = {}) => ({
  schemaVersion: 1,
  id: 'incident_1',
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  severity: 'SEV1',
  category: 'DATA_INTEGRITY',
  status: 'OPEN',
  detectedAt: '2026-07-11T09:00:00.000Z',
  resolvedAt: null,
  summary: 'Synthetic data integrity incident',
  evidenceRefs: ['evidence://incident/1'],
  humanOwner: 'operations_lead',
  ...overrides
});

const shadowJob = (overrides = {}) => ({
  id: 'shadow_job_1',
  mode: 'shadow',
  publicActionAllowed: false,
  state: 'APPROVED_SHADOW',
  ...overrides
});

const artifacts = () => [
  { path: 'events.ndjson', sha256: sha256('events'), sizeBytes: 120, retentionClass: 'AUDIT_365D', requiredForRestore: true },
  { path: 'projections.json', sha256: sha256('projections'), sizeBytes: 80, retentionClass: 'OPERATIONAL_30D', requiredForRestore: true },
  { path: 'diagnostics.json', sha256: sha256('diagnostics'), sizeBytes: 20, retentionClass: 'EPHEMERAL_7D', requiredForRestore: false }
];

const manifest = () => buildBackupManifest({
  backupId: 'backup_1',
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  createdAt: '2026-07-11T10:00:00.000Z',
  sourceCommit: '73e5393f23b118112594e4e3be330a63da3e5747',
  artifacts: artifacts().reverse()
});

test('operations configuration is deterministic and live actions remain forbidden', () => {
  assert.deepEqual(validateOperationsConfig(config()), validateOperationsConfig(config()));
  assert.equal(validateOperationsConfig(config()).liveActionsAllowed, false);
  assert.equal(validateOperationsConfig(config()).automaticLockdownReleaseAllowed, false);
});

test('unsupported live operating mode is rejected', () => {
  assert.throws(() => validateOperationsConfig(config({ mode: 'LIVE' })), /Unsupported value/);
});

test('global kill switch blocks every shadow job', () => {
  const state = evaluateOperationalState(config({ globalKillSwitch: true }));
  const [job] = gateShadowJobs([shadowJob()], state);
  assert.equal(state.effectiveMode, 'PAUSED');
  assert.equal(job.operationsGate, 'BLOCKED');
  assert.equal(job.publicActionAllowed, false);
});

test('disabled orchestrator module blocks jobs while preserving shadow boundary', () => {
  const value = config();
  value.moduleSwitches.orchestrator = false;
  const state = evaluateOperationalState(value);
  const [job] = gateShadowJobs([shadowJob()], state);
  assert.equal(state.effectiveMode, 'SHADOW');
  assert.equal(state.shadowJobsAllowed, false);
  assert.equal(job.operationsGate, 'BLOCKED');
});

test('SEV0 and SEV1 incidents force incident lockdown', () => {
  for (const severity of ['SEV0', 'SEV1']) {
    const state = evaluateOperationalState(config(), [incident({ severity })]);
    assert.equal(state.effectiveMode, 'INCIDENT_LOCKDOWN');
    assert.equal(state.shadowJobsAllowed, false);
  }
});

test('incident triage never resolves or communicates automatically', () => {
  const result = triageIncident(incident({ severity: 'SEV0' }));
  assert.equal(result.lockdownRequired, true);
  assert.equal(result.automaticResolutionAllowed, false);
  assert.equal(result.communicationDraftOnly, true);
  assert.equal(result.responseTargetMinutes, 5);
});

test('incident scope mismatch is rejected', () => {
  assert.throws(() => evaluateOperationalState(config(), [incident({ tenantId: 'other_tenant' })]), /scope mismatch/);
});

test('lockdown release requires explicit human approval and remains paused', () => {
  const locked = config({ mode: 'INCIDENT_LOCKDOWN', globalKillSwitch: true });
  assert.throws(() => releaseIncidentLockdown(locked, {
    approvedByHuman: false,
    approvedAt: '2026-07-11T10:00:00.000Z',
    evidenceRef: 'evidence://release/1'
  }), /explicit human approval/);
  const released = releaseIncidentLockdown(locked, {
    approvedByHuman: true,
    approvedAt: '2026-07-11T10:00:00.000Z',
    evidenceRef: 'evidence://release/1'
  });
  assert.equal(released.mode, 'PAUSED');
  assert.equal(released.globalKillSwitch, true);
  assert.equal(released.automaticLockdownReleaseAllowed, false);
});

test('backup manifest is sorted, deterministic and hash-verifiable', () => {
  const first = manifest();
  const second = manifest();
  assert.deepEqual(first, second);
  assert.deepEqual(first.artifacts.map((item) => item.path), ['diagnostics.json', 'events.ndjson', 'projections.json']);
  assert.equal(verifyBackupManifest(first).valid, true);
});

test('tampered backup manifest is rejected', () => {
  const value = structuredClone(manifest());
  value.artifacts[0].sizeBytes += 1;
  assert.throws(() => verifyBackupManifest(value), /(totalSizeBytes|hash mismatch)/i);
});

test('duplicate backup paths are rejected', () => {
  const duplicated = artifacts();
  duplicated.push({ ...duplicated[0] });
  assert.throws(() => buildBackupManifest({
    backupId: 'backup_duplicate', tenantId: 'tenant_demo', projectId: 'comic_factory',
    createdAt: '2026-07-11T10:00:00.000Z', sourceCommit: 'abc', artifacts: duplicated
  }), /Duplicate backup artifact path/);
});

test('restore plan is dry-run only and follows verified manifest order', () => {
  const plan = buildRestorePlan(manifest(), {
    restoreId: 'restore_1',
    requestedAt: '2026-07-11T10:05:00.000Z',
    rollbackPointRef: 'rollback://before-restore-1'
  });
  assert.equal(plan.mode, 'DRY_RUN_ONLY');
  assert.equal(plan.realRestoreExecuted, false);
  assert.equal(plan.automaticExecutionAllowed, false);
  assert.deepEqual(plan.steps.map((step) => step.path), ['events.ndjson', 'projections.json']);
});

test('synthetic restore drill passes only in paused or lockdown state', () => {
  const plan = buildRestorePlan(manifest(), {
    restoreId: 'restore_1', requestedAt: '2026-07-11T10:05:00.000Z', rollbackPointRef: 'rollback://1'
  });
  assert.throws(() => runSyntheticRestoreDrill({
    restorePlan: plan,
    providedArtifacts: artifacts(),
    operationalState: evaluateOperationalState(config())
  }), /requires PAUSED/);
  const result = runSyntheticRestoreDrill({
    restorePlan: plan,
    providedArtifacts: artifacts(),
    operationalState: evaluateOperationalState(config({ globalKillSwitch: true }))
  });
  assert.equal(result.status, 'PASS');
  assert.equal(result.realRestoreExecuted, false);
  assert.equal(result.remoteServicesTouched, false);
});

test('synthetic restore drill detects artifact hash mismatch', () => {
  const plan = buildRestorePlan(manifest(), {
    restoreId: 'restore_2', requestedAt: '2026-07-11T10:05:00.000Z', rollbackPointRef: 'rollback://2'
  });
  const provided = artifacts();
  provided[0] = { ...provided[0], sha256: sha256('tampered') };
  const result = runSyntheticRestoreDrill({
    restorePlan: plan,
    providedArtifacts: provided,
    operationalState: evaluateOperationalState(config({ globalKillSwitch: true }))
  });
  assert.equal(result.status, 'FAILED');
  assert.ok(result.results.some((item) => item.status === 'HASH_MISMATCH'));
});

test('retention decisions never delete automatically and legal hold never expires', () => {
  const expired = buildRetentionDecision({
    itemId: 'item_1', retentionClass: 'EPHEMERAL_7D', createdAt: '2026-07-01T00:00:00.000Z',
    asOf: '2026-07-11T00:00:00.000Z', policies
  });
  assert.equal(expired.status, 'REVIEW_FOR_DISPOSITION');
  assert.equal(expired.automaticDeletionExecuted, false);
  const legal = buildRetentionDecision({
    itemId: 'item_2', retentionClass: 'LEGAL_HOLD', createdAt: '2020-01-01T00:00:00.000Z',
    asOf: '2026-07-11T00:00:00.000Z', policies
  });
  assert.equal(legal.status, 'RETAIN');
  assert.equal(legal.expiresAt, null);
});

test('secret inventory rejects secret values and preserves names plus status only', () => {
  assert.throws(() => validateSecretInventory([{
    name: 'SUPABASE_SERVICE_ROLE', required: true, status: 'PRESENT', ownerRole: 'platform_owner', value: 'forbidden'
  }]), /forbidden field/);
  const inventory = validateSecretInventory([{
    name: 'SUPABASE_SERVICE_ROLE', required: true, status: 'MISSING_REQUIRED', ownerRole: 'platform_owner', lastRotatedAt: null
  }]);
  assert.equal(inventory[0].valueIncluded, false);
  assert.equal(JSON.stringify(inventory).includes('forbidden'), false);
});

test('missing required secrets and failed restore drill make readiness not ready', () => {
  const readiness = buildReadinessProjection({
    config: config({ globalKillSwitch: true }),
    incidents: [],
    secretInventory: [{ name: 'SOCIAL_OAUTH', required: true, status: 'MISSING_REQUIRED', ownerRole: 'platform_owner' }],
    lastVerifiedBackupAt: '2026-07-11T09:30:00.000Z',
    lastRestoreDrill: { status: 'FAILED' },
    asOf: '2026-07-11T10:00:00.000Z'
  });
  assert.equal(readiness.status, 'NOT_READY');
  assert.ok(readiness.blockers.includes('SECRET_MISSING_SOCIAL_OAUTH'));
  assert.ok(readiness.blockers.includes('LATEST_RESTORE_DRILL_FAILED'));
  assert.equal(readiness.recoveryObjectivesProvenInProduction, false);
});

test('audit anchor manifest is deterministic and never claims an external anchor', () => {
  const input = {
    tenantId: 'tenant_demo', projectId: 'comic_factory', createdAt: '2026-07-11T10:00:00.000Z',
    sourceCommit: '73e5393f23b118112594e4e3be330a63da3e5747',
    eventHashes: [sha256('event-b'), sha256('event-a'), sha256('event-a')]
  };
  const first = buildAuditAnchorManifest(input);
  const second = buildAuditAnchorManifest(input);
  assert.deepEqual(first, second);
  assert.equal(first.eventCount, 2);
  assert.equal(first.externalAnchorExecuted, false);
  assert.equal(first.externalAnchorProvider, 'NOT_CONFIGURED');
  assert.match(first.rootHash, /^[a-f0-9]{64}$/);
});

test('non-shadow or public jobs are rejected by the operations gate', () => {
  const state = evaluateOperationalState(config());
  assert.throws(() => gateShadowJobs([shadowJob({ mode: 'live' })], state), OperationsValidationError);
  assert.throws(() => gateShadowJobs([shadowJob({ publicActionAllowed: true })], state), OperationsValidationError);
});
