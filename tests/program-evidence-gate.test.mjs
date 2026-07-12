import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canonicalize, computeManifestHash, validateProgramEvidence } from '../scripts/check_program_evidence.mjs';

const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const applyMutation = (manifest, mutation) => {
  const parts = mutation.path.split('.');
  let target = manifest;
  for (const part of parts.slice(0, -1)) target = target[Number.isInteger(Number(part)) && part !== '' ? Number(part) : part];
  const key = parts.at(-1);
  if (mutation.op === 'set') target[key] = mutation.value;
  else if (mutation.op === 'remove_where') target[key] = target[key].filter((item) => item?.[mutation.field] !== mutation.equals);
  else throw new Error(`Unknown fixture mutation: ${mutation.op}`);
};
const rehash = (manifest) => {
  manifest.integrity.manifest_sha256 = computeManifestHash(manifest);
  return manifest;
};
const readFixture = async (name) => {
  const fixtureUrl = new URL(`../project/fixtures/${name}`, import.meta.url);
  const fixture = await readJson(fixtureUrl);
  const manifest = await readJson(new URL(fixture.base_manifest, fixtureUrl));
  for (const mutation of fixture.mutations || []) applyMutation(manifest, mutation);
  if (fixture.mutations?.length) rehash(manifest);
  return manifest;
};
const rejects = (manifest, pattern) => assert.throws(
  () => validateProgramEvidence(manifest, { checkRepositoryRefs: false }),
  pattern
);
const clone = (value) => structuredClone(value);

test('valid evidence package passes with integration still blocked', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const result = validateProgramEvidence(manifest, { checkRepositoryRefs: false });
  assert.equal(result.program_status, 'PROGRAM_RELEASE_BLOCKED_PENDING_INTEGRATION');
  assert.equal(result.decision, 'PROGRAM_EVIDENCE_GATE_READY');
  assert.equal(result.main_merge_allowed, false);
  assert.equal(result.live_activation_allowed, false);
});

test('Worker 1 is bound to the final proven head', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 1);
  assert.equal(worker.head_sha, '1bb4df874d8e2a36fd32fbad19074ed629ec922d');
  assert.equal(worker.status, 'CANON_CAST_SEPARATION_PROVEN');
  assert.equal(worker.ci_runs.length, 3);
  assert.equal(worker.workflow_artifacts.length, 3);
  validateProgramEvidence(manifest, { checkRepositoryRefs: false });
});

test('Worker 2 is completed only as technical episode pipeline proof', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 2);
  assert.equal(worker.head_sha, 'e8b8e348120ad527abe7a33caab9f56b6627f8c2');
  assert.equal(worker.status, 'EPISODE_PIPELINE_PROVEN');
  assert.equal(worker.verified, true);
  assert.ok(worker.non_claims.includes('NO_REAL_PILOT_EPISODE'));
  assert.ok(worker.non_claims.includes('NO_CHARACTER_LOCK'));
  validateProgramEvidence(manifest, { checkRepositoryRefs: false });
});

test('Worker 3 retains PR 131 as hard dependency', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 3);
  assert.equal(worker.head_sha, 'c8c0adcef30645142190c19d8fbc6903fe177ae7');
  assert.equal(worker.dependencies[0].dependency_id, 'PR_131');
  assert.equal(worker.dependencies[0].satisfied, false);
  validateProgramEvidence(manifest, { checkRepositoryRefs: false });
});

test('Worker 3 without PR 131 is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 3).dependencies = [];
  rejects(rehash(manifest), /WORKER_3_DEPENDENCY_COUNT/);
});

test('invalid Worker 1 SHA is rejected', async () => {
  rejects(await readFixture('program-evidence-invalid-sha.json'), /WORKER_1_HEAD_FORMAT/);
});

test('missing Worker 1 report is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[0].report_path = null;
  rejects(rehash(manifest), /WORKER_1_REPORT_PATH/);
});

test('missing Worker 1 artifact is rejected', async () => {
  rejects(await readFixture('program-evidence-missing-artifact.json'), /WORKER_1_REQUIRED_ARTIFACT_PATHS/);
});

test('missing Worker 2 report is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[1].report_path = null;
  rejects(rehash(manifest), /WORKER_2_REPORT_PATH/);
});

test('Worker 2 cannot regress to Pending', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[1].status = 'PENDING';
  manifest.workers[1].verified = false;
  rejects(rehash(manifest), /WORKER_2_STATUS_REPORT_MISMATCH/);
});

test('Worker 2 final head drift is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[1].head_sha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  rejects(rehash(manifest), /WORKER_2_HEAD_MISMATCH/);
});

