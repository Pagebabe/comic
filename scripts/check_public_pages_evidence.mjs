import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const proofDir = resolve(valueAfter('--dir', '/tmp/public-proof'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') {
  throw new Error(`[PUBLIC_PAGES:${code}]${detail ? ` ${detail}` : ''}`);
}

function assert(condition, code, detail = '') {
  if (!condition) fail(code, detail);
}

async function requireFile(relativePath) {
  const path = resolve(proofDir, relativePath);
  try {
    await access(path);
  } catch {
    fail('MISSING_FILE', relativePath);
  }
  return path;
}

async function json(relativePath) {
  const path = await requireFile(relativePath);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    fail('INVALID_JSON', `${relativePath}: ${error.message}`);
  }
}

async function sha256(relativePath) {
  return createHash('sha256').update(await readFile(await requireFile(relativePath))).digest('hex');
}

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT_MISSING');

const [dashboard, deployedStudio, liveStudio, loopClosure, pilotClosure] = await Promise.all([
  json('runtime-evidence.json'),
  json('studio-runtime-evidence.json'),
  json('live/studio-runtime-evidence.json'),
  json('lr3-production-loop-closure.json'),
  json('lr4-selected-pilot-closure.json')
]);

assert(dashboard.status === 'pass', 'DASHBOARD_STATUS', dashboard.status);
assert(dashboard.commit === expectedCommit, 'DASHBOARD_COMMIT', `${dashboard.commit} != ${expectedCommit}`);
assert(dashboard.closedGate === 'LR4', 'DASHBOARD_CLOSED_GATE', dashboard.closedGate);
assert(dashboard.activeGate === 'LR5', 'DASHBOARD_ACTIVE_GATE', dashboard.activeGate);
assert(dashboard.activeTrackingIssue === 82, 'DASHBOARD_TRACKING');
assert(dashboard.selectedPilot === 'pilot-das-zimmer', 'DASHBOARD_PILOT');
assert(dashboard.productionLoopRestored === true, 'DASHBOARD_LR3_RESTORED');
assert(dashboard.selectedPilotFireTestPassed === true, 'DASHBOARD_LR4_PASS');
assert(dashboard.characterMastersApproved === 0, 'DASHBOARD_CHARACTER_MASTERS');
assert(dashboard.locationMastersApproved === 0, 'DASHBOARD_LOCATION_MASTERS');
assert(dashboard.voiceMastersApproved === 0, 'DASHBOARD_VOICE_MASTERS');
assert(dashboard.finishedEpisodes === 0, 'DASHBOARD_FINISHED_EPISODES');

assert(loopClosure.status === 'closed_verified', 'LR3_CLOSURE_STATUS');
assert(loopClosure.proof?.stationsPassed === 9, 'LR3_STATIONS');
assert(loopClosure.proof?.deleteRestoreHashMatch === true, 'LR3_HASH_MATCH');

assert(pilotClosure.status === 'closed_verified', 'LR4_CLOSURE_STATUS');
assert(pilotClosure.implementedBy?.pullRequest === 81, 'LR4_PR');
assert(pilotClosure.implementedBy?.ciRun === 29152706460, 'LR4_CI');
assert(pilotClosure.implementedBy?.mergeCommit === '63021f49152dee7375578537be13dafd65685391', 'LR4_MERGE');
assert(pilotClosure.publicProof?.pagesRun === 29152807415, 'LR4_ORIGINAL_PAGES');
assert(pilotClosure.proof?.stateHash === '97b8216fbb11059a5f8fa0e3748ea8fa1e03706e15174c307ffe9ce84ca8c2cf', 'LR4_STATE_HASH');
assert(pilotClosure.proof?.packageHash === 'b6d2c8814dfc5cc558c5d7dd81113e71eafc51f531515fd7b4e9e8ec5a2ad196', 'LR4_PACKAGE_HASH');
assert(pilotClosure.nextGate?.trackingIssue === 82, 'LR4_HANDOFF');

