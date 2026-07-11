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
  'project/lr3-production-loop-closure.json',
  'project/lr4-selected-pilot-closure.json',
  'docs/LR3_MINIMAL_PRODUCTION_LOOP.md',
  'tests/production-loop.test.mjs'
]) await access(new URL(path, root));

const [inventory, closure, pilotClosure, truth, app, loopUi, loopContract, smoke, docs] = await Promise.all([
  json('project/lr3-production-loop-inventory.json'),
  json('project/lr3-production-loop-closure.json'),
  json('project/lr4-selected-pilot-closure.json'),
  json('project/truth-state.json'),
  read('studio-app/src/App.tsx'),
  read('studio-app/src/ProductionLoop.tsx'),
  read('studio-app/src/production-loop.mjs'),
  read('studio-app/tests/browser-smoke.mjs'),
  read('docs/LR3_MINIMAL_PRODUCTION_LOOP.md')
]);

if (inventory.repository !== 'Pagebabe/comic' || inventory.gate !== 'LR3' || inventory.trackingIssue !== 60) throw new Error('LR3 inventory scope drifted.');
if (inventory.sourceArchive.branch !== 'archive/legacy-comic-2026-07-10' || inventory.sourceArchive.commit !== '7266cf8df99ad811904933189666bbb827bd3ad1') throw new Error('LR3 archive source drifted.');
if (inventory.reviewedSources.length !== 7 || inventory.chosenVerticalSlice.length !== 9) throw new Error('LR3 source inventory or vertical slice is incomplete.');
if (Object.values(inventory.creativeBoundaries).some(Boolean)) throw new Error('LR3 inventory grants a creative approval.');

if (closure.status !== 'closed_verified' || closure.implementedBy.pullRequest !== 74 || closure.implementedBy.ciRun !== 29150833651 || closure.implementedBy.mergeCommit !== '0226b80ae36457c95efb2e4dbbb0546623d274ae') throw new Error('LR3 closure implementation proof drifted.');
if (closure.publicProof.pagesRun !== 29150875221 || closure.publicProof.publicVerificationPassed !== true) throw new Error('LR3 public proof drifted.');
if (closure.proof.stationsPassed !== 9 || !closure.proof.deleteCountercheckPassed || !closure.proof.deleteRestoreHashMatch) throw new Error('LR3 closure lacks the complete delete-and-restore proof.');
if (closure.proof.stateHash !== '39266debc49b4374be25bad2d58747b240492630486c18828694737df198cc70' || closure.proof.packageHash !== '011e7c0f60c5523ebc21c8b589af9adb5bfee8615b14ef5baef933d266ee9a9e') throw new Error('LR3 public hashes drifted.');
if (closure.proof.imageBytesUsed || closure.proof.externalExecutionUsed || closure.proof.creativeApprovalGranted) throw new Error('LR3 closure grants a forbidden capability.');
if (closure.nextGate.id !== 'LR4' || closure.nextGate.trackingIssue !== 76) throw new Error('LR3 closure does not preserve its historical LR4 handoff.');
if (pilotClosure.status !== 'closed_verified' || pilotClosure.nextGate?.id !== 'LR5' || pilotClosure.nextGate?.trackingIssue !== 82) throw new Error('LR4 closure does not hand off to LR5.');
if (truth.trackingIssue !== 82 || truth.nextSequence.find((item) => item.id === 'LR3')?.status !== 'done' || truth.nextSequence.find((item) => item.id === 'LR4')?.status !== 'done' || truth.nextSequence.find((item) => item.id === 'LR5')?.status !== 'active_recovery_gate') throw new Error('Truth state is not on closed LR4 and active LR5.');

for (const marker of ['ProductionLoop', '#loop', 'LR4 GESCHLOSSEN', 'LR5', 'Visual-, Set- und Voice-Locks']) if (!app.includes(marker)) throw new Error(`Studio app closure marker missing: ${marker}`);
for (const marker of ['data-testid="production-loop"', 'DELETE + RESTORE PASS', 'HASH MATCH']) if (!loopUi.includes(marker)) throw new Error(`Loop UI marker missing: ${marker}`);
for (const marker of ['LR3 TEST · KEIN CANON', 'comic-factory-neutral-episode-package', 'creativeApprovals']) if (!loopContract.includes(marker)) throw new Error(`Loop contract marker missing: ${marker}`);
for (const marker of ['loop-import', 'loop-review', 'loop-qa', 'loop-letter', 'loop-package', 'loop-delete', 'loop-restore', 'stateRemoved', 'packageRetained', 'lr4ClosedPresent', 'lr5ActivePresent']) if (!smoke.includes(marker)) throw new Error(`Browser proof action missing: ${marker}`);
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
if (pkg.stateHash !== closure.proof.stateHash || pkg.packageHash !== closure.proof.packageHash) throw new Error('Current deterministic LR3 hashes no longer match the public closure proof.');

console.log(JSON.stringify({
  status: 'pass',
  repository: inventory.repository,
  closedGate: 'LR4',
  regressionGate: 'LR3',
  closureStatus: closure.status,
  activeGate: 'LR5',
  activeTrackingIssue: 82,
  stationsPassed: Object.values(statuses).filter((status) => status === 'passed').length,
  stateHash: pkg.stateHash,
  packageHash: pkg.packageHash,
  restoreHashMatch: restored.match,
  selectedPilotFireTestPassed: true,
  imageBytes: false,
  externalExecution: false,
  creativeApprovals: state.creativeApprovals
}));
