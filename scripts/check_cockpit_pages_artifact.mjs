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
const fail = (code, detail = '') => { throw new Error(`[COCKPIT_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`); };
const ok = (condition, code, detail = '') => { if (!condition) fail(code, detail); };
async function req(file) { const target = resolve(site, file); try { await access(target); } catch { fail('MISSING', file); } return target; }
async function json(file) { return JSON.parse(await readFile(await req(file), 'utf8')); }
async function sha(file) { return createHash('sha256').update(await readFile(await req(file))).digest('hex'); }

for (const file of [
  'project/production-cockpit-v1.json',
  'project/active-line.json',
  'proof/cockpit/production-cockpit-runtime-evidence.json',
  'proof/cockpit/production-cockpit-desktop.png',
  'proof/cockpit/production-cockpit-mobile.png'
]) await req(file);

const [contract, line, proof] = await Promise.all([
  json('project/production-cockpit-v1.json'),
  json('project/active-line.json'),
  json('proof/cockpit/production-cockpit-runtime-evidence.json')
]);

ok(Boolean(expected), 'EXPECTED_COMMIT');
ok(contract.status === 'WORKING_COCKPIT_V1', 'STATUS');
ok(contract.route === '/studio/#cockpit', 'ROUTE');
ok(contract.trackingIssue === 117, 'TRACKING_ISSUE');
ok(contract.activeGate?.id === 'P1-RICCO-001' && contract.activeGate?.trackingIssue === 153, 'ACTIVE_GATE');
ok(contract.nextAllowedStep?.decision === 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED', 'DECISION');
ok(contract.sections?.length === 6, 'SECTIONS');
ok(contract.sections?.filter((entry) => entry.status === 'ACTIVE_REVIEW_GATE').length === 1, 'ACTIVE_SECTION_COUNT');
ok(contract.sections?.find((entry) => entry.id === 'review')?.status === 'ACTIVE_REVIEW_GATE', 'ACTIVE_SECTION');
ok(Object.values(contract.boundaries || {}).every((entry) => entry === false), 'BOUNDARIES');
ok(contract.counts?.characterMastersApproved === 0 && contract.counts?.locationMastersApproved === 0 && contract.counts?.voiceMastersApproved === 0 && contract.counts?.riccoCandidates === 0 && contract.counts?.reviewedEpisodes === 0, 'FALSE_PROGRESS');

ok(line.authority === 'current_operational_line', 'LINE_AUTHORITY');
ok(line.parentGate?.trackingIssue === 82, 'LINE_PARENT');
ok(line.strategicContract?.trackingIssue === 88, 'LINE_STRATEGIC');
ok(line.completedAssetScan?.trackingIssue === 123, 'LINE_SCAN');
ok(line.activeReviewGate?.trackingIssue === 153, 'LINE_REVIEW');
ok(line.executionTask?.trackingIssue === 155 && line.executionTask?.toolingPullRequest === 154, 'LINE_EXECUTION');

ok(proof.schemaVersion === 2, 'PROOF_SCHEMA');
ok(proof.status === 'pass', 'PROOF_STATUS');
ok(proof.commit === expected, 'PROOF_COMMIT', `${proof.commit} != ${expected}`);
ok(proof.route.endsWith('/studio/#cockpit'), 'PROOF_ROUTE');
ok(proof.trackingIssue === 117, 'PROOF_TRACKING');
ok(proof.activeParentGate === 'LR5' && proof.activeParentTrackingIssue === 82, 'PROOF_PARENT');
ok(proof.strategicContract === 'LR5.1' && proof.strategicContractTrackingIssue === 88, 'PROOF_STRATEGIC');
ok(proof.completedAssetScan === 123 && proof.activeReviewGate === 153 && proof.localExecutionTask === 155 && proof.toolingPullRequest === 154, 'PROOF_OPERATIONAL');
ok(proof.nextDecision === 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED', 'PROOF_DECISION');
ok(proof.workspaceCount === 6 && proof.activeWorkspace === 'review', 'PROOF_WORKSPACES');
ok(proof.executableButtons === 0 && proof.externalRequests === 0 && proof.imageCount === 0 && proof.canvasCount === 0 && proof.iframeCount === 0, 'PROOF_SURFACE');
ok(proof.riccoCandidates === 0, 'PROOF_CANDIDATE');
for (const field of ['imageGenerationAllowed', 'creativeApprovalGranted', 'productionReady', 'beginnerReady', 'growthOsIntegrated']) ok(proof[field] === false, `PROOF_${field}`);
ok(proof.targets?.length === 2, 'TARGETS');

for (const target of proof.targets) {
  ok(target.checks?.metrics === 5, 'VISIBLE_METRICS', target.name);
  ok(target.checks?.workspaces === 6, 'VISIBLE_WORKSPACES', target.name);
  ok(target.checks?.activeWorkspaces === 1 && target.checks?.activeWorkspaceId === 'review', 'VISIBLE_ACTIVE', target.name);
  ok(target.checks?.boundaries === 6, 'VISIBLE_BOUNDARIES', target.name);
  ok(target.checks?.parentGateVisible && target.checks?.strategicContractVisible && target.checks?.scanVisible && target.checks?.activeReviewVisible, 'VISIBLE_LINE', target.name);
  ok(target.checks?.buttons === 0 && target.checks?.images === 0 && target.checks?.canvas === 0 && target.checks?.iframe === 0, 'VISIBLE_SURFACE', target.name);
  ok(target.checks?.overflow <= 2, 'OVERFLOW', target.name);
  ok(Boolean(target.sha256), 'HASH_MISSING', target.name);
  const actual = await sha(`proof/cockpit/production-cockpit-${target.name}.png`);
  ok(actual === target.sha256, 'HASH_MISMATCH', target.name);
}

console.log(JSON.stringify({
  status: 'pass',
  expectedCommit: expected,
  route: contract.route,
  workspaces: 6,
  activeWorkspace: 'review',
  currentTask: contract.currentTask.title,
  nextDecision: contract.nextAllowedStep.decision,
  activeReviewGate: 153,
  localExecutionTask: 155,
  riccoCandidates: 0,
  productionReady: false,
  beginnerReady: false,
  creativeApprovalGranted: false,
  targets: 2
}, null, 2));
