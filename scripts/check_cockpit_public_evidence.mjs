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
const fail = (code, detail = '') => { throw new Error(`[COCKPIT_PUBLIC:${code}]${detail ? ` ${detail}` : ''}`); };
const ok = (condition, code, detail = '') => { if (!condition) fail(code, detail); };
async function req(file) { const target = resolve(dir, file); try { await access(target); } catch { fail('MISSING', file); } return target; }
async function json(file) { return JSON.parse(await readFile(await req(file), 'utf8')); }
async function sha(file) { return createHash('sha256').update(await readFile(await req(file))).digest('hex'); }

for (const file of [
  'production-cockpit-v1.json',
  'cockpit-runtime-evidence.json',
  'cockpit-desktop.png',
  'cockpit-mobile.png',
  'live-cockpit/production-cockpit-runtime-evidence.json',
  'live-cockpit/production-cockpit-desktop.png',
  'live-cockpit/production-cockpit-mobile.png'
]) await req(file);

const [contract, deployed, live] = await Promise.all([
  json('production-cockpit-v1.json'),
  json('cockpit-runtime-evidence.json'),
  json('live-cockpit/production-cockpit-runtime-evidence.json')
]);

ok(Boolean(expected), 'EXPECTED_COMMIT');
ok(contract.status === 'WORKING_COCKPIT_V1', 'STATUS');
ok(contract.route === '/studio/#cockpit', 'ROUTE');
ok(contract.trackingIssue === 117, 'TRACKING_ISSUE');
ok(contract.activeGate?.id === 'LR5.1' && contract.activeGate?.trackingIssue === 88, 'ACTIVE_GATE');
ok(contract.nextAllowedStep?.decision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'DECISION');
ok(contract.sections?.length === 6, 'SECTIONS');
ok(Object.values(contract.boundaries || {}).every((entry) => entry === false), 'BOUNDARIES');

for (const [label, proof] of [['deployed', deployed], ['live', live]]) {
  ok(proof.status === 'pass', 'PROOF_STATUS', label);
  ok(proof.commit === expected, 'PROOF_COMMIT', `${label}:${proof.commit}`);
  ok(proof.route.endsWith('/studio/#cockpit'), 'PROOF_ROUTE', label);
  ok(proof.trackingIssue === 117, 'PROOF_TRACKING', label);
  ok(proof.activeGate === 'LR5.1' && proof.activeWorkPackage === 88, 'PROOF_GATE', label);
  ok(proof.nextDecision === 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'PROOF_DECISION', label);
  ok(proof.workspaceCount === 6, 'PROOF_WORKSPACES', label);
  ok(proof.executableButtons === 0 && proof.externalRequests === 0 && proof.imageCount === 0 && proof.canvasCount === 0 && proof.iframeCount === 0, 'PROOF_SURFACE', label);
  ok(proof.riccoCandidates === 0, 'PROOF_CANDIDATE', label);
  for (const field of ['imageGenerationAllowed', 'creativeApprovalGranted', 'productionReady', 'beginnerReady', 'growthOsIntegrated']) ok(proof[field] === false, `${label}_${field}`);
  ok(proof.targets?.length === 2, 'TARGETS', label);
  for (const target of proof.targets) {
    ok(target.checks?.metrics === 5, 'VISIBLE_METRICS', `${label}:${target.name}`);
    ok(target.checks?.workspaces === 6, 'VISIBLE_WORKSPACES', `${label}:${target.name}`);
    ok(target.checks?.activeWorkspaces === 1, 'VISIBLE_ACTIVE', `${label}:${target.name}`);
    ok(target.checks?.boundaries === 6, 'VISIBLE_BOUNDARIES', `${label}:${target.name}`);
    ok(target.checks?.buttons === 0 && target.checks?.images === 0 && target.checks?.canvas === 0 && target.checks?.iframe === 0, 'VISIBLE_SURFACE', `${label}:${target.name}`);
    ok(target.checks?.overflow <= 2, 'OVERFLOW', `${label}:${target.name}`);
    ok(Boolean(target.sha256), 'HASH_MISSING', `${label}:${target.name}`);
  }
}

const deployedHashes = {};
const liveHashes = {};
for (const target of deployed.targets) {
  const actual = await sha(`cockpit-${target.name}.png`);
  ok(actual === target.sha256, 'DEPLOYED_HASH', target.name);
  deployedHashes[target.name] = actual;
}
for (const target of live.targets) {
  const actual = await sha(`live-cockpit/production-cockpit-${target.name}.png`);
  ok(actual === target.sha256, 'LIVE_HASH', target.name);
  liveHashes[target.name] = actual;
}

ok(deployed.currentTask === live.currentTask, 'CURRENT_TASK_DRIFT');
ok(deployed.nextDecision === live.nextDecision, 'NEXT_DECISION_DRIFT');
ok(deployed.workspaceCount === live.workspaceCount, 'WORKSPACE_DRIFT');
ok(deployed.riccoCandidates === live.riccoCandidates, 'CANDIDATE_DRIFT');

console.log(JSON.stringify({
  status: 'pass',
  expectedCommit: expected,
  route: contract.route,
  workspaces: 6,
  nextDecision: contract.nextAllowedStep.decision,
  riccoCandidates: 0,
  productionReady: false,
  beginnerReady: false,
  creativeApprovalGranted: false,
  deployedHashes,
  liveHashes,
  semanticStateMatched: true
}, null, 2));
