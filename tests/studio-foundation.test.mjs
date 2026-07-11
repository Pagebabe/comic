import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('LR2 inventory pins the archive source and selects a minimal slice', async () => {
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

test('foundation status preserves creative and production boundaries', async () => {
  const status = await json('project/studio-foundation-status.json');
  assert.equal(status.status, 'implementation_present_requires_public_proof');
  assert.equal(status.route, '/studio/');
  assert.equal(status.selectedPilot.id, 'pilot-das-zimmer');
  assert.equal(status.productionReady, false);
  assert.equal(status.automaticCanonApproval, false);
  assert.equal(status.automaticVisualApproval, false);
  assert.equal(status.automaticVoiceApproval, false);
  assert.ok(status.notRestored.includes('Package Export and Restore'));
});

test('studio app is neutral and does not import LR3 production modules', async () => {
  const [app, main, vite, pkg] = await Promise.all([
    read('studio-app/src/App.tsx'),
    read('studio-app/src/main.tsx'),
    read('studio-app/vite.config.ts'),
    json('studio-app/package.json')
  ]);
  assert.match(app, /data-testid="studio-foundation"/);
  assert.match(app, /project\/truth-state\.json/);
  assert.match(app, /Produktionsloop noch nicht gerettet/);
  assert.match(main, /React\.StrictMode/);
  assert.match(vite, /base: '\.\/'/);
  assert.equal(pkg.scripts.build, 'tsc -b && vite build');
  for (const forbidden of ['RiccoStudio','RiccoPromptQueue','RiccoAssetImport','RiccoImageReview','RiccoPackage','RiccoRestore']) assert.doesNotMatch(app, new RegExp(forbidden));
});

test('archived lockfile is physically present in the isolated app', async () => {
  await access(new URL('studio-app/package-lock.json', root));
  const lock = await json('studio-app/package-lock.json');
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[''].name, 'comic-factory');
  assert.equal(lock.packages[''].dependencies.react, 'latest');
  assert.equal(lock.packages[''].devDependencies['@playwright/test'], '^1.61.1');
});
