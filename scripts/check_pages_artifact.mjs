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
  try { await access(path); } catch { fail('MISSING_FILE', relativePath); }
  return path;
}
async function json(relativePath) {
  const path = await requireFile(relativePath);
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { fail('INVALID_JSON', `${relativePath}: ${error.message}`); }
}

for (const file of [
  'lr1-ui.js',
  'studio/index.html',
  'project/truth-state.json',
  'project/project.json',
  'project/pilot-decision-record.json',
  'project/studio-foundation-closure.json',
  'project/lr3-production-loop-closure.json',
  'project/lr4-selected-pilot-source-inventory.json',
  'project/lr4-selected-pilot-closure.json',
  'project/lr5-ricco-master-source-inventory.json',
  'project/lr5-ricco-master-contract.json',
  'docs/LR3_MINIMAL_PRODUCTION_LOOP.md',
  'docs/LR4_SELECTED_PILOT_FIRE_TEST.md',
  'docs/LR5_RICCO_MASTER_CONTRACT.md',
  'proof/runtime-evidence.json',
  'proof/dashboard-desktop.png',
  'proof/dashboard-mobile.png',
  'proof/studio/studio-runtime-evidence.json',
  'proof/studio/studio-desktop.png',
  'proof/studio/studio-mobile.png'
]) await requireFile(file);

const [truth, project, decision, foundationClosure, loopClosure, pilotInventory, pilotClosure, riccoInventory, riccoContract, runtime, studioRuntime] = await Promise.all([
  json('project/truth-state.json'),
  json('project/project.json'),
  json('project/pilot-decision-record.json'),
  json('project/studio-foundation-closure.json'),
  json('project/lr3-production-loop-closure.json'),
  json('project/lr4-selected-pilot-source-inventory.json'),
  json('project/lr4-selected-pilot-closure.json'),
  json('project/lr5-ricco-master-source-inventory.json'),
  json('project/lr5-ricco-master-contract.json'),
  json('proof/runtime-evidence.json'),
  json('proof/studio/studio-runtime-evidence.json')
]);

assert(Boolean(expectedCommit), 'EXPECTED_COMMIT_MISSING');
assert(truth.schemaVersion === 7, 'TRUTH_SCHEMA', String(truth.schemaVersion));
assert(truth.status === 'recovery_line_active', 'TRUTH_STATUS', truth.status);
assert(truth.trackingIssue === 82, 'TRUTH_TRACKING', String(truth.trackingIssue));
assert(truth.canon?.selectedPilot === 'pilot-das-zimmer', 'TRUTH_PILOT', String(truth.canon?.selectedPilot));
for (const gate of ['LR0', 'LR1', 'LR2', 'LR3', 'LR4']) assert(truth.nextSequence?.find((item) => item.id === gate)?.status === 'done', 'TRUTH_GATE_NOT_DONE', gate);
assert(truth.nextSequence?.find((item) => item.id === 'LR5')?.status === 'active_recovery_gate', 'TRUTH_LR5_STATUS');
assert(truth.nextSequence?.find((item) => item.id === 'LR5')?.trackingIssue === 82, 'TRUTH_LR5_TRACKING');
assert(truth.nextSequence?.find((item) => item.id === 'LR5')?.activeWorkPackage === 'LR5.1', 'TRUTH_LR51_REFERENCE');
assert(truth.activeWorkPackage?.id === 'LR5.1', 'TRUTH_LR51_ID');
assert(truth.activeWorkPackage?.trackingIssue === 88, 'TRUTH_LR51_TRACKING');
assert(truth.activeWorkPackage?.status === 'contract_review_required', 'TRUTH_LR51_STATUS');
assert(truth.activeWorkPackage?.candidateLimit === 1, 'TRUTH_RICCO_LIMIT');
assert(truth.activeWorkPackage?.candidateSheets === 0, 'TRUTH_RICCO_COUNT');
assert(truth.activeWorkPackage?.imageGenerationAllowedNow === false, 'TRUTH_RICCO_GENERATION');
assert(truth.activeWorkPackage?.imageBytesPresent === false, 'TRUTH_RICCO_BYTES');
assert(truth.activeWorkPackage?.externalExecutionUsed === false, 'TRUTH_RICCO_EXTERNAL');
assert(truth.activeWorkPackage?.masterApproved === false, 'TRUTH_RICCO_MASTER');

