import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  canonicalize,
  computeManifestHash,
  validateProgramEvidence
} from '../scripts/check_program_evidence.mjs';

const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const applyMutation = (manifest, mutation) => {
  const parts = mutation.path.split('.');
  let target = manifest;
  for (const part of parts.slice(0, -1)) target = target[Number.isInteger(Number(part)) && part !== '' ? Number(part) : part];
  const key = parts.at(-1);
  if (mutation.op === 'set') target[key] = mutation.value;
  else if (mutation.op === 'remove_where') {
    const list = target[key];
    target[key] = list.filter((item) => item?.[mutation.field] !== mutation.equals);
  } else throw new Error(`Unknown fixture mutation: ${mutation.op}`);
};
const readFixture = async (name) => {
  const fixtureUrl = new URL(`../project/fixtures/${name}`, import.meta.url);
  const fixture = await readJson(fixtureUrl);
  const manifest = await readJson(new URL(fixture.base_manifest, fixtureUrl));
  for (const mutation of fixture.mutations || []) applyMutation(manifest, mutation);
  if (fixture.mutations?.length) rehash(manifest);
  return manifest;
};
const clone = (value) => structuredClone(value);
const rehash = (manifest) => {
  manifest.integrity.manifest_sha256 = computeManifestHash(manifest);
  return manifest;
};
const rejects = (manifest, pattern) => {
  assert.throws(() => validateProgramEvidence(manifest, { checkRepositoryRefs: false }), pattern);
};

test('valid program evidence package passes fail-closed validation', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const result = validateProgramEvidence(manifest, { checkRepositoryRefs: false });
  assert.equal(result.program_status, 'PROGRAM_RELEASE_BLOCKED_PENDING_WORKER_2');
  assert.equal(result.decision, 'PROGRAM_EVIDENCE_GATE_READY');
  assert.equal(result.main_merge_allowed, false);
  assert.equal(result.live_activation_allowed, false);
});

test('Worker 1 evidence packet is exact and remains not merged', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 1);
  assert.equal(worker.head_sha, 'b891d36c32c2a38badcfb897f46e6f1a29f13e70');
  assert.equal(worker.pull_request.number, 138);
  assert.equal(worker.pull_request.merged, false);
  assert.equal(worker.status, 'READY_FOR_REVIEW_NOT_MERGED');
  assert.equal(worker.ci_runs.length, 3);
  assert.equal(worker.workflow_artifacts.length, 3);
  validateProgramEvidence(manifest, { checkRepositoryRefs: false });
});

test('Worker 3 evidence packet is exact and PR 131 remains a hard dependency', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 3);
  assert.equal(worker.head_sha, 'c8c0adcef30645142190c19d8fbc6903fe177ae7');
  assert.equal(worker.pull_request.number, 139);
  assert.equal(worker.dependencies[0].dependency_id, 'PR_131');
  assert.equal(worker.dependencies[0].satisfied, false);
  assert.equal(worker.merge_allowed, false);
  validateProgramEvidence(manifest, { checkRepositoryRefs: false });
});

test('Worker 3 without PR 131 is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 3).dependencies = [];
  rejects(rehash(manifest), /WORKER_3_DEPENDENCY_COUNT/);
});

test('fixture with an invalid Worker 1 head SHA is rejected', async () => {
  rejects(await readFixture('program-evidence-invalid-sha.json'), /WORKER_1_HEAD_FORMAT/);
});

test('missing completion report is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 1).report_path = null;
  rejects(rehash(manifest), /WORKER_1_REPORT_PATH/);
});

test('missing required artifact is rejected', async () => {
  rejects(await readFixture('program-evidence-missing-artifact.json'), /WORKER_1_REQUIRED_ARTIFACT_PATHS/);
});

test('missing CI run is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 1).ci_runs.pop();
  rejects(rehash(manifest), /WORKER_1_RUN_NAMES/);
});

test('missing workflow artifact digest is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  delete manifest.workers.find((entry) => entry.worker_id === 3).workflow_artifacts[0].digest;
  rejects(rehash(manifest), /WORKER_3_ARTIFACT_DIGEST/);
});

test('invalid manifest hash is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.generated_at = '2026-07-12T07:36:00Z';
  rejects(manifest, /INTEGRITY_MISMATCH/);
});

test('Worker status contradicting the accepted report status is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 1).status = 'PROVEN';
  rejects(rehash(manifest), /WORKER_1_STATUS_REPORT_MISMATCH/);
});

test('claiming an open worker PR was merged is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 1).pull_request.merged = true;
  rejects(rehash(manifest), /WORKER_1_FALSE_MERGE_CLAIM/);
});

test('main merge allowance is rejected at worker level', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 1).main_merge_allowed = true;
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

test('connected platform accounts are rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.activation_controls.platform_accounts_connected = 1;
  rejects(rehash(manifest), /PLATFORM_ACCOUNTS_ACTIVE/);
});

test('Worker 2 missing entirely is rejected', async () => {
  rejects(await readFixture('program-evidence-worker2-missing.json'), /WORKER_COUNT/);
});

test('Worker 2 Pending with unknown values preserved is valid', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 2);
  assert.equal(worker.status, 'PENDING');
  assert.equal(worker.branch, null);
  assert.equal(worker.head_sha, null);
  assert.equal(worker.pull_request, null);
  assert.equal(worker.report_path, null);
  validateProgramEvidence(manifest, { checkRepositoryRefs: false });
});

test('Worker 2 cannot be completed without a final report', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const worker = manifest.workers.find((entry) => entry.worker_id === 2);
  worker.status = 'READY_FOR_REVIEW';
  worker.verified = true;
  rejects(rehash(manifest), /WORKER_2_STATUS/);
});

test('program cannot become ready while Worker 2 is Pending', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.program_status = 'PROGRAM_RELEASE_READY';
  rejects(rehash(manifest), /PROGRAM_STATUS/);
});

test('duplicate worker id is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[2].worker_id = 1;
  rejects(rehash(manifest), /WORKER_IDS|DUPLICATE_WORKER_ID/);
});

test('duplicate branch assignment is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers[2].branch = manifest.workers[0].branch;
  rejects(rehash(manifest), /DUPLICATE_BRANCH|WORKER_3_BRANCH/);
});

test('unknown schema version is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.schema_version = 2;
  rejects(rehash(manifest), /SCHEMA_VERSION/);
});

test('PR 131 cannot be marked satisfied while it remains open and not merged', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 3).dependencies[0].satisfied = true;
  rejects(rehash(manifest), /WORKER_3_PR_131_FALSE_SATISFACTION/);
});

test('expired workflow artifact is rejected', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  manifest.workers.find((entry) => entry.worker_id === 1).workflow_artifacts[0].expired = true;
  rejects(rehash(manifest), /WORKER_1_ARTIFACT_EXPIRED/);
});

test('canonical hash is deterministic across object insertion order', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const reordered = {};
  for (const key of Object.keys(manifest).reverse()) reordered[key] = manifest[key];
  assert.deepEqual(canonicalize(manifest), canonicalize(reordered));
  assert.equal(computeManifestHash(manifest), computeManifestHash(reordered));
  assert.equal(computeManifestHash(manifest), '1a23bbfa6505fe76a9c5ed204ed1d2df93609ba2cad5e105c4f528fd87b930c3');
});

test('deterministic repeated validation returns the same evidence summary', async () => {
  const manifest = await readFixture('program-evidence-valid.json');
  const first = validateProgramEvidence(clone(manifest), { checkRepositoryRefs: false });
  const second = validateProgramEvidence(clone(manifest), { checkRepositoryRefs: false });
  assert.deepEqual(first, second);
});
