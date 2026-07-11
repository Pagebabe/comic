import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  assertReadOnlyReleaseHtml,
  buildActivationChecklist,
  buildDeploymentReadiness,
  buildPersistenceReadiness,
  buildReleaseManifest,
  buildTraceGraph,
  evaluateFailureScenario,
  renderReleaseHtml,
  stableHash,
  verifyReleaseManifest
} from './release.mjs';

const moduleIds = Array.from({ length: 9 }, (_, index) => `MKT0-${String(index + 1).padStart(3, '0')}`);
const evidencePaths = moduleIds.map((moduleId) => `growth-os/evidence/${moduleId}.md`);
const artifactContents = {};
for (const path of evidencePaths) {
  if (!existsSync(path)) throw new Error(`Missing evidence packet: ${path}`);
  artifactContents[path] = readFileSync(path, 'utf8');
}

const ruleVersions = {
  'MKT0-001': 'mkt0-001.v1',
  'MKT0-002': 'mkt0-002.v1',
  'MKT0-003': 'mkt0-003.v1',
  'MKT0-004': 'mkt0-004.v1',
  'MKT0-005': 'mkt0-005.v1',
  'MKT0-006': 'mkt0-006.v1',
  'MKT0-007': 'mkt0-007.v1',
  'MKT0-008': 'mkt0-008.v1',
  'MKT0-009': 'mkt0-009.full.v1'
};

const modules = moduleIds.map((moduleId, index) => ({
  moduleId,
  ruleVersion: ruleVersions[moduleId],
  state: 'PROVEN',
  ciRunId: 'repository-evidence',
  claims: ['offline-shadow-proof', 'no-live-actions'],
  artifacts: [{ path: evidencePaths[index], sha256: stableHash(artifactContents[evidencePaths[index]]) }]
}));

const manifest = buildReleaseManifest({
  schemaVersion: 1,
  releaseId: 'mkt0-shadow-release-1.0.0-rc1',
  generatedAt: '2026-07-11T13:45:00.000Z',
  correlationId: 'corr-mkt0-final-release-rc1',
  modules
});
const verification = verifyReleaseManifest(manifest, artifactContents);
const trace = buildTraceGraph({
  correlationId: manifest.correlationId,
  steps: moduleIds.map((moduleId, index) => ({
    stepId: `release-step-${index + 1}`,
    moduleId,
    causationId: index === 0 ? null : `release-step-${index}`,
    state: 'PASS',
    evidenceRef: evidencePaths[index]
  }))
});

const sqlPath = 'growth-os/sql/001_growth_os_foundation.sql';
if (!existsSync(sqlPath)) throw new Error(`Missing persistence contract: ${sqlPath}`);
const persistence = buildPersistenceReadiness(readFileSync(sqlPath, 'utf8'));
const readiness = buildDeploymentReadiness({ manifest, persistence });
const activationChecklist = buildActivationChecklist(readiness);
const failures = ['KILL_SWITCH', 'AUTH_NOT_READY', 'RATE_LIMIT', 'WEBHOOK_REPLAY', 'MANIFEST_TAMPER', 'INSUFFICIENT_METRICS', 'RLS_FAILURE', 'RESTORE_FAILURE'].map((type) => evaluateFailureScenario({ type }));

if (manifest.releaseState !== 'SHADOW_RELEASE_READY') throw new Error(`Unexpected release state: ${manifest.releaseState}`);
if (persistence.state !== 'PROVEN_LOCAL_CONTRACT') throw new Error(`Persistence contract not proven: ${persistence.failed.join(',')}`);
if (readiness.shadowReleaseReady !== true) throw new Error('Shadow release is not ready');
if (readiness.liveReady !== false) throw new Error('Release incorrectly claims live readiness');
if (activationChecklist.liveActivationAllowed !== false) throw new Error('Activation checklist incorrectly allows live activation');
if (failures.some((failure) => !failure.outcome.startsWith('SAFE_'))) throw new Error('Unsafe failure outcome detected');

const report = Object.freeze({
  schemaVersion: 1,
  ruleVersion: 'mkt0-010.v1',
  provenance: 'repository_evidence_and_synthetic_contracts_only',
  manifest,
  verification,
  trace,
  persistence,
  readiness,
  activationChecklist,
  failures,
  releaseDecision: 'SHADOW_RELEASE_READY',
  liveDecision: 'BLOCKED',
  nonClaims: Object.freeze([
    'no productive database runtime',
    'no OAuth connection',
    'no provider app approval',
    'no productive workers or scheduler',
    'no remote backup or real restore drill',
    'no live publishing or public community action',
    'no merge into main'
  ]),
  networkUsed: false,
  oauthConnected: false,
  liveActionsExecuted: false,
  productionReady: false
});

const html = renderReleaseHtml(report);
assertReadOnlyReleaseHtml(html);
mkdirSync('output/growth-os', { recursive: true });
writeFileSync('output/growth-os/mkt0-final-release.json', `${JSON.stringify(report, null, 2)}\n`);
writeFileSync('output/growth-os/mkt0-final-release.html', html);
console.log(JSON.stringify({
  status: 'pass',
  ruleVersion: report.ruleVersion,
  modules: report.manifest.modules.length,
  evidenceArtifacts: report.verification.artifactCount,
  persistenceChecks: report.persistence.checks.length,
  shadowReleaseReady: report.readiness.shadowReleaseReady,
  liveReady: report.readiness.liveReady,
  blockedGates: report.readiness.blockedGateCount,
  failureScenarios: report.failures.length,
  networkUsed: report.networkUsed,
  liveActionsExecuted: report.liveActionsExecuted
}));
