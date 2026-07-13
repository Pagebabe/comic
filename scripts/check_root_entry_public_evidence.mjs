import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const dir = resolve(value('--dir', '/tmp/public-proof'));
const expected = value('--expect-commit', process.env.GITHUB_SHA || '');
const fail = (code, detail = '') => {
  throw new Error(`[ROOT_ENTRY_PUBLIC:${code}]${detail ? ` ${detail}` : ''}`);
};
const ok = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
async function required(relativePath) {
  const file = resolve(dir, relativePath);
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
  'root-entry-v1.json',
  'root-entry-runtime-evidence.json',
  'root-entry-desktop.png',
  'root-entry-mobile.png',
  'live-root/root-entry-runtime-evidence.json',
  'live-root/root-entry-desktop.png',
  'live-root/root-entry-mobile.png',
]) {
  await required(file);
}
const [contract, deployed, live] = await Promise.all([
  json('root-entry-v1.json'),
  json('root-entry-runtime-evidence.json'),
  json('live-root/root-entry-runtime-evidence.json'),
]);

ok(Boolean(expected), 'EXPECTED_COMMIT');
ok(contract.status === 'ROOT_ENTRY_READY_FOR_PROOF', 'STATUS');
ok(contract.primaryAction.href === './studio/#cockpit', 'PRIMARY');
ok(contract.legacyAudit.route === '/audit.html', 'AUDIT');
ok(contract.currentState.activeReviewIssue === 153, 'ACTIVE_REVIEW');
ok(contract.currentState.localExecutionIssue === 155, 'LOCAL_TASK');
ok(Object.values(contract.boundaries).every((entry) => entry === false), 'BOUNDARIES');

for (const [label, proof] of [['deployed', deployed], ['live', live]]) {
  ok(proof.status === 'pass', 'PROOF_STATUS', label);
  ok(proof.commit === expected, 'PROOF_COMMIT', label);
  ok(proof.primaryAction === './studio/#cockpit', 'PROOF_PRIMARY', label);
  ok(proof.auditRoute === './audit.html', 'PROOF_AUDIT', label);
  ok(proof.activeReviewIssue === 153 && proof.localExecutionIssue === 155, 'PROOF_LINE', label);
  ok(proof.entryCards === 4 && proof.stateCards === 5 && proof.boundaries === 4, 'COUNTS', label);
  ok(
    proof.externalRequests === 0
      && proof.scriptCount === 0
      && proof.buttonCount === 0
      && proof.imageCount === 0
      && proof.canvasCount === 0
      && proof.iframeCount === 0,
    'SURFACE',
    label,
  );
  ok(
    proof.riccoCandidates === 0
      && !proof.productionReady
      && !proof.beginnerReady
      && !proof.imageGenerationAllowed
      && !proof.growthOsIntegrated,
    'STATE',
    label,
  );
  ok(proof.targets.length === 2, 'TARGETS', label);
  for (const target of proof.targets) {
    ok(target.checks.primaryHref === './studio/#cockpit', 'VISIBLE_PRIMARY', `${label}:${target.name}`);
    ok(target.checks.activeReviewPresent, 'VISIBLE_REVIEW', `${label}:${target.name}`);
    ok(!target.checks.staleLr1Copy, 'STALE', `${label}:${target.name}`);
    ok(target.checks.overflow <= 2, 'OVERFLOW', `${label}:${target.name}`);
  }
}
for (const target of deployed.targets) {
  ok(await sha(`root-entry-${target.name}.png`) === target.sha256, 'DEPLOYED_HASH', target.name);
}
for (const target of live.targets) {
  ok(await sha(`live-root/root-entry-${target.name}.png`) === target.sha256, 'LIVE_HASH', target.name);
}
ok(
  deployed.primaryAction === live.primaryAction
    && deployed.auditRoute === live.auditRoute
    && deployed.activeReviewIssue === live.activeReviewIssue
    && deployed.localExecutionIssue === live.localExecutionIssue
    && deployed.riccoCandidates === live.riccoCandidates,
  'SEMANTIC_DRIFT',
);
console.log(JSON.stringify({
  status: 'pass',
  expectedCommit: expected,
  route: '/',
  primaryAction: './studio/#cockpit',
  auditRoute: './audit.html',
  activeReviewIssue: 153,
  localExecutionIssue: 155,
  semanticStateMatched: true,
  productionReady: false,
  beginnerReady: false,
}, null, 2));
