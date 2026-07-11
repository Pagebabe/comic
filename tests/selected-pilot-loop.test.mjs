import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sha256 } from '../studio-app/src/production-loop.mjs';
import {
  DETAIL_REVIEW_STATUS,
  SELECTED_PILOT_PACKAGE_STORAGE_KEY,
  SELECTED_PILOT_PANELS,
  SELECTED_PILOT_SOURCES,
  SELECTED_PILOT_STORAGE_KEY,
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

async function runSelectedPilotLoop() {
  let state = createSelectedPilotState();
  state = importSelectedPilotMetadata(state);
  state = reviewSelectedPilotForTransport(state);
  state = runSelectedPilotQa(state);
  state = applySelectedPilotLettering(state);
  const pkg = await createSelectedPilotPackage(state);
  return { state, pkg };
}

function allReviewRequired(state) {
  const detailStatuses = Object.values(state.detailsStatus);
  const panelStatuses = state.panels.flatMap((panel) => [panel.panelStatus, panel.timingStatus, panel.locationStatus, panel.characterStatus]);
  const dialogueStatuses = state.panels.flatMap((panel) => panel.dialogue.map((line) => line.sourceStatus));
  return [...detailStatuses, ...panelStatuses, ...dialogueStatuses].every((status) => status === DETAIL_REVIEW_STATUS);
}

test('LR4 binds Das Zimmer to exact sources without granting creative approval', () => {
  const state = createSelectedPilotState();
  const duration = state.panels.reduce((sum, panel) => sum + panel.durationSeconds, 0);
  const dialogue = state.panels.flatMap((panel) => panel.dialogue);

  assert.equal(state.selectedPilot.id, 'pilot-das-zimmer');
  assert.equal(state.selectedPilot.title, 'Das Zimmer');
  assert.equal(state.stations.length, 9);
  assert.equal(state.sourceRefs.length, 7);
  assert.deepEqual(state.sourceRefs, SELECTED_PILOT_SOURCES);
  assert.equal(state.panels.length, 8);
  assert.deepEqual(state.panels, SELECTED_PILOT_PANELS);
  assert.equal(state.promptQueue.length, 8);
  assert.equal(duration, 45.5);
  assert.equal(dialogue.length, 10);
  assert.ok(dialogue.every((line) => line.speakerId !== 'char_don_miau'));
  assert.ok(allReviewRequired(state));
  assert.ok(Object.values(state.creativeApprovals).every((value) => value === false));
});

test('selected pilot package survives actual state deletion and hash-identical restore', async () => {
  const first = await runSelectedPilotLoop();
  const second = await runSelectedPilotLoop();
  const storage = new Map();

  storage.set(SELECTED_PILOT_STORAGE_KEY, JSON.stringify(first.pkg.state));
  storage.set(SELECTED_PILOT_PACKAGE_STORAGE_KEY, serializeSelectedPilotPackage(first.pkg));
  assert.equal(storage.has(SELECTED_PILOT_STORAGE_KEY), true);

  storage.delete(SELECTED_PILOT_STORAGE_KEY);
  assert.equal(storage.has(SELECTED_PILOT_STORAGE_KEY), false);
  assert.equal(storage.has(SELECTED_PILOT_PACKAGE_STORAGE_KEY), true);

  const restored = await restoreSelectedPilotPackage(storage.get(SELECTED_PILOT_PACKAGE_STORAGE_KEY));
  storage.set(SELECTED_PILOT_STORAGE_KEY, JSON.stringify(restored.state));
  const completed = markSelectedPilotRestorePassed(restored.state, restored);
  const stations = selectedPilotStationMap(completed);

  assert.equal(first.pkg.packageType, 'comic-factory-selected-pilot-episode-package');
  assert.equal(first.pkg.productionStatus, 'selected_pilot_fire_test_candidate_only');
  assert.equal(first.pkg.detailStatus, DETAIL_REVIEW_STATUS);
  assert.equal(first.pkg.stateHash, restored.restoredStateHash);
  assert.equal(restored.match, true);
  assert.equal(first.pkg.packageHash, second.pkg.packageHash);
  assert.equal(first.pkg.stateHash, second.pkg.stateHash);
  assert.equal(completed.assets.length, 8);
  assert.ok(completed.assets.every((asset) => asset.containsImage === false && asset.mediaByteLength === 0));
  assert.ok(completed.assets.every((asset) => asset.externalExecution === false));
  assert.equal(completed.lettering.overlays.length, 10);
  assert.ok(completed.lettering.overlays.every((overlay) => overlay.dialogueApproval === false));
  assert.ok(allReviewRequired(completed));
  assert.ok(Object.values(stations).every((status) => status === 'passed'));
  assert.ok(Object.values(completed.creativeApprovals).every((value) => value === false));
});

test('LR4 station order is enforced', async () => {
  const initial = createSelectedPilotState();
  assert.throws(() => reviewSelectedPilotForTransport(initial), /eight panel metadata assets/i);
  assert.throws(() => runSelectedPilotQa(initial), /technical QA failed/i);
  assert.throws(() => applySelectedPilotLettering(initial), /QA must pass/i);
  await assert.rejects(() => createSelectedPilotPackage(initial), /lettering must be applied/i);

  const imported = importSelectedPilotMetadata(initial);
  assert.throws(() => importSelectedPilotMetadata(imported), /already imported/i);
});

test('tampered package and forged creative approval are rejected', async () => {
  const { pkg } = await runSelectedPilotLoop();
  const tampered = structuredClone(pkg);
  tampered.state.panels[0].durationSeconds = 99;
  await assert.rejects(() => restoreSelectedPilotPackage(tampered), /hash mismatch/i);

  const forged = structuredClone(pkg);
  forged.state.creativeApprovals.visualMaster = true;
  forged.stateHash = await sha256(forged.state);
  const { packageHash: ignored, ...unsigned } = forged;
  forged.packageHash = await sha256(unsigned);
  await assert.rejects(() => restoreSelectedPilotPackage(forged), /creative approval/i);

  const approvedDialogue = structuredClone(pkg);
  approvedDialogue.state.panels[1].dialogue[0].sourceStatus = 'APPROVED';
  approvedDialogue.stateHash = await sha256(approvedDialogue.state);
  const { packageHash: ignoredAgain, ...unsignedDialogue } = approvedDialogue;
  approvedDialogue.packageHash = await sha256(unsignedDialogue);
  await assert.rejects(() => restoreSelectedPilotPackage(approvedDialogue), /approve selected-pilot details/i);
});

test('LR4 inventory pins all seven sources and keeps every production claim open', async () => {
  const inventory = await json('project/lr4-selected-pilot-source-inventory.json');
  assert.equal(inventory.repository, 'Pagebabe/comic');
  assert.equal(inventory.gate, 'LR4');
  assert.equal(inventory.trackingIssue, 76);
  assert.equal(inventory.selectedPilot.id, 'pilot-das-zimmer');
  assert.equal(inventory.sources.length, 7);
  assert.deepEqual(
    inventory.sources.map(({ path, blob }) => ({ path, blob })),
    SELECTED_PILOT_SOURCES.map(({ path, blob }) => ({ path, blob }))
  );
  assert.deepEqual(inventory.candidateCounts, {
    characters: 4,
    locations: 4,
    panels: 8,
    dialogueCues: 10,
    targetDurationSeconds: 45.5,
    visualMasters: 0,
    voiceMasters: 0,
    approvedPanels: 0,
    finishedEpisodes: 0
  });
  assert.ok(inventory.sources.every((source) => source.creativeApproval === false));
  assert.ok(inventory.forbiddenClaims.includes('episode finished'));
  assert.ok(inventory.forbiddenClaims.includes('production ready'));
});
