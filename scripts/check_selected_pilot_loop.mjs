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

assert(truth.trackingIssue === 76, 'Truth state must keep LR4 Issue #76 active.');
assert(truth.nextSequence.find((item) => item.id === 'LR4')?.status === 'active_recovery_gate', 'LR4 must remain the active recovery gate.');
assert(truth.nextSequence.find((item) => item.id === 'LR5')?.status === 'blocked_by_lr4', 'LR5 must remain blocked by LR4.');
assert(decision.selectedCandidateId === 'pilot-das-zimmer', 'Human decision must select pilot-das-zimmer.');
assert(inventory.gate === 'LR4' && inventory.trackingIssue === 76, 'LR4 inventory identity mismatch.');
assert(inventory.status === 'source_inventory_complete_package_pending', 'Inventory must not claim LR4 closure.');
assert(inventory.sources.length === 7, 'LR4 requires seven pinned source files.');
assert(JSON.stringify(inventory.sources.map(({ path, blob }) => ({ path, blob }))) === JSON.stringify(SELECTED_PILOT_SOURCES.map(({ path, blob }) => ({ path, blob }))), 'Pinned source paths or blobs differ from the executable contract.');

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

console.log(JSON.stringify({
  status: 'pass',
  gate: 'LR4',
  trackingIssue: 76,
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
  lr4Closed: false
}, null, 2));
