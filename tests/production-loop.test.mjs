import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  LOOP_STATIONS,
  approveTechnicalReview,
  applyTechnicalLettering,
  createEpisodePackage,
  createInitialLoopState,
  importSyntheticAsset,
  markRestorePassed,
  restoreEpisodePackage,
  runTechnicalQa,
  serializeEpisodePackage,
  stationMap
} from '../studio-app/src/production-loop.mjs';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

async function runFullTechnicalLoop() {
  let state = createInitialLoopState();
  state = await importSyntheticAsset(state);
  state = approveTechnicalReview(state);
  state = runTechnicalQa(state);
  state = applyTechnicalLettering(state);
  const pkg = await createEpisodePackage(state);
  const restored = await restoreEpisodePackage(serializeEpisodePackage(pkg));
  state = markRestorePassed(restored.state, restored);
  return { state, pkg, restored };
}

test('LR3 starts with exactly nine controlled stations and no creative approvals', () => {
  const state = createInitialLoopState();
  assert.deepEqual(state.stations.map((station) => station.label), LOOP_STATIONS.map((station) => station.label));
  assert.equal(state.stations.length, 9);
  assert.equal(state.promptQueue.length, 1);
  assert.equal(state.promptQueue[0].status, 'manual_only_no_execution');
  assert.equal(state.assets.length, 0);
  assert.ok(Object.values(state.creativeApprovals).every((value) => value === false));
});

test('full neutral loop exports, deletes conceptually and restores the identical canonical state', async () => {
  const first = await runFullTechnicalLoop();
  const second = await runFullTechnicalLoop();
  const stations = stationMap(first.state);

  assert.equal(first.pkg.packageType, 'comic-factory-neutral-episode-package');
  assert.equal(first.pkg.productionStatus, 'technical_loop_candidate_only');
  assert.equal(first.pkg.stateHash, first.restored.restoredStateHash);
  assert.equal(first.restored.match, true);
  assert.equal(first.pkg.packageHash, second.pkg.packageHash);
  assert.equal(first.pkg.stateHash, second.pkg.stateHash);
  assert.equal(first.state.assets[0].containsImage, false);
  assert.equal(first.state.assets[0].externalExecution, false);
  assert.equal(first.state.lettering.overlays[0].text, 'LR3 TEST · KEIN CANON');
  assert.equal(first.state.stations.length, 9);
  assert.ok(Object.values(stations).every((status) => status === 'passed'));
  assert.ok(Object.values(first.state.creativeApprovals).every((value) => value === false));
});

test('station order is enforced instead of politely pretending', async () => {
  const initial = createInitialLoopState();
  assert.throws(() => approveTechnicalReview(initial), /Import must pass/);
  assert.throws(() => runTechnicalQa(initial), /Technical QA failed/);
  assert.throws(() => applyTechnicalLettering(initial), /QA must pass/);
  await assert.rejects(() => createEpisodePackage(initial), /Lettering must be applied/);

  const imported = await importSyntheticAsset(initial);
  await assert.rejects(() => importSyntheticAsset(imported), /already imported/);
});

test('tampered EpisodePackage is rejected before restore', async () => {
  let state = createInitialLoopState();
  state = await importSyntheticAsset(state);
  state = approveTechnicalReview(state);
  state = runTechnicalQa(state);
  state = applyTechnicalLettering(state);
  const pkg = await createEpisodePackage(state);
  const tampered = structuredClone(pkg);
  tampered.state.assets[0].payload = 'TAMPERED';

  await assert.rejects(() => restoreEpisodePackage(tampered), /EpisodePackage hash mismatch|Restored state hash mismatch/);
});

test('inventory binds the neutral slice to exact archive sources and rejects creative approval', async () => {
  const inventory = await json('project/lr3-production-loop-inventory.json');
  assert.equal(inventory.repository, 'Pagebabe/comic');
  assert.equal(inventory.gate, 'LR3');
  assert.equal(inventory.trackingIssue, 60);
  assert.equal(inventory.sourceArchive.commit, '7266cf8df99ad811904933189666bbb827bd3ad1');
  assert.equal(inventory.reviewedSources.length, 7);
  assert.deepEqual(inventory.chosenVerticalSlice, ['Control','Studio','Prompt Queue','Import','Review','QA','Lettering','Package','Restore']);
  assert.equal(inventory.proofContract.requiredCountercheck, 'delete local state, restore from package, compare canonical state hash');
  assert.ok(Object.values(inventory.creativeBoundaries).every((value) => value === false));
  const packageSource = inventory.reviewedSources.find((entry) => entry.path === 'src/pages/RiccoPackage.tsx');
  const restoreSource = inventory.reviewedSources.find((entry) => entry.path === 'src/pages/RiccoImport.tsx');
  assert.equal(packageSource.blob, 'ae52c54b5f7863f500578512f7b960f49bb8927f');
  assert.equal(restoreSource.blob, '5d59905927e9180f1dc2b0c50f82b20f3ebed0b6');
});
