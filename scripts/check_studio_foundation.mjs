import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

for (const path of [
  'studio-app/package.json','studio-app/package-lock.json','studio-app/tsconfig.json','studio-app/vite.config.ts','studio-app/index.html',
  'studio-app/src/main.tsx','studio-app/src/vite-env.d.ts','studio-app/src/App.tsx','studio-app/src/ProductionLoop.tsx','studio-app/src/production-loop.mjs','studio-app/src/styles.css','studio-app/tests/browser-smoke.mjs',
  'project/studio-foundation-inventory.json','project/studio-foundation-status.json','project/studio-foundation-closure.json','project/lr3-production-loop-closure.json','project/truth-state.json',
  'docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md','docs/LR3_MINIMAL_PRODUCTION_LOOP.md'
]) await access(new URL(path, root));

const [inventory, status, closure, loopClosure, truth, pkg, app, vite, smoke] = await Promise.all([
  json('project/studio-foundation-inventory.json'),
  json('project/studio-foundation-status.json'),
  json('project/studio-foundation-closure.json'),
  json('project/lr3-production-loop-closure.json'),
  json('project/truth-state.json'),
  json('studio-app/package.json'),
  read('studio-app/src/App.tsx'),
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
if (loopClosure.nextGate.id !== 'LR4' || loopClosure.nextGate.trackingIssue !== 76) throw new Error('LR3 did not hand off to LR4.');

if (truth.trackingIssue !== 76 || truth.nextSequence?.find((item) => item.id === 'LR2')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR3')?.status !== 'done' || truth.nextSequence?.find((item) => item.id === 'LR4')?.status !== 'active_recovery_gate') throw new Error('Truth state is not on closed LR3 and active LR4.');
if (pkg.name !== 'comic-factory' || pkg.scripts.build !== 'tsc -b && vite build') throw new Error('Archived build contract was not preserved.');
for (const dependency of ['react', 'react-dom', 'typescript', 'vite', '@vitejs/plugin-react']) if (!pkg.dependencies[dependency]) throw new Error(`Missing foundation dependency: ${dependency}`);
if (!vite.includes("base: './'")) throw new Error('Vite base must stay relative for the /studio/ Pages route.');
for (const marker of ['data-testid="studio-foundation"', 'lr3-production-loop-closure.json', 'LR3 GESCHLOSSEN', 'LR3 PUBLICLY VERIFIED', 'DELETE + RESTORE PASS', 'LR4', 'Issue #76', 'Selected-Pilot-Fire-Test noch offen', 'ProductionLoop']) if (!app.includes(marker)) throw new Error(`Studio app marker missing: ${marker}`);
for (const marker of ['lr3ClosedPresent', 'lr4ActivePresent', 'stateRemoved', 'packageRetained', 'selectedPilotFireTestPassed: false']) if (!smoke.includes(marker)) throw new Error(`Studio browser proof marker missing: ${marker}`);
for (const forbidden of ['RiccoStudio', 'RiccoPromptQueue', 'RiccoAssetImport', 'RiccoImageReview', 'RiccoPackage', 'RiccoRestore', 'ComfyUI']) if (app.includes(forbidden)) throw new Error(`Legacy archive module leaked into the current Studio: ${forbidden}`);

let distVerified = false;
try {
  const distIndex = await read('studio-app/dist/index.html');
  if (!distIndex.includes('<div id="root"></div>') || !/assets\/.+\.js/.test(distIndex)) throw new Error('Built studio index is invalid.');
  distVerified = true;
} catch (error) {
  if (process.argv.includes('--require-dist')) throw error;
}

console.log(JSON.stringify({status:'pass',repository:inventory.repository,closedGate:'LR3',activeGate:'LR4',trackingIssue:76,archiveCommit:inventory.archive.commit,productionReady:false,productionLoopRestored:true,selectedPilotFireTestPassed:false,distVerified}));
