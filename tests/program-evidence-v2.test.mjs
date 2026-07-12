import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  canonicalize,
  computeManifestHash,
  validateProgramEvidenceV2
} from '../scripts/check_program_evidence_v2.mjs';

const readManifest = async () => JSON.parse(await readFile(new URL('../project/program-evidence-v2.json', import.meta.url), 'utf8'));
const clone = (value) => structuredClone(value);
const rehash = (manifest) => {
  manifest.integrity.manifest_sha256 = computeManifestHash(manifest);
  return manifest;
};
const rejects = (manifest, pattern) => {
  assert.throws(() => validateProgramEvidenceV2(manifest, { checkRepositoryRefs: false }), pattern);
};

const runByName = (manifest, workflow) => manifest.integration.runs.find((run) => run.workflow === workflow);

test('current Program Evidence V2 passes fail-closed validation', async () => {
  const manifest = await readManifest();
  const result = validateProgramEvidenceV2(manifest, { checkRepositoryRefs: false });
  assert.equal(result.program_status, 'PROGRAM_INTEGRATION_PROVEN_PENDING_LOCAL_ASSET_SCAN');
  assert.equal(result.decision, 'PROGRAM_EVIDENCE_CURRENT');
  assert.equal(result.integration_head, '9bf5c5350138371c4940475cf36fb51ba7d4ae9e');
  assert.equal(result.workflow_count, 6);
  assert.equal(result.main_merge_allowed, false);
  assert.equal(result.live_activation_allowed, false);
});

test('old integration head is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.head_sha = '5e31b35c9ed9e5c4fbf7415e147dd9ab1c574728';
  rejects(rehash(manifest), /INTEGRATION_HEAD/);
});

test('wrong product tree is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.product_tree_sha = '0'.repeat(40);
  rejects(rehash(manifest), /PRODUCT_TREE/);
});

test('wrong package hash is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.package_sha256 = '0'.repeat(64);
  rejects(rehash(manifest), /PACKAGE_HASH/);
});

test('missing workflow is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.runs.pop();
  rejects(rehash(manifest), /RUN_COUNT/);
});

test('wrong workflow run id is rejected', async () => {
  const manifest = await readManifest();
  runByName(manifest, 'Comic Factory CI').run_id = 1;
  rejects(rehash(manifest), /RUN_ID/);
});

test('wrong workflow artifact id is rejected', async () => {
  const manifest = await readManifest();
  runByName(manifest, 'Fresh Install Drill').artifact_id = 1;
  rejects(rehash(manifest), /ARTIFACT_ID/);
});

test('wrong workflow artifact digest is rejected', async () => {
  const manifest = await readManifest();
  runByName(manifest, 'Operator Recovery Drill').digest = `sha256:${'0'.repeat(64)}`;
  rejects(rehash(manifest), /ARTIFACT_DIGEST/);
});

test('claiming local asset scan completion is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.local_asset_scan = 'COMPLETE';
  rejects(rehash(manifest), /LOCAL_ASSET_SCAN_STATUS/);
});

test('claiming source assets were modified is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.source_assets_modified = true;
  rejects(rehash(manifest), /SOURCE_ASSETS_MODIFIED/);
});

test('automatic master approval is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.automatic_master_approvals = 1;
  rejects(rehash(manifest), /AUTOMATIC_MASTER_APPROVALS/);
});

test('nonzero character masters are rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.character_masters = '1/4';
  rejects(rehash(manifest), /CHARACTER_MASTERS/);
});

test('nonzero location masters are rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.location_masters = '1/4';
  rejects(rehash(manifest), /LOCATION_MASTERS/);
});

test('nonzero voice masters are rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.voice_masters = '1/3';
  rejects(rehash(manifest), /VOICE_MASTERS/);
});

test('false real pilot claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.real_pilot_proven = true;
  rejects(rehash(manifest), /REAL_PILOT_FALSE_CLAIM/);
});

test('production ready claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.production_ready = true;
  rejects(rehash(manifest), /PRODUCTION_READY_FALSE_CLAIM/);
});