assert(project.activeMilestone === 'LR5', 'PROJECT_GATE');
assert(project.activeTrackingIssue === 82, 'PROJECT_TRACKING');
assert(project.activeWorkPackage?.id === 'LR5.1', 'PROJECT_LR51_ID');
assert(project.activeWorkPackage?.trackingIssue === 88, 'PROJECT_LR51_TRACKING');
assert(project.activeWorkPackage?.candidateSheets === 0, 'PROJECT_RICCO_COUNT');
assert(project.activeWorkPackage?.imageGenerationAllowedNow === false, 'PROJECT_RICCO_GENERATION');
assert(project.activeWorkPackage?.masterApproved === false, 'PROJECT_RICCO_MASTER');
assert(project.deployment?.lastVerifiedMergeCommit === '56a4e9da2d9c0ed6d56fdfda42ba10113a6c476f', 'PROJECT_PUBLIC_MERGE');
assert(project.deployment?.lastVerifiedPagesRun === 29154561431, 'PROJECT_PUBLIC_PAGES');

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
assert(pilotClosure.proof?.stateActuallyDeleted === true, 'LR4_STATE_DELETE');
assert(pilotClosure.proof?.packageRetainedDuringDeletion === true, 'LR4_PACKAGE_RETAINED');
assert(pilotClosure.proof?.deleteRestoreHashMatch === true, 'LR4_HASH_MATCH');
assert(pilotClosure.proof?.stateHash === '97b8216fbb11059a5f8fa0e3748ea8fa1e03706e15174c307ffe9ce84ca8c2cf', 'LR4_STATE_HASH');
assert(pilotClosure.proof?.packageHash === 'b6d2c8814dfc5cc558c5d7dd81113e71eafc51f531515fd7b4e9e8ec5a2ad196', 'LR4_PACKAGE_HASH');
assert(pilotClosure.proof?.imageBytesUsed === false, 'LR4_IMAGE_BOUNDARY');
assert(pilotClosure.proof?.externalExecutionUsed === false, 'LR4_EXTERNAL_BOUNDARY');
assert(pilotClosure.proof?.creativeApprovalGranted === false, 'LR4_CREATIVE_BOUNDARY');

assert(riccoInventory.gate === 'LR5', 'RICCO_INVENTORY_GATE');
assert(riccoInventory.workPackage === 'LR5.1', 'RICCO_WORK_PACKAGE');
assert(riccoInventory.parentTrackingIssue === 82, 'RICCO_PARENT_TRACKING');
assert(riccoInventory.trackingIssue === 88, 'RICCO_TRACKING');
assert(riccoInventory.sources?.length === 7, 'RICCO_SOURCE_COUNT');
assert(riccoInventory.resolvedConflicts?.length === 5, 'RICCO_CONFLICT_COUNT');
assert(riccoInventory.candidateBoundary?.maximumCandidateSheets === 1, 'RICCO_LIMIT');
assert(riccoInventory.candidateBoundary?.currentCandidateSheets === 0, 'RICCO_COUNT');
assert(riccoInventory.candidateBoundary?.imageBytesPresent === false, 'RICCO_BYTES');
assert(riccoInventory.candidateBoundary?.externalGeneratorExecutionUsed === false, 'RICCO_EXTERNAL');
assert(riccoInventory.candidateBoundary?.masterApproved === false, 'RICCO_MASTER');
assert(riccoInventory.sources.every((source) => source.creativeApproval === false), 'RICCO_SOURCE_APPROVAL');
assert(riccoContract.contractId === 'lr5-ricco-visual-master-v1', 'RICCO_CONTRACT_ID');
assert(riccoContract.status === 'CONTRACT_READY_REVIEW_REQUIRED', 'RICCO_CONTRACT_STATUS');
assert(riccoContract.executionGate?.imageGenerationAllowedNow === false, 'RICCO_GENERATION');
assert(riccoContract.executionGate?.maximumCandidateSheetsAfterApproval === 1, 'RICCO_CONTRACT_LIMIT');
assert(riccoContract.executionGate?.batchGenerationAllowed === false, 'RICCO_BATCH');
assert(riccoContract.executionGate?.loraTrainingAllowed === false, 'RICCO_LORA');
assert(riccoContract.executionGate?.automaticMasterAssignmentAllowed === false, 'RICCO_AUTO_MASTER');
assert(riccoContract.humanDecision?.current === 'REVIEW_REQUIRED', 'RICCO_REVIEW_STATUS');
assert(riccoContract.currentState?.candidateSheets === 0, 'RICCO_STATE_COUNT');
assert(riccoContract.currentState?.imageBytesPresent === false, 'RICCO_STATE_BYTES');
assert(riccoContract.currentState?.externalExecutionUsed === false, 'RICCO_STATE_EXTERNAL');
assert(riccoContract.currentState?.masterApproved === false, 'RICCO_STATE_MASTER');

