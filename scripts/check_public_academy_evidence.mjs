import { createHash } from 'node:crypto';
import { access, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const proofDir = resolve(valueAfter('--dir', '/tmp/public-proof'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') {
  throw new Error(`[PUBLIC_ACADEMY:${code}]${detail ? ` ${detail}` : ''}`);
}
function assert(condition, code, detail = '') {
  if (!condition) fail(code, detail);
}
async function requireFile(relativePath, minimumBytes = 1) {
  const path = resolve(proofDir, relativePath);
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
  'production-academy.json',
  'production-academy-status.json',
  'academy-runtime-evidence.json',
  'academy-desktop.png',
  'academy-mobile.png',
  'live-academy/academy-runtime-evidence.json',
  'live-academy/academy-desktop.png',
  'live-academy/academy-mobile.png'
]) await requireFile(file, file.endsWith('.png') ? 10_000 : 100);

const [contract, status, deployed, live] = await Promise.all([
  json('production-academy.json'),
  json('production-academy-status.json'),
  json('academy-runtime-evidence.json'),
  json('live-academy/academy-runtime-evidence.json')
]);

assert(contract.schemaVersion === 1, 'CONTRACT_SCHEMA');
assert(contract.trackingIssue === 94, 'CONTRACT_TRACKING');
assert(contract.stages?.length === 12, 'CONTRACT_STAGE_COUNT');
assert(contract.stages.slice(1).every((stage) => stage.automaticApprovalAllowed === false), 'CONTRACT_HUMAN_GATES');

assert(status.status === 'proven_production_enablement_ready', 'STATUS_VALUE', status.status);
assert(status.route === '/studio/#academy', 'STATUS_ROUTE');
assert(status.safety?.humanGatesAutomaticallyApproved === false, 'STATUS_HUMAN_BOUNDARY');
assert(status.safety?.finalEpisodeAutomaticallyApproved === false, 'STATUS_EPISODE_BOUNDARY');
assert(status.currentCreativeTruth?.riccoCandidates === 0, 'STATUS_RICCO_COUNT');
assert(status.currentCreativeTruth?.imageGenerationAllowed === false, 'STATUS_GENERATION_BOUNDARY');
assert(status.currentCreativeTruth?.characterMastersApproved === 0, 'STATUS_CHARACTER_MASTERS');
assert(status.currentCreativeTruth?.locationMastersApproved === 0, 'STATUS_LOCATION_MASTERS');
assert(status.currentCreativeTruth?.voiceMastersApproved === 0, 'STATUS_VOICE_MASTERS');
assert(status.currentCreativeTruth?.finishedEpisodes === 0, 'STATUS_EPISODES');

for (const [label, runtime] of [['deployed', deployed], ['live', live]]) {
  assert(runtime.schemaVersion === 1, 'RUNTIME_SCHEMA', label);
  assert(runtime.status === 'pass', 'RUNTIME_STATUS', label);
  assert(runtime.commit === expectedCommit, 'RUNTIME_COMMIT', `${label}: ${runtime.commit} != ${expectedCommit}`);
  assert(runtime.trackingIssue === 94, 'RUNTIME_TRACKING', label);
  assert(runtime.stageCount === 12, 'RUNTIME_STAGE_COUNT', label);
  assert(runtime.trainingPathPassed === true, 'RUNTIME_TRAINING', label);
  assert(runtime.productionHumanGatesPassed === true, 'RUNTIME_PRODUCTION_GATES', label);
  assert(runtime.resumePassed === true, 'RUNTIME_RESUME', label);
  assert(runtime.creativeApprovalGranted === false, 'RUNTIME_CREATIVE_BOUNDARY', label);
  assert(runtime.finalEpisodeApprovalGranted === false, 'RUNTIME_EPISODE_BOUNDARY', label);
  assert(runtime.targets?.length === 2, 'RUNTIME_TARGET_COUNT', label);
  for (const target of runtime.targets) {
    const name = `${label}:${target.target?.name || 'unknown'}`;
    assert(target.initial?.stageCount === 12, 'VISIBLE_STAGE_COUNT', name);
    assert(target.initial?.disabledCount === 11, 'VISIBLE_INITIAL_LOCKS', name);
    assert(target.initial?.progressText?.includes('0/12'), 'VISIBLE_ZERO_PROGRESS', name);
    assert(target.initial?.trainingModePresent === true, 'VISIBLE_TRAINING', name);
    assert(target.initial?.humanBoundaryPresent === true, 'VISIBLE_HUMAN_BOUNDARY', name);
    assert(target.initial?.forbiddenAutoApproval === false, 'VISIBLE_FORBIDDEN_APPROVAL', name);
    assert(target.initial?.horizontalOverflowPixels <= 2, 'VISIBLE_OVERFLOW', name);
    assert(target.training?.firstStatus === 'training_complete', 'TRAINING_FIRST_STAGE', name);
    assert(target.training?.thirdDisabled === true, 'TRAINING_SEQUENCE_LOCK', name);
    assert(target.production?.seriesBible === 'review_required', 'PRODUCTION_HUMAN_REVIEW', name);
    assert(target.production?.creativeApproved === false, 'PRODUCTION_CREATIVE_BOUNDARY', name);
    assert(target.production?.horizontalOverflowPixels <= 2, 'PRODUCTION_OVERFLOW', name);
    assert(target.resumed === true, 'RESUME_PROOF', name);
  }
}

assert(deployed.stageCount === live.stageCount, 'LIVE_STAGE_MATCH');
assert(deployed.creativeApprovalGranted === live.creativeApprovalGranted, 'LIVE_CREATIVE_MATCH');
assert(deployed.finalEpisodeApprovalGranted === live.finalEpisodeApprovalGranted, 'LIVE_EPISODE_MATCH');

const deployedDesktopHash = await sha256('academy-desktop.png');
const deployedMobileHash = await sha256('academy-mobile.png');
const liveDesktopHash = await sha256('live-academy/academy-desktop.png');
const liveMobileHash = await sha256('live-academy/academy-mobile.png');

const deployedDesktop = deployed.targets.find((target) => target.target?.name === 'desktop');
const deployedMobile = deployed.targets.find((target) => target.target?.name === 'mobile');
const liveDesktop = live.targets.find((target) => target.target?.name === 'desktop');
const liveMobile = live.targets.find((target) => target.target?.name === 'mobile');

assert(deployedDesktop?.sha256 === deployedDesktopHash, 'DEPLOYED_DESKTOP_HASH');
assert(deployedMobile?.sha256 === deployedMobileHash, 'DEPLOYED_MOBILE_HASH');
assert(liveDesktop?.sha256 === liveDesktopHash, 'LIVE_DESKTOP_HASH');
assert(liveMobile?.sha256 === liveMobileHash, 'LIVE_MOBILE_HASH');

console.log(JSON.stringify({
  status: 'pass',
  proofDir,
  expectedCommit,
  trackingIssue: 94,
  route: '/studio/#academy',
  stageCount: 12,
  deployedTrainingPathPassed: deployed.trainingPathPassed,
  liveTrainingPathPassed: live.trainingPathPassed,
  deployedHumanGatesPassed: deployed.productionHumanGatesPassed,
  liveHumanGatesPassed: live.productionHumanGatesPassed,
  creativeApprovalGranted: false,
  finalEpisodeApprovalGranted: false,
  deployedDesktopHash,
  deployedMobileHash,
  liveDesktopHash,
  liveMobileHash
}, null, 2));
