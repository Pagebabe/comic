import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { computeManifestHash, validateProgramEvidence } from '../scripts/check_program_evidence.mjs';

const load = async () => JSON.parse(await readFile(new URL('../project/program-evidence-manifest.json', import.meta.url), 'utf8'));
const clone = (value) => structuredClone(value);
const rehash = (value) => {
  value.integrity.manifest_sha256 = computeManifestHash(value);
  return value;
};
const reject = (value, pattern) => assert.throws(() => validateProgramEvidence(value, { checkRepositoryRefs: false }), pattern);

test('current factory integration evidence passes', async () => {
  const result = validateProgramEvidence(await load(), { checkRepositoryRefs: false });
  assert.equal(result.program_status, 'PROGRAM_FACTORY_INTEGRATION_PROVEN_MAIN_BLOCKED');
  assert.equal(result.factory_integration_proven, true);
  assert.equal(result.main_merge_allowed, false);
});

test('Worker 1 is closed and merged only to factory integration', async () => {
  const manifest = await load();
  const worker = manifest.workers.find((entry) => entry.worker_id === 1);
  assert.equal(worker.pr.merged, true);
  assert.equal(worker.pr.base, 'integration/factory-final-heads');
  assert.equal(worker.merged_to_main, false);
});

test('Worker 2 remains technical-only after integration', async () => {
  const manifest = await load();
  const worker = manifest.workers.find((entry) => entry.worker_id === 2);
  assert.equal(worker.technical_only, true);
  assert.equal(worker.real_pilot_proven, false);
  assert.ok(worker.non_claims.includes('NO_REAL_PILOT_EPISODE'));
});

test('factory integration binds exact head and PR', async () => {
  const manifest = await load();
  assert.equal(manifest.factory_integration.head_sha, 'eb07bc9ab5536d89ccc01ccccbd5aaeabf82d3b3');
  assert.equal(manifest.factory_integration.pr.number, 144);
  assert.equal(manifest.factory_integration.pr.merged, false);
  assert.equal(manifest.factory_integration.runs.length, 4);
});

test('growth remains excluded and blocked at package.json', async () => {
  const manifest = await load();
  assert.equal(manifest.factory_integration.growth_included, false);
  assert.equal(manifest.growth_dependency.conflict_path, 'package.json');
  assert.equal(manifest.growth_dependency.satisfied, false);
});

test('rejects changed factory head', async () => {
  const manifest = await load();
  manifest.factory_integration.head_sha = 'a'.repeat(40);
  reject(rehash(manifest), /FACTORY_HEAD/);
});

test('rejects missing Worker 1 integration', async () => {
  const manifest = await load();
  manifest.workers[0].pr.merged = false;
  reject(rehash(manifest), /WORKER_1_NOT_MERGED_TO_INTEGRATION/);
});

test('rejects missing Worker 2 integration', async () => {
  const manifest = await load();
  manifest.workers[1].pr.merged = false;
  reject(rehash(manifest), /WORKER_2_NOT_MERGED_TO_INTEGRATION/);
});

test('rejects Worker 1 false main merge', async () => {
  const manifest = await load();
  manifest.workers[0].merged_to_main = true;
  reject(rehash(manifest), /WORKER_1_FALSE_MAIN_MERGE/);
});

test('rejects Worker 2 real-pilot claim', async () => {
  const manifest = await load();
  manifest.workers[1].real_pilot_proven = true;
  reject(rehash(manifest), /WORKER_2_FALSE_REAL_PILOT/);
});

test('rejects missing creative non-claim', async () => {
  const manifest = await load();
  manifest.workers[1].non_claims = manifest.workers[1].non_claims.filter((item) => item !== 'NO_CREATIVE_APPROVAL');
  reject(rehash(manifest), /WORKER_2_NON_CLAIM_MISSING/);
});

test('rejects factory PR marked merged to main', async () => {
  const manifest = await load();
  manifest.factory_integration.pr.merged = true;
  reject(rehash(manifest), /FACTORY_FALSE_MAIN_MERGE/);
});

test('rejects Growth inside factory branch', async () => {
  const manifest = await load();
  manifest.factory_integration.growth_included = true;
  reject(rehash(manifest), /FACTORY_GROWTH_INCLUDED/);
});

test('rejects altered combined CI run', async () => {
  const manifest = await load();
  manifest.factory_integration.runs[0].run_id = 1;
  reject(rehash(manifest), /FACTORY_RUN_ID/);
});

test('rejects altered combined artifact digest', async () => {
  const manifest = await load();
  manifest.factory_integration.runs[0].digest = `sha256:${'0'.repeat(64)}`;
  reject(rehash(manifest), /FACTORY_DIGEST/);
});

test('rejects dirty rehearsal rollback', async () => {
  const manifest = await load();
  manifest.merge_rehearsal.rollback_clean = false;
  reject(rehash(manifest), /REHEARSAL_ROLLBACK_DIRTY/);
});

test('rejects satisfied Growth dependency', async () => {
  const manifest = await load();
  manifest.growth_dependency.satisfied = true;
  reject(rehash(manifest), /GROWTH_FALSE_SATISFACTION/);
});

test('rejects missing local asset blocker', async () => {
  const manifest = await load();
  manifest.blocked_gates = manifest.blocked_gates.filter((item) => item !== 'LOCAL_ASSET_SCAN_NOT_EXECUTED');
  reject(rehash(manifest), /BLOCKED_GATES/);
});

test('rejects obsolete integration-not-proven blocker', async () => {
  const manifest = await load();
  manifest.blocked_gates.push('PROGRAM_INTEGRATION_NOT_PROVEN');
  reject(rehash(manifest), /BLOCKED_GATES|OBSOLETE_FACTORY_BLOCKER/);
});

test('rejects main merge permission', async () => {
  const manifest = await load();
  manifest.main_merge_allowed = true;
  reject(rehash(manifest), /PROGRAM_MAIN_MERGE_ALLOWED/);
});

test('rejects live activation', async () => {
  const manifest = await load();
  manifest.live_activation_allowed = true;
  reject(rehash(manifest), /PROGRAM_LIVE_ALLOWED/);
});

test('rejects OAuth activation', async () => {
  const manifest = await load();
  manifest.activation_controls.oauth_allowed = true;
  reject(rehash(manifest), /OAUTH_ALLOWED/);
});

test('rejects invalid hash after mutation', async () => {
  const manifest = await load();
  manifest.generated_at = '2026-07-12T11:06:00Z';
  reject(manifest, /HASH_MISMATCH/);
});

test('hash remains deterministic', async () => {
  const manifest = await load();
  assert.equal(computeManifestHash(clone(manifest)), '93c7453c01c6f3f7d0f587390610308d2d2e6e0b7104dd3bcfe15d87b3987c49');
  assert.equal(computeManifestHash(clone(manifest)), computeManifestHash(clone(manifest)));
});
