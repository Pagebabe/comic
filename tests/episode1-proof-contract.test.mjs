import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'docs/production/EPISODE_1_PRODUCTION_RUN.md',
  'docs/production/EPISODE_1_ACCEPTANCE_CHECKLIST.md',
  'docs/production/MANUAL_IMAGE_GENERATION_HANDOFF.md',
  'docs/production/EXPORT_AND_RESTORE_PROOF.md',
  'docs/reports/WORKER_2_EPISODE_PROOF_REPORT.md',
  'testdata/episode1/episode1-test-dataset.json',
  'tests/episode1-proof/episode1-production.spec.ts',
  'tests/episode1-proof/episode1.playwright.config.ts',
  'scripts/run_episode1_production_proof.sh',
  'scripts/prepare_episode1_proof_workspace.mjs',
  'scripts/verify_episode1_proof_artifacts.mjs'
];

for (const file of requiredFiles) await access(new URL(`../${file}`, import.meta.url));
const dataset = JSON.parse(await readFile(new URL('../testdata/episode1/episode1-test-dataset.json', import.meta.url), 'utf8'));
const runner = await readFile(new URL('../scripts/run_episode1_production_proof.sh', import.meta.url), 'utf8');
const testSource = await readFile(new URL('./episode1-proof/episode1-production.spec.ts', import.meta.url), 'utf8');
const report = await readFile(new URL('../docs/reports/WORKER_2_EPISODE_PROOF_REPORT.md', import.meta.url), 'utf8');

test('proof is pinned to the existing selected Episode 1 archive', () => {
  assert.equal(dataset.sourceApplication.commit, '7266cf8df99ad811904933189666bbb827bd3ad1');
  assert.equal(dataset.episode.id, 'ep_001');
  assert.equal(dataset.episode.title, 'Das Zimmer');
  assert.equal(dataset.episode.panelCount, 8);
  assert.equal(dataset.panels.length, 8);
  assert.deepEqual(dataset.panels.map((panel) => panel.number), [1,2,3,4,5,6,7,8]);
  assert.match(runner, /git(?:\s+-C\s+"\$ROOT")?\s+worktree\s+add\s+--detach/);
  assert.match(runner, /npm run lint/);
  assert.match(runner, /npm run typecheck/);
  assert.match(runner, /npm test/);
  assert.match(runner, /npm run build/);
});

test('proof covers every required production transition', () => {
  for (const transition of dataset.requiredTransitions) assert.ok(testSource.includes(`record('${transition}'`), `missing transition: ${transition}`);
  for (const route of ['ricco-studio','ricco-bulk-upload','ricco-image-review','ricco-qa','ricco-export','ricco-lettering','ricco-package','ricco-restore']) assert.ok(testSource.includes(`'${route}'`), `missing route: ${route}`);
});

test('test fixtures cannot be mistaken for creative approval', () => {
  assert.equal(dataset.fixturePolicy.type, 'synthetic_test_png');
  assert.equal(dataset.fixturePolicy.creativeApproval, false);
  assert.equal(dataset.fixturePolicy.characterLock, false);
  assert.equal(dataset.fixturePolicy.locationLock, false);
  assert.equal(dataset.fixturePolicy.styleLock, false);
  assert.equal(dataset.fixturePolicy.externalGenerationExecuted, false);
  assert.match(testSource, /TEST ASSET ONLY/);
  assert.match(testSource, /creativeApprovalGranted: false/);
  assert.match(report, /M1-Clip ist kein Character Lock/);
});

test('worker scope excludes canon, cast and dashboard sources', () => {
  const forbidden = ['project/canon.json','project/cast-canon-v1.json','studio-app/src/ProductionCockpit.tsx','index.html','app.js'];
  for (const file of forbidden) assert.doesNotMatch(report, new RegExp(`\`?${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\`?\\s+geändert`, 'i'));
});
