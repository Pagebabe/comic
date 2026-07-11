import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const siteDir = resolve(valueAfter('--site', '_site'));
const expectedCommit = valueAfter('--expect-commit', process.env.GITHUB_SHA || '');

function fail(code, detail = '') {
  throw new Error(`[PAGES_ARTIFACT:${code}]${detail ? ` ${detail}` : ''}`);
}

function assert(condition, code, detail = '') {
  if (!condition) fail(code, detail);
}

async function requireFile(relativePath) {
  const path = resolve(siteDir, relativePath);
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

for (const file of [
  'lr1-ui.js',
  'studio/index.html',
  'project/truth-state.json',
  'project/pilot-decision-record.json',
  'project/studio-foundation-closure.json',
  'project/lr3-production-loop-closure.json',
  'project/lr4-selected-pilot-source-inventory.json',
  'project/lr4-selected-pilot-closure.json',
  'docs/LR3_MINIMAL_PRODUCTION_LOOP.md',
  'docs/LR4_SELECTED_PILOT_FIRE_TEST.md',
  'proof/runtime-evidence.json',
  'proof/dashboard-desktop.png',
  'proof/dashboard-mobile.png',
  'proof/studio/studio-runtime-evidence.json',
  'proof/studio/studio-desktop.png',
  'proof/studio/studio-mobile.png'
]) await requireFile(file);

const [truth, decision, foundationClosure, loopClosure, pilotInventory, pilotClosure, runtime, studioRuntime] = await Promise.all([
  json('project/truth-state.json'),
  json('project/pilot-decision-record.json'),
  json('project/studio-foundation-closure.json'),
  json('project/lr3-production-loop-closure.json'),
  json('project/lr4-selected-pilot-source-inventory.json'),
  json('project/lr4-selected-pilot-closure.json'),
  json('proof/runtime-evidence.json'),
  json('proof/studio/studio-runtime-evidence.json')
]);

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT_MISSING');
assert(truth.status === 'recovery_line_active', 'TRUTH_STATUS', truth.status);
assert(truth.trackingIssue === 82, 'TRUTH_TRACKING', String(truth.trackingIssue));
assert(truth.canon?.selectedPilot === 'pilot-das-zimmer', 'TRUTH_PILOT', String(truth.canon?.selectedPilot));
for (const gate of ['LR0', 'LR1', 'LR2', 'LR3', 'LR4']) {
  assert(truth.nextSequence?.find((item) => item.id === gate)?.status === 'done', 'TRUTH_GATE_NOT_DONE', gate);
}
assert(truth.nextSequence?.find((item) => item.id === 'LR5')?.status === 'active_recovery_gate', 'TRUTH_LR5_STATUS');
assert(truth.nextSequence?.find((item) => item.id === 'LR5')?.trackingIssue === 82, 'TRUTH_LR5_TRACKING');

assert(decision.status === 'human_decision_recorded', 'DECISION_STATUS', decision.status);
assert(decision.selectedCandidateId === 'pilot-das-zimmer', 'DECISION_PILOT', decision.selectedCandidateId);

assert(foundationClosure.status === 'closed_verified', 'LR2_STATUS', foundationClosure.status);
assert(foundationClosure.pullRequest?.number === 59, 'LR2_PR');
assert(foundationClosure.deployment?.runId === 29148728164, 'LR2_PAGES');

assert(loopClosure.status === 'closed_verified', 'LR3_STATUS', loopClosure.status);
assert(loopClosure.implementedBy?.pullRequest === 74, 'LR3_PR');
assert(loopClosure.implementedBy?.ciRun === 29150833651, 'LR3_CI');
assert(loopClosure.implementedBy?.mergeCommit === '0226b80ae36457c95efb2e4dbbb0546623d274ae', 'LR3_MERGE');
assert(loopClosure.publicProof?.pagesRun === 29150875221, 'LR3_PAGES');
assert(loopClosure.proof?.stationsPassed === 9, 'LR3_STATIONS');
assert(loopClosure.proof?.deleteRestoreHashMatch === true, 'LR3_HASH_MATCH');
assert(loopClosure.proof?.creativeApprovalGranted === false, 'LR3_CREATIVE_BOUNDARY');

assert(pilotInventory.gate === 'LR4', 'LR4_INVENTORY_GATE');
assert(pilotInventory.trackingIssue === 76, 'LR4_INVENTORY_TRACKING');
assert(pilotInventory.sources?.length === 7, 'LR4_SOURCE_COUNT', String(pilotInventory.sources?.length));
assert(pilotInventory.candidateCounts?.panels === 8, 'LR4_PANEL_COUNT');
assert(pilotInventory.candidateCounts?.dialogueCues === 10, 'LR4_DIALOGUE_COUNT');
assert(pilotInventory.candidateCounts?.targetDurationSeconds === 45.5, 'LR4_DURATION');
assert(pilotInventory.sources.every((source) => source.creativeApproval === false), 'LR4_SOURCE_CREATIVE_BOUNDARY');

assert(pilotClosure.status === 'closed_verified', 'LR4_CLOSURE_STATUS', pilotClosure.status);
assert(pilotClosure.implementedBy?.pullRequest === 81, 'LR4_PR');
assert(pilotClosure.implementedBy?.verifiedHead === 'a55a24e24bdae0bbf2b980f2842f57f0653092ca', 'LR4_VERIFIED_HEAD');
assert(pilotClosure.implementedBy?.ciRun === 29152706460, 'LR4_CI');
assert(pilotClosure.implementedBy?.mergeCommit === '63021f49152dee7375578537be13dafd65685391', 'LR4_MERGE');
assert(pilotClosure.publicProof?.pagesRun === 29152807415, 'LR4_PAGES');
assert(pilotClosure.publicProof?.publicVerificationPassed === true, 'LR4_PUBLIC_PROOF');
assert(pilotClosure.nextGate?.trackingIssue === 82, 'LR4_HANDOFF');
assert(pilotClosure.proof?.stationsPassed === 9, 'LR4_STATIONS');
assert(pilotClosure.proof?.panelCount === 8, 'LR4_CLOSURE_PANELS');
assert(pilotClosure.proof?.dialogueCueCount === 10, 'LR4_CLOSURE_DIALOGUE');
assert(pilotClosure.proof?.candidateDurationSeconds === 45.5, 'LR4_CLOSURE_DURATION');
assert(pilotClosure.proof?.stateActuallyDeleted === true, 'LR4_STATE_DELETE');
assert(pilotClosure.proof?.packageRetainedDuringDeletion === true, 'LR4_PACKAGE_RETAINED');
assert(pilotClosure.proof?.deleteRestoreHashMatch === true, 'LR4_HASH_MATCH');
assert(pilotClosure.proof?.stateHash === '97b8216fbb11059a5f8fa0e3748ea8fa1e03706e15174c307ffe9ce84ca8c2cf', 'LR4_STATE_HASH');
assert(pilotClosure.proof?.packageHash === 'b6d2c8814dfc5cc558c5d7dd81113e71eafc51f531515fd7b4e9e8ec5a2ad196', 'LR4_PACKAGE_HASH');
assert(pilotClosure.proof?.imageBytesUsed === false, 'LR4_IMAGE_BOUNDARY');
assert(pilotClosure.proof?.externalExecutionUsed === false, 'LR4_EXTERNAL_BOUNDARY');
assert(pilotClosure.proof?.creativeApprovalGranted === false, 'LR4_CREATIVE_BOUNDARY');

assert(runtime.status === 'pass', 'DASHBOARD_STATUS', runtime.status);
assert(runtime.commit === expectedCommit, 'DASHBOARD_COMMIT', `${runtime.commit} != ${expectedCommit}`);
assert(runtime.closedGate === 'LR4', 'DASHBOARD_CLOSED_GATE', runtime.closedGate);
assert(runtime.activeGate === 'LR5', 'DASHBOARD_ACTIVE_GATE', runtime.activeGate);
assert(runtime.activeTrackingIssue === 82, 'DASHBOARD_TRACKING');
assert(runtime.lr4ClosureStatus === 'closed_verified', 'DASHBOARD_LR4_CLOSURE');
assert(runtime.selectedPilotFireTestPassed === true, 'DASHBOARD_LR4_PASS');
assert(runtime.characterMastersApproved === 0, 'DASHBOARD_CHARACTER_MASTERS');
assert(runtime.locationMastersApproved === 0, 'DASHBOARD_LOCATION_MASTERS');
assert(runtime.voiceMastersApproved === 0, 'DASHBOARD_VOICE_MASTERS');
assert(runtime.finishedEpisodes === 0, 'DASHBOARD_FINISHED_EPISODES');
assert(runtime.targets?.length === 2, 'DASHBOARD_TARGET_COUNT', String(runtime.targets?.length));
for (const target of runtime.targets) {
  assert(target.checks?.lr4ClosedPresent === true, 'DASHBOARD_VISIBLE_LR4', target.name);
  assert(target.checks?.lr5ActivePresent === true, 'DASHBOARD_VISIBLE_LR5', target.name);
  assert(target.checks?.masterBoundaryPresent === true, 'DASHBOARD_MASTER_BOUNDARY', target.name);
  assert(target.checks?.horizontalOverflowPixels <= 2, 'DASHBOARD_OVERFLOW', `${target.name}: ${target.checks?.horizontalOverflowPixels}`);
  assert(target.checks?.visiblePortraitImages === 0, 'DASHBOARD_PORTRAIT_IMAGES', target.name);
}

assert(studioRuntime.status === 'pass', 'STUDIO_STATUS', studioRuntime.status);
assert(studioRuntime.commit === expectedCommit, 'STUDIO_COMMIT', `${studioRuntime.commit} != ${expectedCommit}`);
assert(studioRuntime.closedGate === 'LR4', 'STUDIO_CLOSED_GATE', studioRuntime.closedGate);
assert(studioRuntime.activeGate === 'LR5', 'STUDIO_ACTIVE_GATE', studioRuntime.activeGate);
assert(studioRuntime.activeTrackingIssue === 82, 'STUDIO_TRACKING');
assert(studioRuntime.selectedPilotFireTestClosureStatus === 'closed_verified', 'STUDIO_LR4_CLOSURE');
assert(studioRuntime.productionLoopRestored === true, 'STUDIO_LR3_RESTORED');
assert(studioRuntime.selectedPilotFireTestPassed === true, 'STUDIO_LR4_PASS');
assert(studioRuntime.selectedPilotDetailsStatus === 'REVIEW_REQUIRED', 'STUDIO_DETAIL_BOUNDARY');
assert(studioRuntime.stateHash === loopClosure.proof.stateHash, 'STUDIO_LR3_STATE_HASH');
assert(studioRuntime.packageHash === loopClosure.proof.packageHash, 'STUDIO_LR3_PACKAGE_HASH');
assert(studioRuntime.selectedPilotStateHash === pilotClosure.proof.stateHash, 'STUDIO_LR4_STATE_HASH');
assert(studioRuntime.selectedPilotPackageHash === pilotClosure.proof.packageHash, 'STUDIO_LR4_PACKAGE_HASH');
assert(studioRuntime.selectedPilotPanelCount === 8, 'STUDIO_PANEL_COUNT');
assert(studioRuntime.selectedPilotDialogueCueCount === 10, 'STUDIO_DIALOGUE_COUNT');
assert(studioRuntime.selectedPilotCandidateDurationSeconds === 45.5, 'STUDIO_DURATION');
assert(studioRuntime.characterMastersApproved === 0, 'STUDIO_CHARACTER_MASTERS');
assert(studioRuntime.locationMastersApproved === 0, 'STUDIO_LOCATION_MASTERS');
assert(studioRuntime.voiceMastersApproved === 0, 'STUDIO_VOICE_MASTERS');
assert(studioRuntime.imageBytesUsed === false, 'STUDIO_IMAGE_BOUNDARY');
assert(studioRuntime.externalExecutionUsed === false, 'STUDIO_EXTERNAL_BOUNDARY');
assert(studioRuntime.creativeApprovalGranted === false, 'STUDIO_CREATIVE_BOUNDARY');
assert(studioRuntime.targets?.length === 2, 'STUDIO_TARGET_COUNT', String(studioRuntime.targets?.length));

for (const target of studioRuntime.targets) {
  const foundation = target.checks?.foundation;
  const lr3Deletion = target.checks?.lr3Deletion;
  const lr3 = target.checks?.lr3Loop;
  const lr4Deletion = target.checks?.pilotDeletion;
  const lr4 = target.checks?.pilotLoop;

  assert(foundation?.lr4ClosedPresent === true, 'STUDIO_VISIBLE_LR4', target.name);
  assert(foundation?.lr5ActivePresent === true, 'STUDIO_VISIBLE_LR5', target.name);
  assert(foundation?.boundaryPresent === true, 'STUDIO_MASTER_BOUNDARY', target.name);
  assert(foundation?.horizontalOverflowPixels <= 2, 'STUDIO_FOUNDATION_OVERFLOW', `${target.name}: ${foundation?.horizontalOverflowPixels}`);
  assert(foundation?.imageCount === 0, 'STUDIO_FOUNDATION_IMAGES', target.name);

  assert(lr3Deletion?.stateRemoved === true, 'STUDIO_LR3_DELETE', target.name);
  assert(lr3Deletion?.packageRetained === true, 'STUDIO_LR3_PACKAGE_RETAINED', target.name);
  assert(lr3?.passedStationCount === 9, 'STUDIO_LR3_STATIONS', target.name);
  assert(lr3?.deleteRestorePassPresent === true, 'STUDIO_LR3_DELETE_RESTORE', target.name);
  assert(lr3?.hashMatchPresent === true, 'STUDIO_LR3_HASH_MATCH', target.name);
  assert(lr3?.stateHashBeforeDelete === lr3?.stateHashAfterRestore, 'STUDIO_LR3_STATE_COMPARE', target.name);

  assert(lr4Deletion?.stateRemoved === true, 'STUDIO_LR4_DELETE', target.name);
  assert(lr4Deletion?.packageRetained === true, 'STUDIO_LR4_PACKAGE_RETAINED', target.name);
  assert(lr4?.passedStationCount === 9, 'STUDIO_LR4_STATIONS', target.name);
  assert(lr4?.deleteRestorePassPresent === true, 'STUDIO_LR4_DELETE_RESTORE', target.name);
  assert(lr4?.hashMatchPresent === true, 'STUDIO_LR4_HASH_MATCH', target.name);
  assert(lr4?.stateHashBeforeDelete === lr4?.stateHashAfterRestore, 'STUDIO_LR4_STATE_COMPARE', target.name);
  assert(lr4?.reviewRequiredPresent === true, 'STUDIO_LR4_REVIEW_BOUNDARY', target.name);
  assert(lr4?.forbiddenCreativeApproval === false, 'STUDIO_LR4_CREATIVE_BOUNDARY', target.name);
  assert(lr4?.horizontalOverflowPixels <= 2, 'STUDIO_LR4_OVERFLOW', `${target.name}: ${lr4?.horizontalOverflowPixels}`);
  assert(lr4?.imageCount === 0, 'STUDIO_LR4_IMAGES', target.name);
}

console.log(JSON.stringify({
  status: 'pass',
  siteDir,
  expectedCommit,
  closedGate: 'LR4',
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  dashboardTargets: runtime.targets.length,
  studioTargets: studioRuntime.targets.length,
  fixedFieldContract: 'studioRuntime.targets[].checks.foundation.boundaryPresent'
}, null, 2));
