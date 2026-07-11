import { access, readFile } from 'node:fs/promises';
import {
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
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

for (const path of [
  'studio-app/src/production-loop.mjs',
  'studio-app/src/ProductionLoop.tsx',
  'project/lr3-production-loop-inventory.json',
  'docs/LR3_MINIMAL_PRODUCTION_LOOP.md',
  'tests/production-loop.test.mjs'
]) await access(new URL(path, root));

const [inventory, truth, app, loopUi, smoke, docs] = await Promise.all([
  json('project/lr3-production-loop-inventory.json'),
  json('project/truth-state.json'),
  read('studio-app/src/App.tsx'),
  read('studio-app/src/ProductionLoop.tsx'),
  read('studio-app/tests/browser-smoke.mjs'),
  read('docs/LR3_MINIMAL_PRODUCTION_LOOP.md')
]);

if (inventory.repository !== 'Pagebabe/comic' || inventory.gate !== 'LR3' || inventory.trackingIssue !== 60) throw new Error('LR3 inventory scope drifted.');
if (inventory.sourceArchive.branch !== 'archive/legacy-comic-2026-07-10' || inventory.sourceArchive.commit !== '7266cf8df99ad811904933189666bbb827bd3ad1') throw new Error('LR3 archive source drifted.');
if (inventory.reviewedSources.length !== 7 || inventory.chosenVerticalSlice.length !== 9) throw new Error('LR3 source inventory or vertical slice is incomplete.');
if (Object.values(inventory.creativeBoundaries).some(Boolean)) throw new Error('LR3 inventory grants a creative approval.');
if (truth.trackingIssue !== 60 || truth.nextSequence.find((item) => item.id === 'LR3')?.status !== 'active_recovery_gate') throw new Error('Truth state is not on LR3.');

for (const marker of ['ProductionLoop', '#loop', 'Produktionsloop noch nicht öffentlich bewiesen']) if (!app.includes(marker)) throw new Error(`Studio app LR3 marker missing: ${marker}`);
for (const marker of ['data-testid="production-loop"', 'DELETE + RESTORE PASS', 'HASH MATCH', 'LR3 TEST · KEIN CANON']) if (!loopUi.includes(marker)) throw new Error(`Loop UI marker missing: ${marker}`);
for (const marker of ['loop-import', 'loop-review', 'loop-qa', 'loop-letter', 'loop-package', 'loop-delete', 'loop-restore']) if (!smoke.includes(marker)) throw new Error(`Browser proof action missing: ${marker}`);
if (!docs.includes('Control → Studio → Prompt Queue → Import → Review → QA → Lettering → Package → Restore') || !docs.includes('SHA-256') || !/keine Bildbytes/i.test(docs)) throw new Error('LR3 documentation contract is incomplete.');

let state = createInitialLoopState();
state = await importSyntheticAsset(state);
state = approveTechnicalReview(state);
state = runTechnicalQa(state);
state = applyTechnicalLettering(state);
const pkg = await createEpisodePackage(state);
const restored = await restoreEpisodePackage(serializeEpisodePackage(pkg));
state = markRestorePassed(restored.state, restored);
const statuses = stationMap(state);

if (!restored.match || pkg.stateHash !== restored.restoredStateHash) throw new Error('Delete-and-restore state hash did not match.');
if (!Object.values(statuses).every((status) => status === 'passed')) throw new Error('Not all nine LR3 stations passed.');
if (state.assets.some((asset) => asset.containsImage || asset.externalExecution)) throw new Error('LR3 technical fixture contains image or external execution.');
if (Object.values(state.creativeApprovals).some(Boolean)) throw new Error('LR3 technical loop granted a creative approval.');

console.log(JSON.stringify({
  status: 'pass',
  repository: inventory.repository,
  gate: inventory.gate,
  trackingIssue: inventory.trackingIssue,
  stationsPassed: Object.values(statuses).filter((status) => status === 'passed').length,
  stateHash: pkg.stateHash,
  packageHash: pkg.packageHash,
  restoreHashMatch: restored.match,
  imageBytes: false,
  externalExecution: false,
  creativeApprovals: state.creativeApprovals
}));