assert(runtime.status === 'pass', 'DASHBOARD_STATUS', runtime.status);
assert(runtime.commit === expectedCommit, 'DASHBOARD_COMMIT', `${runtime.commit} != ${expectedCommit}`);
assert(runtime.closedGate === 'LR4', 'DASHBOARD_CLOSED_GATE', runtime.closedGate);
assert(runtime.activeGate === 'LR5', 'DASHBOARD_ACTIVE_GATE', runtime.activeGate);
assert(runtime.activeTrackingIssue === 82, 'DASHBOARD_TRACKING');
assert(runtime.activeWorkPackage === 'LR5.1', 'DASHBOARD_LR51');
assert(runtime.activeWorkPackageTrackingIssue === 88, 'DASHBOARD_LR51_TRACKING');
assert(runtime.lr4ClosureStatus === 'closed_verified', 'DASHBOARD_LR4_CLOSURE');
assert(runtime.selectedPilotFireTestPassed === true, 'DASHBOARD_LR4_PASS');
assert(runtime.riccoMasterContractStatus === 'CONTRACT_READY_REVIEW_REQUIRED', 'DASHBOARD_RICCO_CONTRACT');
assert(runtime.riccoMasterReviewStatus === 'REVIEW_REQUIRED', 'DASHBOARD_RICCO_REVIEW');
assert(runtime.riccoMasterSourceCount === 7, 'DASHBOARD_RICCO_SOURCES');
assert(runtime.riccoMasterConflictCount === 5, 'DASHBOARD_RICCO_CONFLICTS');
assert(runtime.riccoMasterReviewTestCount === 10, 'DASHBOARD_RICCO_TESTS');
assert(runtime.riccoMasterCandidateLimit === 1, 'DASHBOARD_RICCO_LIMIT');
assert(runtime.riccoMasterCandidateSheets === 0, 'DASHBOARD_RICCO_COUNT');
assert(runtime.riccoMasterImageGenerationAllowedNow === false, 'DASHBOARD_RICCO_GENERATION');
assert(runtime.riccoMasterImageBytesPresent === false, 'DASHBOARD_RICCO_BYTES');
assert(runtime.riccoMasterExternalExecutionUsed === false, 'DASHBOARD_RICCO_EXTERNAL');
assert(runtime.riccoMasterApproved === false, 'DASHBOARD_RICCO_MASTER');
assert(runtime.characterMastersApproved === 0, 'DASHBOARD_CHARACTER_MASTERS');
assert(runtime.locationMastersApproved === 0, 'DASHBOARD_LOCATION_MASTERS');
assert(runtime.voiceMastersApproved === 0, 'DASHBOARD_VOICE_MASTERS');
assert(runtime.finishedEpisodes === 0, 'DASHBOARD_FINISHED_EPISODES');
assert(runtime.targets?.length === 2, 'DASHBOARD_TARGET_COUNT', String(runtime.targets?.length));
for (const target of runtime.targets) {
  assert(target.checks?.lr4ClosedPresent === true, 'DASHBOARD_VISIBLE_LR4', target.name);
  assert(target.checks?.lr5ActivePresent === true, 'DASHBOARD_VISIBLE_LR5', target.name);
  assert(target.checks?.lr51ActivePresent === true, 'DASHBOARD_VISIBLE_LR51', target.name);
  assert(target.checks?.riccoContractPresent === true, 'DASHBOARD_RICCO_CONTRACT_VISIBLE', target.name);
  assert(target.checks?.riccoCandidateZeroPresent === true, 'DASHBOARD_RICCO_ZERO_VISIBLE', target.name);
  assert(target.checks?.riccoExecutionBlockedPresent === true, 'DASHBOARD_RICCO_BLOCKED_VISIBLE', target.name);
  assert(target.checks?.riccoSourceProofPresent === true, 'DASHBOARD_RICCO_SOURCE_VISIBLE', target.name);
  assert(target.checks?.riccoRoutePresent === true, 'DASHBOARD_RICCO_ROUTE', target.name);
  assert(target.checks?.masterBoundaryPresent === true, 'DASHBOARD_MASTER_BOUNDARY', target.name);
  assert(target.checks?.horizontalOverflowPixels <= 2, 'DASHBOARD_OVERFLOW', `${target.name}: ${target.checks?.horizontalOverflowPixels}`);
  assert(target.checks?.visiblePortraitImages === 0, 'DASHBOARD_PORTRAIT_IMAGES', target.name);
  assert(target.checks?.generationAllowedClaimPresent === false, 'DASHBOARD_FORBIDDEN_GENERATION_CLAIM', target.name);
}

