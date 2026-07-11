import { mkdirSync, writeFileSync } from 'node:fs';
import {
  buildAuditAnchorManifest,
  buildBackupManifest,
  buildReadinessProjection,
  buildRestorePlan,
  buildRetentionDecision,
  evaluateOperationalState,
  gateShadowJobs,
  runSyntheticRestoreDrill,
  sha256,
  triageIncident,
  verifyBackupManifest
} from './operations.mjs';

const retentionPolicies = [
  { retentionClass: 'EPHEMERAL_7D', days: 7, deletionMode: 'EXPIRE_METADATA_ONLY', humanApprovalRequired: false },
  { retentionClass: 'OPERATIONAL_30D', days: 30, deletionMode: 'DELETE_AFTER_VERIFIED_BACKUP', humanApprovalRequired: true },
  { retentionClass: 'AUDIT_365D', days: 365, deletionMode: 'MANUAL_REVIEW', humanApprovalRequired: true },
  { retentionClass: 'LEGAL_HOLD', deletionMode: 'NO_AUTOMATIC_DELETION', humanApprovalRequired: true }
];

const config = {
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
  retentionPolicies
};

const incident = {
  schemaVersion: 1,
  id: 'incident_synthetic_sev1',
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  severity: 'SEV1',
  category: 'DATA_INTEGRITY',
  status: 'OPEN',
  detectedAt: '2026-07-11T10:00:00.000Z',
  resolvedAt: null,
  summary: 'Synthetic integrity incident for offline drill',
  evidenceRefs: ['evidence://mkt0-007/synthetic-incident'],
  humanOwner: 'operations_lead'
};

const operationalState = evaluateOperationalState(config, [incident]);
const triage = triageIncident(incident);
const gatedJobs = gateShadowJobs([{
  id: 'shadow_job_synthetic',
  mode: 'shadow',
  state: 'APPROVED_SHADOW',
  publicActionAllowed: false
}], operationalState);

const backupArtifacts = [
  { path: 'events.ndjson', sha256: sha256('synthetic-events'), sizeBytes: 128, retentionClass: 'AUDIT_365D', requiredForRestore: true },
  { path: 'projections.json', sha256: sha256('synthetic-projections'), sizeBytes: 96, retentionClass: 'OPERATIONAL_30D', requiredForRestore: true },
  { path: 'diagnostics.json', sha256: sha256('synthetic-diagnostics'), sizeBytes: 32, retentionClass: 'EPHEMERAL_7D', requiredForRestore: false }
];

const backupManifest = buildBackupManifest({
  backupId: 'backup_synthetic_mkt0_007',
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  createdAt: '2026-07-11T10:05:00.000Z',
  sourceCommit: '73e5393f23b118112594e4e3be330a63da3e5747',
  artifacts: backupArtifacts
});
const backupVerification = verifyBackupManifest(backupManifest);
const restorePlan = buildRestorePlan(backupManifest, {
  restoreId: 'restore_synthetic_mkt0_007',
  requestedAt: '2026-07-11T10:06:00.000Z',
  rollbackPointRef: 'rollback://synthetic-before-restore'
});
const restoreDrill = runSyntheticRestoreDrill({
  restorePlan,
  providedArtifacts: backupArtifacts,
  operationalState
});
const retentionDecision = buildRetentionDecision({
  itemId: 'synthetic_diagnostic',
  retentionClass: 'EPHEMERAL_7D',
  createdAt: '2026-07-01T00:00:00.000Z',
  asOf: '2026-07-11T10:10:00.000Z',
  policies: retentionPolicies
});
const secretInventory = [
  { name: 'SUPABASE_SERVICE_ROLE', required: true, status: 'MISSING_REQUIRED', lastRotatedAt: null, ownerRole: 'platform_owner' },
  { name: 'SOCIAL_OAUTH', required: true, status: 'DISABLED', lastRotatedAt: null, ownerRole: 'platform_owner' }
];
const readiness = buildReadinessProjection({
  config,
  incidents: [incident],
  secretInventory,
  lastVerifiedBackupAt: backupManifest.createdAt,
  lastRestoreDrill: restoreDrill,
  asOf: '2026-07-11T10:10:00.000Z'
});
const auditAnchor = buildAuditAnchorManifest({
  tenantId: 'tenant_demo',
  projectId: 'comic_factory',
  createdAt: '2026-07-11T10:11:00.000Z',
  sourceCommit: '73e5393f23b118112594e4e3be330a63da3e5747',
  eventHashes: [sha256('synthetic-event-1'), sha256('synthetic-event-2')]
});

const output = {
  schemaVersion: 1,
  ruleVersion: 'mkt0-007.v1',
  provenance: 'synthetic_fixture',
  operationalState,
  triage,
  gatedJobs,
  backupManifest,
  backupVerification,
  restorePlan,
  restoreDrill,
  retentionDecision,
  secretInventory,
  readiness,
  auditAnchor,
  liveActionsExecuted: false,
  remoteBackupExecuted: false,
  realRestoreExecuted: false,
  externalAnchorExecuted: false,
  remoteServicesTouched: false
};

if (operationalState.effectiveMode !== 'INCIDENT_LOCKDOWN') throw new Error('Expected incident lockdown');
if (gatedJobs[0].operationsGate !== 'BLOCKED') throw new Error('Expected job block');
if (backupVerification.valid !== true) throw new Error('Expected valid backup manifest');
if (restoreDrill.status !== 'PASS') throw new Error('Expected passing synthetic restore drill');
if (readiness.status !== 'NOT_READY') throw new Error('Expected NOT_READY due incident and missing secret');
if (auditAnchor.externalAnchorExecuted !== false) throw new Error('External anchor must remain disabled');

mkdirSync('output/growth-os', { recursive: true });
writeFileSync('output/growth-os/mkt0-operations-readiness.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  status: 'pass',
  ruleVersion: output.ruleVersion,
  operatingMode: operationalState.effectiveMode,
  jobsBlocked: gatedJobs.filter((job) => job.operationsGate === 'BLOCKED').length,
  backupManifestValid: backupVerification.valid,
  restoreDrill: restoreDrill.status,
  readiness: readiness.status,
  liveActionsExecuted: output.liveActionsExecuted,
  remoteServicesTouched: output.remoteServicesTouched
}));
