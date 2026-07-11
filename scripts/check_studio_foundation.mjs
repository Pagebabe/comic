import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

for (const path of [
  'studio-app/package.json','studio-app/package-lock.json','studio-app/tsconfig.json','studio-app/vite.config.ts','studio-app/index.html',
  'studio-app/src/main.tsx','studio-app/src/vite-env.d.ts','studio-app/src/App.tsx','studio-app/src/ProductionLoop.tsx','studio-app/src/production-loop.mjs','studio-app/src/SelectedPilotLoop.tsx','studio-app/src/selected-pilot-loop.mjs','studio-app/src/styles.css','studio-app/tests/browser-smoke.mjs',
  'project/studio-foundation-inventory.json','project/studio-foundation-status.json','project/studio-foundation-closure.json','project/lr3-production-loop-closure.json','project/lr4-selected-pilot-source-inventory.json','project/lr4-selected-pilot-closure.json','project/truth-state.json',
  'docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md','docs/LR3_MINIMAL_PRODUCTION_LOOP.md','docs/LR4_SELECTED_PILOT_FIRE_TEST.md'
]) await access(new URL(path, root));

const [inventory, status, closure, loopClosure, pilotInventory, pilotClosure, truth, pkg, app, pilotView, vite, smoke] = await Promise.all([
  json('project/studio-foundation-inventory.json'),
  json('project/studio-foundation-status.json'),
  json('project/studio-foundation-closure.json'),
  json('project/lr3-production-loop-closure.json'),
  json('project/lr4-selected-pilot-source-inventory.json'),
  json('project/lr4-selected-pilot-closure.json'),
  json('project/truth-state.json'),
  json('studio-app/package.json'),
  read('studio-app/src/App.tsx'),
  read('studio-app/src/SelectedPilotLoop.tsx'),
  read('studio-app/vite.config.ts'),
  read('studio-app/tests/browser-smoke.mjs')
]);

if (inventory.repository !== 'Pagebabe/comic' || inventory.gate !== 'LR2' || inventory.trackingIssue !== 45) throw new Error('Studio inventory scope drifted.');
if (inventory.archive.branch !== 'archive/legacy-comic-2026-07-10' || inventory.archive.commit !== '7266cf8df99ad811904933189666bbb827bd3ad1') throw new Error('Archive source drifted.');
if (inventory.reviewedSources.find((entry) => entry.path === 'package-lock.json')?.decision !== 'reused_byte_for_byte') throw new Error('Archived lockfile provenance missing.');
if (inventory.reviewedSources.find((entry) => entry.path === 'package-lock.json')?.blob !== '89a83eabd5531903b1cb062c98bc00153ce25205') throw new Error('Archived lockfile blob changed.');
if (!inventory.explicitlyExcluded.includes('Package Export') || !inventory.explicitlyExcluded.includes('Growth OS and publishing automation')) throw new Error('LR2 exclusions are incomplete.');

if (status.status !== 'public_build_verified_closed' || status.evidencePacketStatus !== 'PROVEN' || status.gate !== 'LR2' || status.trackingIssue !== 45) throw new Error('Historical Foundation status is not closed and proven.');
if (status.publicProof?.pagesRun !== 29148728164 || status.publicProof?.mergeCommit !== '18d0c34b81db781305941c0e9f34c308ac5c8b76') throw new Error('Foundation public proof drifted.');
if (status.nextGate?.id !== 'LR3' || status.nextGate?.trackingIssue !== 60) throw new Error('Historical Foundation handoff drifted.');
if (status.selectedPilot.id !== 'pilot-das-zimmer' || status.productionReady !== false || status.productionLoopRestored !== false) throw new Error('Historical LR2 boundary drifted.');
if (status.automaticCanonApproval !== false || status.automaticVisualApproval !== false || status.automaticVoiceApproval !== false) throw new Error('Automatic creative approval was enabled.');

if (closure.status !== 'closed_verified' || closure.pullRequest.number !== 59 || closure.pullRequest.ciRun !== 29148650720 || closure.deployment.runId !== 29148728164 || closure.deployment.publicVerificationPassed !== true) throw new Error('LR2 closure chain is incomplete.');
if (closure.visibleCountercheck.desktop.horizontalOverflowPixels !== 0 || closure.visibleCountercheck.mobile.horizontalOverflowPixels !== 0) throw new Error('LR2 visible overflow proof drifted.');
if (closure.nextGate?.trackingIssue !== 60) throw new Error('LR2 closure next gate drifted.');

if (loopClosure.status !== 'closed_verified' || loopClosure.implementedBy.pullRequest !== 74 || loopClosure.implementedBy.ciRun !== 29150833651 || loopClosure.publicProof.pagesRun !== 29150875221 || loopClosure.publicProof.publicVerificationPassed !== true) throw new Error('LR3 closure chain is incomplete.');
if (loopClosure.proof.stationsPassed !== 9 || !loopClosure.proof.deleteCountercheckPassed || !loopClosure.proof.deleteRestoreHashMatch || loopClosure.proof.imageBytesUsed || loopClosure.proof.externalExecutionUsed || loopClosure.proof.creativeApprovalGranted) throw new Error('LR3 technical proof boundary drifted.');
if (loopClosure.nextGate.id !== 'LR4' || loopClosure.nextGate.trackingIssue !== 76) throw new Error('LR3 did not preserve its historical LR4 handoff.');

