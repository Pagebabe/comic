import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertFreshCloneState, inspectFreshCloneState, parseMajorVersion } from '../scripts/fresh_install_drill.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('fresh install contract keeps PR1 partial until a second-person observation', async () => {
  const [contract, readiness] = await Promise.all([
    json('project/fresh-install-contract.json'),
    json('project/production-readiness-v1.json')
  ]);

  assert.equal(contract.schemaVersion, 1);
  assert.equal(contract.repository, 'Pagebabe/comic');
  assert.equal(contract.trackingIssue, 115);
  assert.equal(contract.readinessGate, 'PR1');
  assert.equal(contract.readinessEffect.pr1AfterAutomatedPass, 'PARTIAL');
  assert.equal(contract.readinessEffect.productionReady, false);
  assert.equal(contract.readinessEffect.beginnerReady, false);
  assert.match(contract.readinessEffect.remainingProof, /second person/i);

  const pr1 = readiness.gates.find((gate) => gate.id === 'PR1');
  assert.ok(pr1);
  assert.equal(pr1.status, 'PARTIAL');
  assert.ok(pr1.missingProof.some((entry) => /second person/i.test(entry)));
  assert.equal(readiness.academyBoundary.productionReady, false);
  assert.equal(readiness.academyBoundary.beginnerReady, false);
});

test('fresh install workflow is isolated, exact-commit-bound and uploads proof', async () => {
  const workflow = await read('.github/workflows/fresh-install-drill.yml');
  assert.match(workflow, /name: Fresh Install Drill/);
  assert.match(workflow, /uses: actions\/checkout@v4/);
  assert.match(workflow, /node-version: 20/);
  assert.match(workflow, /npm run drill:fresh-install/);
  assert.match(workflow, /check_fresh_install_report\.mjs/);
  assert.match(workflow, /comic-fresh-install-proof/);
  assert.match(workflow, /output\/fresh-install\//);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.doesNotMatch(workflow, /deploy-pages/);
});

test('package scripts expose one-command drill and static contract checks', async () => {
  const packageJson = await json('package.json');
  assert.equal(packageJson.scripts['drill:fresh-install'], 'node scripts/fresh_install_drill.mjs');
  assert.match(packageJson.scripts.test, /fresh-install-contract\.test\.mjs/);
  assert.match(packageJson.scripts.check, /check_fresh_install_contract\.mjs/);
});

test('fresh state inspection rejects any pre-existing dependency or build artifact', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'comic-fresh-state-'));
  try {
    await mkdir(join(directory, 'studio-app', 'node_modules'), { recursive: true });
    const state = await inspectFreshCloneState(directory);
    assert.equal(state.studioNodeModules, true);
    assert.throws(() => assertFreshCloneState(state), /FRESH_CLONE_CONTAMINATED:studioNodeModules/);

    await rm(join(directory, 'studio-app', 'node_modules'), { recursive: true, force: true });
    const cleanState = await inspectFreshCloneState(directory);
    assert.deepEqual(Object.values(cleanState), [false, false, false, false, false]);
    assert.equal(assertFreshCloneState(cleanState), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('version parser enforces a machine-readable Node major', () => {
  assert.equal(parseMajorVersion('v20.19.0'), 20);
  assert.equal(parseMajorVersion('npm 11.2.0'), 11);
  assert.throws(() => parseMajorVersion('unknown'), /VERSION_UNPARSABLE/);
});

test('drill implementation uses the installed Vite preview and fails closed', async () => {
  const script = await read('scripts/fresh_install_drill.mjs');
  assert.match(script, /cloneCommit !== sourceCommit/);
  assert.match(script, /CLONE_COMMIT_MISMATCH/);
  assert.match(script, /FRESH_CLONE_CONTAMINATED/);
  assert.match(script, /NODE_20_REQUIRED/);
  assert.match(script, /STUDIO_LOCKFILE_MISSING/);
  assert.match(script, /STUDIO_DIST_INDEX_MISSING/);
  assert.match(script, /studio-preview-start/);
  assert.match(script, /run', 'preview'/);
  assert.match(script, /--strictPort/);
  assert.match(script, /firstStartServer: 'vite-preview'/);
  assert.match(script, /status: 'FAIL'/);
  assert.match(script, /observedSecondPersonInstall: false/);
  assert.doesNotMatch(script, /productionReady: true/);
  assert.doesNotMatch(script, /creativeApprovalGranted: true/);
});
