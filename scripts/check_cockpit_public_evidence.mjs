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
  'active-line.json',
  'cockpit-runtime-evidence.json',
  'cockpit-desktop.png',
  'cockpit-mobile.png',
  'live-cockpit/production-cockpit-runtime-evidence.json',
  'live-cockpit/production-cockpit-desktop.png',
  'live-cockpit/production-cockpit-mobile.png'
]) await req(file);

const [contract, line, deployed, live] = await Promise.all([
  json('production-cockpit-v1.json'),
  json('active-line.json'),
  json('cockpit-runtime-evidence.json'),
  json('live-cockpit/production-cockpit-runtime-evidence.json')
]);

ok(Boolean(expected), 'EXPECTED_COMMIT');
ok(contract.status === 'WORKING_COCKPIT_V1', 'STATUS');
ok(contract.route === '/studio/#cockpit', 'ROUTE');
ok(contract.trackingIssue === 117, 'TRACKING_ISSUE');
ok(contract.activeGate?.id === 'P1-RICCO-001' && contract.activeGate?.trackingIssue === 153, 'ACTIVE_GATE');
ok(contract.nextAllowedStep?.decision === 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED', 'DECISION');
ok(contract.sections?.length === 6, 'SECTIONS');
ok(contract.sections?.find((entry) => entry.id === 'review')?.status === 'ACTIVE_REVIEW_GATE', 'ACTIVE_SECTION');
ok(Object.values(contract.boundaries || {}).every((entry) => entry === false), 'BOUNDARIES');

ok(line.authority === 'current_operational_line', 'LINE_AUTHORITY');
ok(line.parentGate?.trackingIssue === 82, 'LINE_PARENT');
ok(line.strategicContract?.trackingIssue === 88, 'LINE_STRATEGIC');
ok(line.completedAssetScan?.trackingIssue === 123, 'LINE_SCAN');
ok(line.activeReviewGate?.trackingIssue === 153, 'LINE_REVIEW');
ok(line.executionTask?.trackingIssue === 155 && line.executionTask?.toolingPullRequest === 154, 'LINE_EXECUTION');

for (const [label, proof] of [['deployed', deployed], ['live', live]]) {
  ok(proof.schemaVersion === 2, 'PROOF_SCHEMA', label);
  ok(proof.status === 'pass', 'PROOF_STATUS', label);
  ok(proof.commit === expected, 'PROOF_COMMIT', `${label}:${proof.commit}`);
  ok(proof.route.endsWith('/studio/#cockpit'), 'PROOF_ROUTE', label);
  ok(proof.trackingIssue === 117, 'PROOF_TRACKING', label);
  ok(proof.activeParentGate === 'LR5' && proof.activeParentTrackingIssue === 82, 'PROOF_PARENT', label);
  ok(proof.strategicContract === 'LR5.1' && proof.strategicContractTrackingIssue === 88, 'PROOF_STRATEGIC', label);
  ok(proof.completedAssetScan === 123 && proof.activeReviewGate === 153 && proof.localExecutionTask === 155 && proof.toolingPullRequest === 154, 'PROOF_OPERATIONAL', label);
  ok(proof.nextDecision === 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED', 'PROOF_DECISION', label);
  ok(proof.workspaceCount === 6 && proof.activeWorkspace === 'review', 'PROOF_WORKSPACES', label);
  ok(proof.executableButtons === 0 && proof.externalRequests === 0 && proof.imageCount === 0 && proof.canvasCount === 0 && proof.iframeCount === 0, 'PROOF_SURFACE', label);
  ok(proof.riccoCandidates === 0, 'PROOF_CANDIDATE', label);
  for (const field of ['imageGenerationAllowed', 'creativeApprovalGranted', 'productionReady', 'beginnerReady', 'growthOsIntegrated']) ok(proof[field] === false, `${label}_${field}`);
  ok(proof.targets?.length === 2, 'TARGETS', label);
  for (const target of proof.targets) {
    ok(target.checks?.metrics === 5, 'VISIBLE_METRICS', `${label}:${target.name}`);
    ok(target.checks?.workspaces === 6, 'VISIBLE_WORKSPACES', `${label}:${target.name}`);
    ok(target.checks?.activeWorkspaces === 1 && target.checks?.activeWorkspaceId === 'review', 'VISIBLE_ACTIVE', `${label}:${target.name}`);
    ok(target.checks?.boundaries === 6, 'VISIBLE_BOUNDARIES', `${label}:${target.name}`);
    ok(target.checks?.parentGateVisible && target.checks?.strategicContractVisible && target.checks?.scanVisible && target.checks?.activeReviewVisible, 'VISIBLE_LINE', `${label}:${target.name}`);
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
ok(deployed.activeWorkspace === live.activeWorkspace, 'ACTIVE_WORKSPACE_DRIFT');
ok(deployed.activeReviewGate === live.activeReviewGate, 'REVIEW_GATE_DRIFT');
ok(deployed.localExecutionTask === live.localExecutionTask, 'EXECUTION_TASK_DRIFT');
ok(deployed.riccoCandidates === live.riccoCandidates, 'CANDIDATE_DRIFT');

console.log(JSON.stringify({
  status: 'pass',
  expectedCommit: expected,
  route: contract.route,
  workspaces: 6,
  activeWorkspace: 'review',
  nextDecision: contract.nextAllowedStep.decision,
  activeReviewGate: 153,
  localExecutionTask: 155,
  riccoCandidates: 0,
  productionReady: false,
  beginnerReady: false,
  creativeApprovalGranted: false,
  deployedHashes,
  liveHashes,
  semanticStateMatched: true
}, null, 2));
