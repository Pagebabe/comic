import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  diagnoseFailure,
  listRecoveryRules,
  renderRecoveryReportHtml,
  runSyntheticRecoveryDrills,
  validateRecoveryPlan
} from '../lib/operator-recovery.mjs';
import { inspectOperatorEnvironment } from '../scripts/operator_doctor.mjs';
import { runOperatorFailureDrill } from '../scripts/operator_failure_drill.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('contract defines thirteen known rules and one unknown fail-closed drill', async () => {
  const contract = await json('project/operator-recovery-contract.json');
  assert.equal(contract.trackingIssue, 118);
  assert.equal(contract.readinessGate, 'PR8');
  assert.equal(contract.knownFailureCodes.length, 13);
  assert.equal(contract.requiredDrills.total, 14);
  assert.equal(contract.unknownFailurePolicy.decision, 'HUMAN_ESCALATION_REQUIRED');
  assert.equal(contract.readinessEffect.pr8AfterAutomatedPass, 'PARTIAL');
  assert.equal(listRecoveryRules().length, 13);
});

test('known diagnosis is deterministic and hash-valid', () => {
  const first = diagnoseFailure({ code: 'HASH_MISMATCH', evidence: ['b', 'a'] });
  const second = diagnoseFailure({ code: 'hash_mismatch', evidence: ['a', 'b'] });
  assert.deepEqual(first, second);
  assert.equal(first.severity, 'SEV1');
  assert.equal(first.decision, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(validateRecoveryPlan(first), true);
});

test('unknown failures never receive commands or retries', () => {
  const diagnosis = diagnoseFailure({ code: 'unmapped catastrophe', evidence: ['trace.log'] });
  assert.equal(diagnosis.category, 'UNKNOWN');
  assert.equal(diagnosis.decision, 'HUMAN_ESCALATION_REQUIRED');
  assert.deepEqual(diagnosis.commands, []);
  assert.equal(diagnosis.retry, null);
  assert.equal(diagnosis.automaticActionAllowed, false);
  assert.equal(validateRecoveryPlan(diagnosis), true);
});

test('only the harmless free-port decision allows automatic retry', () => {
  const diagnosis = diagnoseFailure({ code: 'PREVIEW_PORT_IN_USE' });
  assert.equal(diagnosis.severity, 'SEV3');
  assert.equal(diagnosis.automaticActionAllowed, true);
  assert.equal(diagnosis.decision, 'SAFE_RETRY_ALLOWED');
  assert.equal(diagnosis.commands.length, 0);
  assert.equal(validateRecoveryPlan(diagnosis), true);
});

test('tampered plans and unsafe commands fail closed', () => {
  const valid = diagnoseFailure({ code: 'NPM_INSTALL_FAILED' });
  assert.throws(() => validateRecoveryPlan({ ...valid, title: 'changed' }), /RECOVERY_PLAN_HASH_MISMATCH/);
  assert.throws(() => validateRecoveryPlan({ ...valid, commands: ['rm -rf /'] }), /UNSAFE_RECOVERY_COMMAND/);
  const unknown = diagnoseFailure({ code: 'never-seen' });
  assert.throws(() => validateRecoveryPlan({ ...unknown, commands: ['npm run check'] }), /UNKNOWN_RECOVERY_MUST_NOT_EXECUTE|RECOVERY_PLAN_HASH_MISMATCH/);
});

test('synthetic recovery drills are deterministic and restore every sandbox', () => {
  const first = runSyntheticRecoveryDrills({ occurredAt: '2026-07-11T00:00:00.000Z' });
  const second = runSyntheticRecoveryDrills({ occurredAt: '2026-07-11T00:00:00.000Z' });
  assert.deepEqual(first, second);
  assert.equal(first.scenarioCount, 14);
  assert.equal(first.passed, 14);
  assert.ok(first.results.every((result) => result.sandboxRestored));
  assert.ok(first.results.every((result) => !result.externalActionExecuted));
  assert.ok(first.results.every((result) => !result.destructiveActionExecuted));
  assert.equal(first.boundaries.productionReady, false);
  assert.equal(first.boundaries.beginnerReady, false);
  assert.equal(first.boundaries.observedOperatorRecovery, false);
});

test('HTML report is static, escaped and network sealed', () => {
  const report = runSyntheticRecoveryDrills();
  const poisoned = {
    ...report,
    results: report.results.map((result, index) => index === 0
      ? { ...result, diagnosis: { ...result.diagnosis, title: '<script>alert(1)</script>' } }
      : result)
  };
  const html = renderRecoveryReportHtml(poisoned);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(html, /Production Ready: NEIN/);
});

test('operator doctor is read-only on the current repository', async () => {
  const report = await inspectOperatorEnvironment({ rootDirectory: new URL('../', import.meta.url).pathname });
  assert.equal(report.status, 'READY_FOR_SAFE_DRILLS');
  assert.equal(report.failures.length, 0);
  assert.equal(report.mutationPerformed, false);
  assert.equal(report.productionReady, false);
  assert.equal(report.creativeApprovalGranted, false);
});

test('offline drill writes matching JSON and HTML artifacts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'comic-recovery-proof-'));
  try {
    const result = await runOperatorFailureDrill({ outputDirectory: directory, occurredAt: '2026-07-11T00:00:00.000Z' });
    const written = JSON.parse(await readFile(result.jsonPath, 'utf8'));
    const html = await readFile(result.htmlPath, 'utf8');
    assert.deepEqual(written, result.report);
    assert.equal(written.passed, 14);
    assert.match(html, new RegExp(written.reportHash));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('readiness remains partial and creative boundaries stay closed', async () => {
  const readiness = await json('project/production-readiness-v1.json');
  const pr8 = readiness.gates.find((gate) => gate.id === 'PR8');
  assert.equal(pr8.status, 'PARTIAL');
  assert.ok(pr8.missingProof.includes('operator recovery observation'));
  assert.equal(readiness.academyBoundary.productionReady, false);
  assert.equal(readiness.academyBoundary.beginnerReady, false);
  assert.equal(readiness.academyBoundary.creativeApprovalGranted, false);
  assert.equal(readiness.academyBoundary.imageGenerationAllowed, false);
  assert.equal(readiness.academyBoundary.growthOsIntegrated, false);
});