if (pilotInventory.gate !== 'LR4' || pilotInventory.trackingIssue !== 76 || pilotInventory.status !== 'source_inventory_complete_package_pending' || pilotInventory.selectedPilot?.id !== 'pilot-das-zimmer' || pilotInventory.sources?.length !== 7) throw new Error('LR4 historical source inventory drifted.');
if (pilotInventory.implementation?.pullRequest !== 81 || pilotInventory.implementation?.closureClaim !== false) throw new Error('LR4 implementation boundary drifted.');
if (pilotInventory.sources.some((source) => source.creativeApproval !== false)) throw new Error('LR4 source inventory granted a creative approval.');

if (pilotClosure.status !== 'closed_verified' || pilotClosure.implementedBy?.pullRequest !== 81 || pilotClosure.implementedBy?.ciRun !== 29152706460 || pilotClosure.implementedBy?.mergeCommit !== '63021f49152dee7375578537be13dafd65685391' || pilotClosure.publicProof?.pagesRun !== 29152807415 || pilotClosure.publicProof?.publicVerificationPassed !== true) throw new Error('LR4 closure chain is incomplete.');
if (pilotClosure.proof?.stationsPassed !== 9 || pilotClosure.proof?.stateActuallyDeleted !== true || pilotClosure.proof?.deleteRestoreHashMatch !== true || pilotClosure.proof?.imageBytesUsed !== false || pilotClosure.proof?.externalExecutionUsed !== false || pilotClosure.proof?.creativeApprovalGranted !== false || pilotClosure.nextGate?.trackingIssue !== 82) throw new Error('LR4 closure boundary or LR5 handoff drifted.');

if (truth.trackingIssue !== 82 || truth.nextSequence?.find((item) => item.id === 'LR3')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR4')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR5')?.status !== 'active_recovery_gate') throw new Error('Truth state is not on closed LR4 and active LR5.');
if (pkg.name !== 'comic-factory' || pkg.scripts.build !== 'tsc -b && vite build') throw new Error('Archived build contract was not preserved.');
for (const dependency of ['react', 'react-dom', 'typescript', 'vite', '@vitejs/plugin-react']) if (!pkg.dependencies[dependency]) throw new Error(`Missing foundation dependency: ${dependency}`);
if (!vite.includes("base: './'")) throw new Error('Vite base must stay relative for the /studio/ Pages route.');
for (const marker of ['data-testid="studio-foundation"', 'lr3-production-loop-closure.json', 'lr4-selected-pilot-closure.json', 'LR4 GESCHLOSSEN', 'LR4 PUBLICLY VERIFIED', 'SELECTED PILOT HASH MATCH', 'LR5', 'activeGate?.trackingIssue || truth.trackingIssue', 'href="#pilot-fire-test"', 'SelectedPilotLoop', 'Visual-, Set- und Voice-Locks', 'ProductionLoop']) if (!app.includes(marker)) throw new Error(`Studio app marker missing: ${marker}`);
for (const marker of ['data-testid="selected-pilot-loop"', 'REVIEW_REQUIRED', 'pilot-import', 'pilot-delete', 'pilot-restore', 'SelectedPilotEpisodePackage']) if (!pilotView.includes(marker)) throw new Error(`Selected-pilot Studio marker missing: ${marker}`);
for (const marker of ['lr4ClosedPresent', 'lr5ActivePresent', 'pilotDeletionChecks', 'pilotLoopChecks', 'selectedPilotFireTestCandidatePassed: true', 'selectedPilotFireTestPassed: true', 'characterMastersApproved: 0']) if (!smoke.includes(marker)) throw new Error(`Studio browser proof marker missing: ${marker}`);
for (const forbidden of ['RiccoStudio', 'RiccoPromptQueue', 'RiccoAssetImport', 'RiccoImageReview', 'RiccoPackage', 'RiccoRestore', 'ComfyUI']) if (app.includes(forbidden)) throw new Error(`Legacy archive module leaked into the current Studio: ${forbidden}`);

let distVerified = false;
try {
  const distIndex = await read('studio-app/dist/index.html');
  if (!distIndex.includes('<div id="root"></div>') || !/assets\/.+\.js/.test(distIndex)) throw new Error('Built studio index is invalid.');
  distVerified = true;
} catch (error) {
  if (process.argv.includes('--require-dist')) throw error;
}

console.log(JSON.stringify({status:'pass',repository:inventory.repository,closedGate:'LR4',activeGate:'LR5',trackingIssue:82,archiveCommit:inventory.archive.commit,productionReady:false,productionLoopRestored:true,selectedPilotFireTestCandidatePassed:true,selectedPilotFireTestPassed:true,characterMastersApproved:0,locationMastersApproved:0,voiceMastersApproved:0,distVerified}));
