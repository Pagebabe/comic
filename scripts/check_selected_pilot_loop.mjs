import { readFile } from 'node:fs/promises';
import {
  DETAIL_REVIEW_STATUS,
  SELECTED_PILOT_SOURCES,
  applySelectedPilotLettering,
  createSelectedPilotPackage,
  createSelectedPilotState,
  importSelectedPilotMetadata,
  markSelectedPilotRestorePassed,
  restoreSelectedPilotPackage,
  reviewSelectedPilotForTransport,
  runSelectedPilotQa,
  selectedPilotStationMap,
  serializeSelectedPilotPackage
} from '../studio-app/src/selected-pilot-loop.mjs';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function allReviewRequired(state) {
  const values = [
    ...Object.values(state.detailsStatus),
    ...state.panels.flatMap((panel) => [panel.panelStatus, panel.timingStatus, panel.locationStatus, panel.characterStatus]),
    ...state.panels.flatMap((panel) => panel.dialogue.map((line) => line.sourceStatus))
  ];
  return values.every((value) => value === DETAIL_REVIEW_STATUS);
}

const truth = await json('project/truth-state.json');
const decision = await json('project/pilot-decision-record.json');
const inventory = await json('project/lr4-selected-pilot-source-inventory.json');
const closure = await json('project/lr4-selected-pilot-closure.json');

assert(truth.trackingIssue === 82, 'Truth state must keep LR5 Issue #82 active.');
assert(truth.nextSequence.find((item) => item.id === 'LR4')?.status === 'done', 'LR4 must remain closed.');
assert(truth.nextSequence.find((item) => item.id === 'LR5')?.status === 'active_recovery_gate', 'LR5 must remain the active recovery gate.');
assert(decision.selectedCandidateId === 'pilot-das-zimmer', 'Human decision must select pilot-das-zimmer.');
assert(inventory.gate === 'LR4' && inventory.trackingIssue === 76, 'LR4 inventory identity mismatch.');
assert(inventory.status === 'source_inventory_complete_package_pending', 'Historical source inventory status drifted.');
assert(inventory.sources.length === 7, 'LR4 requires seven pinned source files.');
assert(JSON.stringify(inventory.sources.map(({ path, blob }) => ({ path, blob }))) === JSON.stringify(SELECTED_PILOT_SOURCES.map(({ path, blob }) => ({ path, blob }))), 'Pinned source paths or blobs differ from the executable contract.');
assert(closure.status === 'closed_verified' && closure.implementedBy.pullRequest === 81 && closure.implementedBy.ciRun === 29152706460 && closure.implementedBy.mergeCommit === '63021f49152dee7375578537be13dafd65685391' && closure.publicProof.pagesRun === 29152807415, 'LR4 closure chain drifted.');

let state = createSelectedPilotState();
state = importSelectedPilotMetadata(state);
state = reviewSelectedPilotForTransport(state);
state = runSelectedPilotQa(state);
state = applySelectedPilotLettering(state);
const firstPackage = await createSelectedPilotPackage(state);
const secondPackage = await createSelectedPilotPackage(state);

const storage = new Map();
storage.set('state', JSON.stringify(firstPackage.state));
storage.set('package', serializeSelectedPilotPackage(firstPackage));
assert(storage.has('state'), 'Selected-pilot state was not written before deletion check.');
storage.delete('state');
assert(!storage.has('state'), 'Selected-pilot state was not actually deleted.');
assert(storage.has('package'), 'Selected-pilot package must survive state deletion.');

const restore = await restoreSelectedPilotPackage(storage.get('package'));
state = markSelectedPilotRestorePassed(restore.state, restore);
const stations = selectedPilotStationMap(state);

assert(firstPackage.packageHash === secondPackage.packageHash, 'SelectedPilotEpisodePackage is not deterministic.');
assert(firstPackage.stateHash === secondPackage.stateHash, 'Selected-pilot state hash is not deterministic.');
assert(firstPackage.stateHash === restore.restoredStateHash && restore.match === true, 'Selected-pilot restore hash mismatch.');
assert(Object.keys(stations).length === 9 && Object.values(stations).every((status) => status === 'passed'), 'Not all nine LR4 stations passed.');
assert(state.panels.length === 8, 'LR4 package must contain exactly eight candidate panels.');
assert(state.qa.candidateDurationSeconds === 45.5, 'LR4 candidate duration must remain 45.5 seconds.');
assert(state.qa.dialogueCueCount === 10, 'LR4 package must contain ten dialogue candidates.');
assert(state.assets.length === 8 && state.assets.every((asset) => asset.containsImage === false && asset.mediaByteLength === 0), 'LR4 imported image bytes.');
assert(state.assets.every((asset) => asset.externalExecution === false), 'LR4 used external execution.');
assert(allReviewRequired(state), 'LR4 changed a candidate detail away from REVIEW_REQUIRED.');
assert(Object.values(state.creativeApprovals).every((value) => value === false), 'LR4 granted a creative approval.');
assert(firstPackage.stateHash === closure.proof.stateHash, 'Current deterministic LR4 state hash no longer matches the public closure.');
assert(firstPackage.packageHash === closure.proof.packageHash, 'Current deterministic LR4 package hash no longer matches the public closure.');

console.log(JSON.stringify({
  status: 'pass',
  gate: 'LR4',
  closureStatus: closure.status,
  trackingIssue: 76,
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  selectedPilot: state.selectedPilot.id,
  stationsPassed: 9,
  panelCount: state.panels.length,
  dialogueCueCount: state.qa.dialogueCueCount,
  candidateDurationSeconds: state.qa.candidateDurationSeconds,
  stateActuallyDeleted: true,
  deleteRestoreHashMatch: restore.match,
  stateHash: firstPackage.stateHash,
  packageHash: firstPackage.packageHash,
  detailsStatus: DETAIL_REVIEW_STATUS,
  imageBytesUsed: false,
  externalExecutionUsed: false,
  creativeApprovalGranted: false,
  lr4Closed: true,
  characterMastersApproved: 0,
  locationMastersApproved: 0,
  voiceMastersApproved: 0
}, null, 2));