assert(studioRuntime.status === 'pass', 'STUDIO_STATUS', studioRuntime.status);
assert(studioRuntime.commit === expectedCommit, 'STUDIO_COMMIT', `${studioRuntime.commit} != ${expectedCommit}`);
assert(studioRuntime.closedGate === 'LR4', 'STUDIO_CLOSED_GATE', studioRuntime.closedGate);
assert(studioRuntime.activeGate === 'LR5', 'STUDIO_ACTIVE_GATE', studioRuntime.activeGate);
assert(studioRuntime.activeTrackingIssue === 82, 'STUDIO_TRACKING');
assert(studioRuntime.activeWorkPackage === 'LR5.1', 'STUDIO_LR51');
assert(studioRuntime.activeWorkPackageTrackingIssue === 88, 'STUDIO_LR51_TRACKING');
assert(studioRuntime.selectedPilotFireTestClosureStatus === 'closed_verified', 'STUDIO_LR4_CLOSURE');
assert(studioRuntime.productionLoopRestored === true, 'STUDIO_LR3_RESTORED');
assert(studioRuntime.selectedPilotFireTestPassed === true, 'STUDIO_LR4_PASS');
assert(studioRuntime.selectedPilotDetailsStatus === 'REVIEW_REQUIRED', 'STUDIO_DETAIL_BOUNDARY');
assert(studioRuntime.stateHash === loopClosure.proof.stateHash, 'STUDIO_LR3_STATE_HASH');
assert(studioRuntime.packageHash === loopClosure.proof.packageHash, 'STUDIO_LR3_PACKAGE_HASH');
assert(studioRuntime.selectedPilotStateHash === pilotClosure.proof.stateHash, 'STUDIO_LR4_STATE_HASH');
assert(studioRuntime.selectedPilotPackageHash === pilotClosure.proof.packageHash, 'STUDIO_LR4_PACKAGE_HASH');
assert(studioRuntime.riccoMasterContractStatus === 'CONTRACT_READY_REVIEW_REQUIRED', 'STUDIO_RICCO_CONTRACT');
assert(studioRuntime.riccoMasterReviewStatus === 'REVIEW_REQUIRED', 'STUDIO_RICCO_REVIEW');
assert(studioRuntime.riccoMasterCandidateLimit === 1, 'STUDIO_RICCO_LIMIT');
assert(studioRuntime.riccoMasterCandidateSheets === 0, 'STUDIO_RICCO_COUNT');
assert(studioRuntime.riccoMasterImageGenerationAllowedNow === false, 'STUDIO_RICCO_GENERATION');
assert(studioRuntime.riccoMasterImageBytesPresent === false, 'STUDIO_RICCO_BYTES');
assert(studioRuntime.riccoMasterExternalExecutionUsed === false, 'STUDIO_RICCO_EXTERNAL');
assert(studioRuntime.riccoMasterApproved === false, 'STUDIO_RICCO_MASTER');
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
  const ricco = target.checks?.riccoContract;
  assert(foundation?.lr4ClosedPresent === true, 'STUDIO_VISIBLE_LR4', target.name);
  assert(foundation?.lr5ActivePresent === true, 'STUDIO_VISIBLE_LR5', target.name);
  assert(foundation?.riccoRoutePresent === true, 'STUDIO_RICCO_ROUTE', target.name);
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
  assert(ricco?.routePresent === true, 'STUDIO_RICCO_VISIBLE', target.name);
  assert(ricco?.contractReadyPresent === true, 'STUDIO_RICCO_READY', target.name);
  assert(ricco?.executionBlockedPresent === true, 'STUDIO_RICCO_BLOCKED', target.name);
  assert(ricco?.sourceCountPresent === true, 'STUDIO_RICCO_SOURCES', target.name);
  assert(ricco?.candidateCountPresent === true, 'STUDIO_RICCO_ZERO', target.name);
  assert(ricco?.reviewRequiredPresent === true, 'STUDIO_RICCO_REVIEW', target.name);
  assert(ricco?.totalReviewTests === 10, 'STUDIO_RICCO_TESTS', target.name);
  assert(ricco?.blockingReviewTests === 9, 'STUDIO_RICCO_BLOCKING_TESTS', target.name);
  assert(ricco?.executionBoundaryPresent === true, 'STUDIO_RICCO_EXECUTION_BOUNDARY', target.name);
  assert(ricco?.forbiddenApproval === false, 'STUDIO_RICCO_FORBIDDEN_APPROVAL', target.name);
  assert(ricco?.imageCount === 0, 'STUDIO_RICCO_IMAGES', target.name);
  assert(ricco?.canvasCount === 0, 'STUDIO_RICCO_CANVAS', target.name);
  assert(ricco?.horizontalOverflowPixels <= 2, 'STUDIO_RICCO_OVERFLOW', `${target.name}: ${ricco?.horizontalOverflowPixels}`);
}

console.log(JSON.stringify({
  status: 'pass',
  siteDir,
  expectedCommit,
  closedGate: 'LR4',
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  activeWorkPackage: 'LR5.1',
  activeWorkPackageTrackingIssue: 88,
  riccoMasterContractStatus: 'CONTRACT_READY_REVIEW_REQUIRED',
  riccoMasterCandidateSheets: 0,
  riccoMasterImageGenerationAllowedNow: false,
  riccoMasterApproved: false,
  dashboardTargets: runtime.targets.length,
  studioTargets: studioRuntime.targets.length
}, null, 2));
