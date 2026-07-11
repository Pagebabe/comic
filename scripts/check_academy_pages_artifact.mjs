import { createHash } from 'node:crypto';
import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const siteDir = resolve(valueAfter('--site', '_site'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') {
  throw new Error(`[ACADEMY_PAGES_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`);
}
function assert(condition, code, detail = '') {
  if (!condition) fail(code, detail);
}
async function requireFile(relativePath, minimumBytes = 1) {
  const path = resolve(siteDir, relativePath);
  try { await access(path); } catch { fail('MISSING_FILE', relativePath); }
  const info = await stat(path);
  assert(info.size >= minimumBytes, 'EMPTY_FILE', `${relativePath}: ${info.size}`);
  return path;
}
async function json(relativePath) {
  const path = await requireFile(relativePath);
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { fail('INVALID_JSON', `${relativePath}: ${error.message}`); }
}
async function sha256(relativePath) {
  return createHash('sha256').update(await readFile(await requireFile(relativePath))).digest('hex');
}

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT_MISSING');

for (const file of [
  'project/production-academy.json',
  'project/production-academy-status.json',
  'project/operator-readiness.json',
  'docs/PRODUCTION_HANDBOOK_DE.md',
  'docs/QUICKSTART_DAY_ONE.md',
  'docs/VIDEO_TUTORIAL_SCRIPT_DE.md',
  'docs/AUTOMATION_80_PERCENT_MODEL.md',
  'docs/PRODUCTION_ACADEMY_EVIDENCE.md',
  'docs/OPERATOR_READINESS_STATUS.md',
  'docs/NULLWISSEN_ACCEPTANCE_PROTOCOL_DE.md',
  'proof/studio/academy-runtime-evidence.json',
  'proof/studio/academy-desktop.png',
  'proof/studio/academy-mobile.png'
]) await requireFile(file, file.endsWith('.png') ? 10_000 : 100);

const [contract, status, readiness, runtime] = await Promise.all([
  json('project/production-academy.json'),
  json('project/production-academy-status.json'),
  json('project/operator-readiness.json'),
  json('proof/studio/academy-runtime-evidence.json')
]);

assert(contract.schemaVersion === 1, 'CONTRACT_SCHEMA');
assert(contract.trackingIssue === 94, 'CONTRACT_TRACKING');
assert(Array.isArray(contract.stages) && contract.stages.length === 12, 'CONTRACT_STAGE_COUNT');
assert(contract.stages[0]?.automaticApprovalAllowed === true, 'CONTRACT_FIRST_STAGE');
assert(contract.stages.slice(1).every((stage) => stage.automaticApprovalAllowed === false), 'CONTRACT_HUMAN_GATES');

assert(status.schemaVersion === 2, 'STATUS_SCHEMA', String(status.schemaVersion));
assert(status.status === 'publicly_proven_production_enablement_ready', 'STATUS_VALUE', status.status);
assert(status.trackingIssue === 94, 'STATUS_TRACKING');
assert(status.programIssue === 101, 'STATUS_PROGRAM');
assert(status.operatorIssue === 95, 'STATUS_OPERATOR');
assert(status.readinessIssue === 102, 'STATUS_READINESS');
assert(status.route === '/studio/#academy', 'STATUS_ROUTE', status.route);
assert(status.implemented?.guidedStages === 12, 'STATUS_STAGE_COUNT');
assert(status.implemented?.trainingMode === true, 'STATUS_TRAINING_MODE');
assert(status.implemented?.productionMode === true, 'STATUS_PRODUCTION_MODE');
assert(status.implemented?.publicLiveSmoke === true, 'STATUS_PUBLIC_LIVE_SMOKE');
assert(status.safety?.trainingGrantsProductionApproval === false, 'STATUS_TRAINING_BOUNDARY');
assert(status.safety?.humanGatesAutomaticallyApproved === false, 'STATUS_HUMAN_BOUNDARY');
assert(status.safety?.finalEpisodeAutomaticallyApproved === false, 'STATUS_EPISODE_BOUNDARY');
assert(status.currentCreativeTruth?.activeGate === 'LR5.1', 'STATUS_ACTIVE_GATE');
assert(status.currentCreativeTruth?.riccoCandidates === 0, 'STATUS_RICCO_COUNT');
assert(status.currentCreativeTruth?.imageGenerationAllowed === false, 'STATUS_GENERATION_BOUNDARY');
assert(status.currentCreativeTruth?.characterMastersApproved === 0, 'STATUS_CHARACTER_MASTERS');
assert(status.currentCreativeTruth?.locationMastersApproved === 0, 'STATUS_LOCATION_MASTERS');
assert(status.currentCreativeTruth?.voiceMastersApproved === 0, 'STATUS_VOICE_MASTERS');
assert(status.currentCreativeTruth?.finishedEpisodes === 0, 'STATUS_EPISODES');
assert(status.proof?.publicPagesEvidence === 'pass', 'STATUS_PUBLIC_PAGES');
assert(status.proof?.publicAcademyEvidence === 'pass', 'STATUS_PUBLIC_ACADEMY');
assert(status.knownOperationalRisks?.some((risk) => risk.issue === 103 && risk.status === 'OPEN'), 'STATUS_REPORTER_RISK');

assert(readiness.schemaVersion === 1, 'READINESS_SCHEMA');
assert(readiness.trackingIssue === 102, 'READINESS_TRACKING');
assert(readiness.summary?.provenGateCount === 8, 'READINESS_PROVEN_COUNT');
assert(readiness.summary?.requiredGateCount === 10, 'READINESS_REQUIRED_COUNT');
assert(readiness.summary?.technicalWorkflowReady === true, 'READINESS_TECHNICAL');
assert(readiness.summary?.productionCreativeReady === false, 'READINESS_CREATIVE_BOUNDARY');
assert(readiness.summary?.externalNoviceAcceptanceComplete === false, 'READINESS_EXTERNAL_BOUNDARY');
assert(readiness.summary?.overallReady === false, 'READINESS_OVERALL_BOUNDARY');
assert(readiness.gates?.[0]?.status === 'IN_PROGRESS', 'READINESS_INSTALLATION');
assert(readiness.gates?.[9]?.status === 'EXTERNAL_INPUT_REQUIRED', 'READINESS_NOVICE');

assert(runtime.schemaVersion === 1, 'RUNTIME_SCHEMA');
assert(runtime.status === 'pass', 'RUNTIME_STATUS', runtime.status);
assert(runtime.commit === expectedCommit, 'RUNTIME_COMMIT', `${runtime.commit} != ${expectedCommit}`);
assert(runtime.trackingIssue === 94, 'RUNTIME_TRACKING');
assert(runtime.stageCount === 12, 'RUNTIME_STAGE_COUNT');
assert(runtime.trainingPathPassed === true, 'RUNTIME_TRAINING');
assert(runtime.productionHumanGatesPassed === true, 'RUNTIME_PRODUCTION_GATES');
assert(runtime.resumePassed === true, 'RUNTIME_RESUME');
assert(runtime.creativeApprovalGranted === false, 'RUNTIME_CREATIVE_BOUNDARY');
assert(runtime.finalEpisodeApprovalGranted === false, 'RUNTIME_EPISODE_BOUNDARY');
assert(Array.isArray(runtime.targets) && runtime.targets.length === 2, 'RUNTIME_TARGET_COUNT');

const targetNames = runtime.targets.map((target) => target.target?.name).sort();
assert(JSON.stringify(targetNames) === JSON.stringify(['desktop', 'mobile']), 'RUNTIME_TARGET_NAMES', targetNames.join(','));
for (const target of runtime.targets) {
  const name = target.target?.name || 'unknown';
  assert(target.initial?.stageCount === 12, 'VISIBLE_STAGE_COUNT', name);
  assert(target.initial?.disabledCount === 11, 'VISIBLE_INITIAL_LOCKS', name);
  assert(target.initial?.progressText?.includes('0/12'), 'VISIBLE_ZERO_PROGRESS', name);
  assert(target.initial?.trainingModePresent === true, 'VISIBLE_TRAINING', name);
  assert(target.initial?.humanBoundaryPresent === true, 'VISIBLE_HUMAN_BOUNDARY', name);
  assert(target.initial?.dayPlanPresent === true, 'VISIBLE_DAY_PLAN', name);
  assert(target.initial?.rolesPresent === true, 'VISIBLE_ROLES', name);
  assert(target.initial?.forbiddenAutoApproval === false, 'VISIBLE_FORBIDDEN_APPROVAL', name);
  assert(target.initial?.horizontalOverflowPixels <= 2, 'VISIBLE_OVERFLOW', `${name}: ${target.initial?.horizontalOverflowPixels}`);
  assert(target.training?.firstStatus === 'training_complete', 'TRAINING_FIRST_STAGE', name);
  assert(target.training?.thirdDisabled === true, 'TRAINING_SEQUENCE_LOCK', name);
  assert(target.production?.seriesBible === 'review_required', 'PRODUCTION_HUMAN_REVIEW', name);
  assert(target.production?.creativeApproved === false, 'PRODUCTION_CREATIVE_BOUNDARY', name);
  assert(target.production?.horizontalOverflowPixels <= 2, 'PRODUCTION_OVERFLOW', `${name}: ${target.production?.horizontalOverflowPixels}`);
  assert(target.resumed === true, 'RESUME_PROOF', name);
}

const desktopHash = await sha256('proof/studio/academy-desktop.png');
const mobileHash = await sha256('proof/studio/academy-mobile.png');
const desktop = runtime.targets.find((target) => target.target?.name === 'desktop');
const mobile = runtime.targets.find((target) => target.target?.name === 'mobile');
assert(desktop?.sha256 === desktopHash, 'DESKTOP_HASH', `${desktop?.sha256} != ${desktopHash}`);
assert(mobile?.sha256 === mobileHash, 'MOBILE_HASH', `${mobile?.sha256} != ${mobileHash}`);

console.log(JSON.stringify({
  status: 'pass',
  siteDir,
  expectedCommit,
  trackingIssue: 94,
  readinessIssue: 102,
  stageCount: 12,
  readinessProvenGates: 8,
  readinessRequiredGates: 10,
  overallReady: false,
  route: '/studio/#academy',
  trainingPathPassed: true,
  productionHumanGatesPassed: true,
  creativeApprovalGranted: false,
  finalEpisodeApprovalGranted: false,
  desktopHash,
  mobileHash
}, null, 2));
