import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const site = resolve(value('--site', '_site'));
const expected = value('--expect-commit', process.env.GITHUB_SHA || '');
const fail = (code, detail = '') => {
  throw new Error(`[ROOT_ENTRY_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`);
};
const ok = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
async function required(relativePath) {
  const file = resolve(site, relativePath);
  try {
    await access(file);
  } catch {
    fail('MISSING', relativePath);
  }
  return file;
}
async function json(relativePath) {
  return JSON.parse(await readFile(await required(relativePath), 'utf8'));
}
async function sha(relativePath) {
  return createHash('sha256').update(await readFile(await required(relativePath))).digest('hex');
}

for (const file of [
  'index.html',
  'audit.html',
  'gateway.css',
  'project/root-entry-v1.json',
  'proof/root-entry/root-entry-runtime-evidence.json',
  'proof/root-entry/root-entry-desktop.png',
  'proof/root-entry/root-entry-mobile.png',
]) {
  await required(file);
}
const [contract, proof] = await Promise.all([
  json('project/root-entry-v1.json'),
  json('proof/root-entry/root-entry-runtime-evidence.json'),
]);

ok(Boolean(expected), 'EXPECTED_COMMIT');
ok(contract.status === 'ROOT_ENTRY_READY_FOR_PROOF', 'STATUS');
ok(contract.primaryAction.href === './studio/#cockpit', 'PRIMARY');
ok(contract.legacyAudit.preserved && contract.legacyAudit.route === '/audit.html', 'AUDIT');
ok(contract.currentState.activeReviewIssue === 153, 'ACTIVE_REVIEW');
ok(contract.currentState.localExecutionIssue === 155, 'LOCAL_TASK');
ok(contract.currentState.activeWorkspace === 'review', 'WORKSPACE');
ok(contract.currentState.riccoCandidates === 0, 'CANDIDATE');
ok(!contract.currentState.productionReady && !contract.currentState.beginnerReady, 'READINESS');
ok(Object.values(contract.boundaries).every((entry) => entry === false), 'BOUNDARIES');
ok(proof.status === 'pass', 'PROOF_STATUS');
ok(proof.commit === expected, 'PROOF_COMMIT');
ok(proof.primaryAction === './studio/#cockpit', 'PROOF_PRIMARY');
ok(proof.auditRoute === './audit.html', 'PROOF_AUDIT');
ok(proof.activeReviewIssue === 153 && proof.localExecutionIssue === 155, 'PROOF_LINE');
ok(proof.targets.length === 2, 'TARGETS');
for (const target of proof.targets) {
  ok(target.checks.entryCards === 4, 'CARDS', target.name);
  ok(target.checks.stateCards === 5, 'STATE', target.name);
  ok(target.checks.boundaries === 4, 'BOUNDARIES_VISIBLE', target.name);
  ok(target.checks.activeReviewPresent, 'ACTIVE_REVIEW_VISIBLE', target.name);
  ok(!target.checks.staleLr1Copy, 'STALE', target.name);
  ok(target.checks.overflow <= 2, 'OVERFLOW', target.name);
  ok(Boolean(target.sha256), 'HASH', target.name);
  ok(
    await sha(`proof/root-entry/root-entry-${target.name}.png`) === target.sha256,
    'HASH_MATCH',
    target.name,
  );
}
console.log(JSON.stringify({
  status: 'pass',
  expectedCommit: expected,
  route: '/',
  primaryAction: './studio/#cockpit',
  auditRoute: './audit.html',
  activeReviewIssue: 153,
  localExecutionIssue: 155,
  targets: 2,
  productionReady: false,
  beginnerReady: false,
}, null, 2));