for (const [label, runtime] of [['deployed', deployedStudio], ['live', liveStudio]]) {
  assert(runtime.status === 'pass', 'STUDIO_STATUS', label);
  assert(runtime.closedGate === 'LR4', 'STUDIO_CLOSED_GATE', label);
  assert(runtime.productionLoopClosureStatus === 'closed_verified', 'STUDIO_LR3_CLOSURE', label);
  assert(runtime.selectedPilotFireTestClosureStatus === 'closed_verified', 'STUDIO_LR4_CLOSURE', label);
  assert(runtime.activeGate === 'LR5', 'STUDIO_ACTIVE_GATE', label);
  assert(runtime.activeTrackingIssue === 82, 'STUDIO_TRACKING', label);
  assert(runtime.productionLoopRestored === true, 'STUDIO_LR3_RESTORED', label);
  assert(runtime.selectedPilotFireTestPassed === true, 'STUDIO_LR4_PASS', label);
  assert(runtime.selectedPilotDetailsStatus === 'REVIEW_REQUIRED', 'STUDIO_DETAIL_BOUNDARY', label);
  assert(runtime.stateHash === loopClosure.proof.stateHash, 'STUDIO_LR3_STATE_HASH', label);
  assert(runtime.packageHash === loopClosure.proof.packageHash, 'STUDIO_LR3_PACKAGE_HASH', label);
  assert(runtime.selectedPilotStateHash === pilotClosure.proof.stateHash, 'STUDIO_LR4_STATE_HASH', label);
  assert(runtime.selectedPilotPackageHash === pilotClosure.proof.packageHash, 'STUDIO_LR4_PACKAGE_HASH', label);
  assert(runtime.selectedPilotPanelCount === 8, 'STUDIO_PANEL_COUNT', label);
  assert(runtime.selectedPilotDialogueCueCount === 10, 'STUDIO_DIALOGUE_COUNT', label);
  assert(runtime.selectedPilotCandidateDurationSeconds === 45.5, 'STUDIO_DURATION', label);
  assert(runtime.characterMastersApproved === 0, 'STUDIO_CHARACTER_MASTERS', label);
  assert(runtime.locationMastersApproved === 0, 'STUDIO_LOCATION_MASTERS', label);
  assert(runtime.voiceMastersApproved === 0, 'STUDIO_VOICE_MASTERS', label);
  assert(runtime.imageBytesUsed === false, 'STUDIO_IMAGE_BOUNDARY', label);
  assert(runtime.externalExecutionUsed === false, 'STUDIO_EXTERNAL_BOUNDARY', label);
  assert(runtime.creativeApprovalGranted === false, 'STUDIO_CREATIVE_BOUNDARY', label);
  assert(runtime.targets?.length === 2, 'STUDIO_TARGET_COUNT', label);

  for (const target of runtime.targets) {
    assert(target.checks?.foundation?.lr4ClosedPresent === true, 'VISIBLE_LR4_CLOSED', `${label}:${target.name}`);
    assert(target.checks?.foundation?.lr5ActivePresent === true, 'VISIBLE_LR5_ACTIVE', `${label}:${target.name}`);
    assert(target.checks?.foundation?.boundaryPresent === true, 'VISIBLE_MASTER_BOUNDARY', `${label}:${target.name}`);
    assert(target.checks?.lr3Deletion?.stateRemoved === true, 'LR3_DELETE', `${label}:${target.name}`);
    assert(target.checks?.lr3Deletion?.packageRetained === true, 'LR3_PACKAGE_RETAINED', `${label}:${target.name}`);
    assert(target.checks?.lr3Loop?.passedStationCount === 9, 'LR3_STATIONS', `${label}:${target.name}`);
    assert(target.checks?.lr3Loop?.deleteRestorePassPresent === true, 'LR3_DELETE_RESTORE', `${label}:${target.name}`);
    assert(target.checks?.lr3Loop?.hashMatchPresent === true, 'LR3_HASH_MATCH', `${label}:${target.name}`);
    assert(target.checks?.lr3Loop?.stateHashBeforeDelete === target.checks?.lr3Loop?.stateHashAfterRestore, 'LR3_STATE_COMPARE', `${label}:${target.name}`);
    assert(target.checks?.pilotDeletion?.stateRemoved === true, 'LR4_DELETE', `${label}:${target.name}`);
    assert(target.checks?.pilotDeletion?.packageRetained === true, 'LR4_PACKAGE_RETAINED', `${label}:${target.name}`);
    assert(target.checks?.pilotLoop?.passedStationCount === 9, 'LR4_STATIONS', `${label}:${target.name}`);
    assert(target.checks?.pilotLoop?.deleteRestorePassPresent === true, 'LR4_DELETE_RESTORE', `${label}:${target.name}`);
    assert(target.checks?.pilotLoop?.hashMatchPresent === true, 'LR4_HASH_MATCH', `${label}:${target.name}`);
    assert(target.checks?.pilotLoop?.stateHashBeforeDelete === target.checks?.pilotLoop?.stateHashAfterRestore, 'LR4_STATE_COMPARE', `${label}:${target.name}`);
    assert(target.checks?.pilotLoop?.reviewRequiredPresent === true, 'LR4_REVIEW_BOUNDARY', `${label}:${target.name}`);
    assert(target.checks?.pilotLoop?.forbiddenCreativeApproval === false, 'LR4_CREATIVE_BOUNDARY', `${label}:${target.name}`);
  }
}

assert(deployedStudio.commit === expectedCommit, 'DEPLOYED_STUDIO_COMMIT', `${deployedStudio.commit} != ${expectedCommit}`);
assert(deployedStudio.selectedPilotStateHash === liveStudio.selectedPilotStateHash, 'LIVE_STATE_HASH');
assert(deployedStudio.selectedPilotPackageHash === liveStudio.selectedPilotPackageHash, 'LIVE_PACKAGE_HASH');

for (const target of dashboard.targets) {
  const actual = await sha256(`dashboard-${target.name}.png`);
  assert(actual === target.sha256, 'DASHBOARD_SCREENSHOT_HASH', `${target.name}: ${actual} != ${target.sha256}`);
}

for (const target of deployedStudio.targets) {
  const actual = await sha256(`studio-${target.name}.png`);
  assert(actual === target.sha256, 'STUDIO_SCREENSHOT_HASH', `${target.name}: ${actual} != ${target.sha256}`);
  const liveTarget = liveStudio.targets.find((item) => item.name === target.name);
  assert(Boolean(liveTarget), 'LIVE_TARGET_MISSING', target.name);
  assert(liveTarget.sha256 === target.sha256, 'LIVE_SCREENSHOT_DIFF', `${target.name}: ${liveTarget.sha256} != ${target.sha256}`);
  const liveActual = await sha256(`live/studio-${target.name}.png`);
  assert(liveActual === liveTarget.sha256, 'LIVE_SCREENSHOT_HASH', `${target.name}: ${liveActual} != ${liveTarget.sha256}`);
}

console.log(JSON.stringify({
  status: 'pass',
  expectedCommit,
  closedGate: 'LR4',
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  dashboardTargets: dashboard.targets.length,
  deployedStudioTargets: deployedStudio.targets.length,
  liveStudioTargets: liveStudio.targets.length,
  screenshotHashesMatched: true
}, null, 2));
