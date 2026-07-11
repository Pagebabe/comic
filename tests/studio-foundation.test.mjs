import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('LR2 inventory pins the archive source and minimal slice', async () => {
  const inventory = await json('project/studio-foundation-inventory.json');
  assert.equal(inventory.repository, 'Pagebabe/comic');
  assert.equal(inventory.gate, 'LR2');
  assert.equal(inventory.trackingIssue, 45);
  assert.equal(inventory.archive.branch, 'archive/legacy-comic-2026-07-10');
  assert.equal(inventory.archive.commit, '7266cf8df99ad811904933189666bbb827bd3ad1');
  assert.equal(inventory.reviewedSources.find((entry) => entry.path === 'package-lock.json').blob, '89a83eabd5531903b1cb062c98bc00153ce25205');
  assert.equal(inventory.reviewedSources.find((entry) => entry.path === 'package-lock.json').decision, 'reused_byte_for_byte');
  assert.ok(inventory.explicitlyExcluded.includes('Ricco Studio production workflow'));
  assert.ok(inventory.explicitlyExcluded.includes('Package Export'));
  assert.ok(inventory.explicitlyExcluded.includes('Growth OS and publishing automation'));
});

test('LR2 closure remains a bounded foundation proof', async () => {
  const closure = await json('project/studio-foundation-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.gate, 'LR2');
  assert.equal(closure.trackingIssue, 45);
  assert.equal(closure.pullRequest.number, 59);
  assert.equal(closure.pullRequest.verifiedHead, '23d2a120de06c90697f23c62709fdb910a10f1c3');
  assert.equal(closure.pullRequest.ciRun, 29148650720);
  assert.equal(closure.pullRequest.ciConclusion, 'success');
  assert.equal(closure.pullRequest.mergeCommit, '18d0c34b81db781305941c0e9f34c308ac5c8b76');
  assert.equal(closure.deployment.runId, 29148728164);
  assert.equal(closure.deployment.conclusion, 'success');
  assert.equal(closure.deployment.publicVerificationPassed, true);
  assert.equal(closure.visibleCountercheck.desktop.horizontalOverflowPixels, 0);
  assert.equal(closure.visibleCountercheck.mobile.horizontalOverflowPixels, 0);
  assert.equal(closure.visibleCountercheck.desktop.imageCount, 0);
  assert.equal(closure.visibleCountercheck.mobile.imageCount, 0);
  assert.equal(closure.nextGate.id, 'LR3');
  assert.equal(closure.nextGate.trackingIssue, 60);
});

test('historical LR2 status remains preserved as its own bounded artifact', async () => {
  const status = await json('project/studio-foundation-status.json');
  assert.equal(status.status, 'public_build_verified_closed');
  assert.equal(status.evidencePacketStatus, 'PROVEN');
  assert.equal(status.route, '/studio/');
  assert.equal(status.selectedPilot.id, 'pilot-das-zimmer');
  assert.equal(status.publicProof.pagesRun, 29148728164);
  assert.equal(status.productionReady, false);
  assert.equal(status.productionLoopRestored, false);
  assert.equal(status.automaticCanonApproval, false);
  assert.equal(status.automaticVisualApproval, false);
  assert.equal(status.automaticVoiceApproval, false);
  assert.equal(status.nextGate.id, 'LR3');
  assert.equal(status.nextGate.trackingIssue, 60);
  assert.ok(status.notRestored.includes('Package Export and Restore'));
});

test('studio app shows closed LR4 and active truth-driven LR5.1 route', async () => {
  const [app, main, vite, pkg] = await Promise.all([
    read('studio-app/src/App.tsx'),
    read('studio-app/src/main.tsx'),
    read('studio-app/vite.config.ts'),
    json('studio-app/package.json')
  ]);
  assert.match(app, /data-testid="studio-foundation"/);
  assert.match(app, /lr3-production-loop-closure\.json/);
  assert.match(app, /lr4-selected-pilot-closure\.json/);
  assert.match(app, /LR4 GESCHLOSSEN/);
  assert.match(app, /LR4 PUBLICLY VERIFIED/);
  assert.match(app, /SELECTED PILOT HASH MATCH/);
  assert.match(app, /LR5/);
  assert.match(app, /activeGate\?\.trackingIssue \|\| truth\.trackingIssue/);
  assert.match(app, /href="#pilot-fire-test"/);
  assert.match(app, /href="#lr5-ricco"/);
  assert.match(app, /SelectedPilotLoop/);
  assert.match(app, /RiccoMasterReview/);
  assert.match(app, /LR5\.1 Ricco/);
  assert.match(app, /Visual-, Set- und Voice-Locks/);
  assert.match(app, /Character-Master 0\/4/);
  assert.match(app, /Location-Master 0\/4/);
  assert.match(app, /Stimmen 0\/3/);
  assert.match(app, /ProductionLoop/);
  assert.match(main, /React\.StrictMode/);
  assert.match(vite, /base: '\.\/'/);
  assert.equal(pkg.scripts.build, 'tsc -b && vite build');
  for (const forbidden of ['RiccoStudio','RiccoPromptQueue','RiccoAssetImport','RiccoImageReview','RiccoPackage','RiccoRestore']) assert.doesNotMatch(app, new RegExp(forbidden));
});

test('LR5.1 Ricco route is a visible zero-image review contract', async () => {
  const [view, inventory, contract] = await Promise.all([
    read('studio-app/src/RiccoMasterReview.tsx'),
    json('project/lr5-ricco-master-source-inventory.json'),
    json('project/lr5-ricco-master-contract.json')
  ]);
  assert.equal(inventory.trackingIssue, 88);
  assert.equal(inventory.sources.length, 7);
  assert.equal(inventory.resolvedConflicts.length, 5);
  assert.equal(inventory.candidateBoundary.maximumCandidateSheets, 1);
  assert.equal(inventory.candidateBoundary.currentCandidateSheets, 0);
  assert.equal(inventory.candidateBoundary.imageBytesPresent, false);
  assert.equal(contract.status, 'CONTRACT_READY_REVIEW_REQUIRED');
  assert.equal(contract.executionGate.imageGenerationAllowedNow, false);
  assert.equal(contract.executionGate.batchGenerationAllowed, false);
  assert.equal(contract.executionGate.loraTrainingAllowed, false);
  assert.equal(contract.executionGate.automaticMasterAssignmentAllowed, false);
  assert.equal(contract.currentState.candidateSheets, 0);
  assert.equal(contract.currentState.masterApproved, false);
  assert.match(view, /data-testid="ricco-master-review"/);
  assert.match(view, /EXECUTION BLOCKED/);
  assert.match(view, /0\/1 Kandidaten/);
  assert.match(view, /REVIEW_REQUIRED/);
  assert.match(view, /data-testid="ricco-review-tests"/);
  assert.match(view, /data-testid="ricco-zero-state"/);
  assert.doesNotMatch(view, /<img/);
  assert.doesNotMatch(view, /<canvas/);
});

test('LR4 closure record is exact and leaves all creative masters open', async () => {
  const closure = await json('project/lr4-selected-pilot-closure.json');
  assert.equal(closure.status, 'closed_verified');
  assert.equal(closure.implementedBy.pullRequest, 81);
  assert.equal(closure.implementedBy.verifiedHead, 'a55a24e24bdae0bbf2b980f2842f57f0653092ca');
  assert.equal(closure.implementedBy.ciRun, 29152706460);
  assert.equal(closure.implementedBy.mergeCommit, '63021f49152dee7375578537be13dafd65685391');
  assert.equal(closure.publicProof.pagesRun, 29152807415);
  assert.equal(closure.publicProof.publicVerificationPassed, true);
  assert.equal(closure.proof.stationsPassed, 9);
  assert.equal(closure.proof.stateActuallyDeleted, true);
  assert.equal(closure.proof.deleteRestoreHashMatch, true);
  assert.equal(closure.proof.imageBytesUsed, false);
  assert.equal(closure.proof.externalExecutionUsed, false);
  assert.equal(closure.proof.creativeApprovalGranted, false);
  assert.equal(closure.nextGate.id, 'LR5');
  assert.equal(closure.nextGate.trackingIssue, 82);
});

test('archived lockfile remains physically present', async () => {
  await access(new URL('studio-app/package-lock.json', root));
  const lock = await json('studio-app/package-lock.json');
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[''].name, 'comic-factory');
  assert.equal(lock.packages[''].dependencies.react, 'latest');
  assert.equal(lock.packages[''].devDependencies['@playwright/test'], '^1.61.1');
});
