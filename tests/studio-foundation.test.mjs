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

test('studio app shows closed LR3 and active LR4 while retaining neutral loop regression', async () => {
  const [app, main, vite, pkg] = await Promise.all([
    read('studio-app/src/App.tsx'),
    read('studio-app/src/main.tsx'),
    read('studio-app/vite.config.ts'),
    json('studio-app/package.json')
  ]);
  assert.match(app, /data-testid="studio-foundation"/);
  assert.match(app, /lr3-production-loop-closure\.json/);
  assert.match(app, /LR3 GESCHLOSSEN/);
  assert.match(app, /LR3 PUBLICLY VERIFIED/);
  assert.match(app, /DELETE \+ RESTORE PASS/);
  assert.match(app, /LR4/);
  assert.match(app, /Issue #76/);
  assert.match(app, /Selected-Pilot-Fire-Test noch offen/);
  assert.match(app, /ProductionLoop/);
  assert.match(main, /React\.StrictMode/);
  assert.match(vite, /base: '\.\/'/);
  assert.equal(pkg.scripts.build, 'tsc -b && vite build');
  for (const forbidden of ['RiccoStudio','RiccoPromptQueue','RiccoAssetImport','RiccoImageReview','RiccoPackage','RiccoRestore']) assert.doesNotMatch(app, new RegExp(forbidden));
});

test('archived lockfile remains physically present', async () => {
  await access(new URL('studio-app/package-lock.json', root));
  const lock = await json('studio-app/package-lock.json');
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[''].name, 'comic-factory');
  assert.equal(lock.packages[''].dependencies.react, 'latest');
  assert.equal(lock.packages[''].devDependencies['@playwright/test'], '^1.61.1');
});