test('beginner ready claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.beginner_ready = true;
  rejects(rehash(manifest), /BEGINNER_READY_FALSE_CLAIM/);
});

test('main merge allowance is rejected', async () => {
  const manifest = await readManifest();
  manifest.main_merge_allowed = true;
  rejects(rehash(manifest), /PROGRAM_MAIN_MERGE_ALLOWED/);
});

test('integration-level main merge allowance is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.main_merge_allowed = true;
  rejects(rehash(manifest), /INTEGRATION_MAIN_MERGE_ALLOWED/);
});

test('live activation is rejected', async () => {
  const manifest = await readManifest();
  manifest.live_activation_allowed = true;
  rejects(rehash(manifest), /PROGRAM_LIVE_ALLOWED/);
});

test('OAuth activation is rejected', async () => {
  const manifest = await readManifest();
  manifest.activation_controls.oauth_allowed = true;
  rejects(rehash(manifest), /OAUTH_ALLOWED/);
});

test('network activation is rejected', async () => {
  const manifest = await readManifest();
  manifest.activation_controls.network_execution_allowed = true;
  rejects(rehash(manifest), /NETWORK_ALLOWED/);
});

test('publishing activation is rejected', async () => {
  const manifest = await readManifest();
  manifest.activation_controls.publishing_allowed = true;
  rejects(rehash(manifest), /PUBLISHING_ALLOWED/);
});

test('missing blocker is rejected', async () => {
  const manifest = await readManifest();
  manifest.blocked_gates = manifest.blocked_gates.filter((gate) => gate !== 'LOCAL_ASSET_SCAN_NOT_EXECUTED');
  rejects(rehash(manifest), /BLOCKED_GATES/);
});

test('obsolete Growth blocker is rejected', async () => {
  const manifest = await readManifest();
  manifest.blocked_gates.push('MKT0_CURRENT_MAIN_REINTEGRATION_NOT_PROVEN');
  rejects(rehash(manifest), /BLOCKED_GATES/);
});

test('missing exact-tree proof is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.proofs.product_tree_matches_rehearsal = false;
  rejects(rehash(manifest), /PROOF_PRODUCT_TREE_MATCHES_REHEARSAL/);
});

test('bootstrap presence claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.proofs.bootstrap_absent = false;
  rejects(rehash(manifest), /PROOF_BOOTSTRAP_ABSENT/);
});

test('unexpected conflict path is rejected', async () => {
  const manifest = await readManifest();
  manifest.integration.proofs.expected_conflict_only = 'package-lock.json';
  rejects(rehash(manifest), /EXPECTED_CONFLICT/);
});

test('historical V1 evidence cannot remain authoritative', async () => {
  const manifest = await readManifest();
  manifest.control_proofs.evidence_v1.status = 'CURRENT';
  rejects(rehash(manifest), /EVIDENCE_V1_STATUS/);
});

test('tampered manifest hash is rejected', async () => {
  const manifest = await readManifest();
  manifest.generated_at = '2026-07-12T11:46:00Z';
  rejects(manifest, /HASH_MISMATCH/);
});

test('canonical hash is deterministic across object insertion order', async () => {
  const manifest = await readManifest();
  const reordered = {};
  for (const key of Object.keys(manifest).reverse()) reordered[key] = manifest[key];
  assert.deepEqual(canonicalize(manifest), canonicalize(reordered));
  assert.equal(computeManifestHash(manifest), computeManifestHash(reordered));
  assert.equal(computeManifestHash(manifest), 'b7368e7614893b1fe55336ff397258f59bb3d1affd58f6d4526cea9f56bf7c9c');
});

test('repeated validation returns identical summaries', async () => {
  const manifest = await readManifest();
  const first = validateProgramEvidenceV2(clone(manifest), { checkRepositoryRefs: false });
  const second = validateProgramEvidenceV2(clone(manifest), { checkRepositoryRefs: false });
  assert.deepEqual(first, second);
});