test('Worker 2 creative approval claim remains forbidden', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[1].non_claims = ['NOT_MERGED_TO_MAIN'];
  rejects(rehash(manifest), /WORKER_2_NON_CLAIMS/);
});

test('missing CI run is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[1].ci_runs.pop();
  rejects(rehash(manifest), /WORKER_2_RUN_NAMES/);
});

test('missing artifact digest is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  delete manifest.workers[2].workflow_artifacts[0].digest;
  rejects(rehash(manifest), /WORKER_3_ARTIFACT_DIGEST/);
});

test('invalid manifest hash is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.generated_at = '2026-07-12T10:31:00Z';
  rejects(manifest, /INTEGRITY_MISMATCH/);
});

test('open worker PR cannot be claimed merged', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[1].pull_request.merged = true;
  rejects(rehash(manifest), /WORKER_2_FALSE_MERGE_CLAIM/);
});

test('main merge allowance is rejected at worker level', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[0].main_merge_allowed = true;
  rejects(rehash(manifest), /WORKER_1_MAIN_MERGE_ALLOWED/);
});

test('main merge allowance is rejected at program level', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.main_merge_allowed = true;
  rejects(rehash(manifest), /PROGRAM_MAIN_MERGE_ALLOWED/);
});

test('live activation fixture is rejected', async () => {
  rejects(await readFixture('program-evidence-live-enabled.json'), /PROGRAM_LIVE_ALLOWED/);
});

test('OAuth activation is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.activation_controls.oauth_allowed = true;
  rejects(rehash(manifest), /OAUTH_ALLOWED/);
});

test('connected platform account is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.activation_controls.platform_accounts_connected = 1;
  rejects(rehash(manifest), /PLATFORM_ACCOUNTS_ACTIVE/);
});

test('Worker 2 missing entirely is rejected', async () => {
  rejects(await readFixture('program-evidence-worker2-missing.json'), /WORKER_COUNT/);
});

test('program cannot become release-ready before integration', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.program_status = 'PROGRAM_RELEASE_READY';
  rejects(rehash(manifest), /PROGRAM_STATUS/);
});

test('obsolete Worker 2 blockers are rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.blocked_gates.push('WORKER_2_FINAL_REPORT_MISSING');
  rejects(rehash(manifest), /OBSOLETE_BLOCKED_GATE_PRESENT/);
});

test('local asset scan blocker cannot disappear yet', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.blocked_gates = manifest.blocked_gates.filter((gate) => gate !== 'LOCAL_ASSET_SCAN_NOT_EXECUTED');
  rejects(rehash(manifest), /BLOCKED_GATE_MISSING/);
});

test('real master blocker cannot disappear yet', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.blocked_gates = manifest.blocked_gates.filter((gate) => gate !== 'REAL_MASTERS_NOT_APPROVED');
  rejects(rehash(manifest), /BLOCKED_GATE_MISSING/);
});

test('duplicate worker id is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[2].worker_id = 1;
  rejects(rehash(manifest), /WORKER_IDS|DUPLICATE_WORKER_ID/);
});

test('duplicate branch is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[2].branch = manifest.workers[0].branch;
  rejects(rehash(manifest), /DUPLICATE_BRANCH|WORKER_3_BRANCH/);
});

test('unknown schema version is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.schema_version = 2;
  rejects(rehash(manifest), /SCHEMA_VERSION/);
});

test('PR 131 cannot be marked satisfied while open', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[2].dependencies[0].satisfied = true;
  rejects(rehash(manifest), /WORKER_3_PR_131_FALSE_SATISFACTION/);
});

test('expired workflow artifact is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[0].workflow_artifacts[0].expired = true;
  rejects(rehash(manifest), /WORKER_1_ARTIFACT_EXPIRED/);
});

test('canonical hash is deterministic across insertion order', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const reordered = {};
  for (const key of Object.keys(manifest).reverse()) reordered[key] = manifest[key];
  assert.deepEqual(canonicalize(manifest), canonicalize(reordered));
  assert.equal(computeManifestHash(manifest), computeManifestHash(reordered));
  assert.equal(computeManifestHash(manifest), '3ae17fe7bdc6384c4b4103989c7d26c327cc5eb3b1a438974bb181f4a0c76718');
});

test('repeated validation returns the same summary', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const first = validateProgramEvidence(clone(manifest), { checkRepositoryRefs: false });
  const second = validateProgramEvidence(clone(manifest), { checkRepositoryRefs: false });
  assert.deepEqual(first, second);
});
