import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { computeManifestHash, validateProgramEvidenceV3 } from '../scripts/check_program_evidence_v3.mjs';

const readManifest = async () => JSON.parse(await readFile(new URL('../project/program-evidence-v3.json', import.meta.url), 'utf8'));
const rehash = (manifest) => {
  manifest.integrity.manifest_sha256 = computeManifestHash(manifest);
  return manifest;
};
const rejects = (manifest, pattern) => assert.throws(() => validateProgramEvidenceV3(manifest, { checkRepositoryRefs: false }), pattern);

test('current Program Evidence V3 passes', async () => {
  const manifest = await readManifest();
  const result = validateProgramEvidenceV3(manifest, { checkRepositoryRefs: false });
  assert.equal(result.local_asset_scan, 'COMPLETE_NO_TRUSTWORTHY_CANDIDATES');
  assert.equal(result.files_scanned, 6215);
  assert.equal(result.ranked_candidates, 0);
  assert.equal(result.model_files, 0);
  assert.equal(result.main_merge_allowed, false);
});

test('old pending-scan program status is rejected', async () => {
  const manifest = await readManifest();
  manifest.program_status = 'PROGRAM_INTEGRATION_PROVEN_PENDING_LOCAL_ASSET_SCAN';
  rejects(rehash(manifest), /PROGRAM_STATUS/);
});

test('open asset issue is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.issue_state = 'open';
  rejects(rehash(manifest), /SCAN_ISSUE_STATE/);
});

test('wrong scan target is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.target_commit = '0'.repeat(40);
  rejects(rehash(manifest), /SCAN_TARGET/);
});

test('invented trustworthy candidate is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.ranked_candidates = 1;
  rejects(rehash(manifest), /RANKED_CANDIDATES/);
});

test('invented model bytes are rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.model_files = 1;
  rejects(rehash(manifest), /MODEL_FILES/);
});

test('source mutation is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.source_assets_modified = true;
  rejects(rehash(manifest), /SOURCE_ASSETS_MODIFIED/);
});

test('automatic master approval is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.automatic_master_approvals = 1;
  rejects(rehash(manifest), /AUTOMATIC_MASTER_APPROVALS/);
});

test('automatic canon approval is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.automatic_canon_approval = true;
  rejects(rehash(manifest), /AUTOMATIC_CANON_APPROVAL/);
});

test('wrong inventory hash is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.inventory_sha256 = '0'.repeat(64);
  rejects(rehash(manifest), /INVENTORY_HASH/);
});

test('wrong shortlist hash is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.shortlist_sha256 = '0'.repeat(64);
  rejects(rehash(manifest), /SHORTLIST_HASH/);
});

test('wrong zip hash is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.zip_sha256 = '0'.repeat(64);
  rejects(rehash(manifest), /ZIP_HASH/);
});

test('target approval is rejected', async () => {
  const manifest = await readManifest();
  manifest.local_asset_scan.targets.character_ricco = 'REVIEW_REQUIRED';
  rejects(rehash(manifest), /TARGET_CHARACTER_RICCO/);
});

test('missing target is rejected', async () => {
  const manifest = await readManifest();
  delete manifest.local_asset_scan.targets.location_kitchen;
  rejects(rehash(manifest), /TARGET_COUNT/);
});

test('old local scan blocker is rejected', async () => {
  const manifest = await readManifest();
  manifest.blocked_gates[1] = 'LOCAL_ASSET_SCAN_NOT_EXECUTED';
  rejects(rehash(manifest), /BLOCKED_GATES/);
});

test('missing new asset generation blocker is rejected', async () => {
  const manifest = await readManifest();
  manifest.blocked_gates = manifest.blocked_gates.filter((item) => item !== 'NEW_ASSET_GENERATION_REQUIRED');
  rejects(rehash(manifest), /BLOCKED_GATES/);
});

test('character master claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.character_masters = '1/4';
  rejects(rehash(manifest), /CHARACTER_MASTERS/);
});

test('location master claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.location_masters = '1/4';
  rejects(rehash(manifest), /LOCATION_MASTERS/);
});

test('voice master claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.voice_masters = '1/3';
  rejects(rehash(manifest), /VOICE_MASTERS/);
});

test('real pilot claim is rejected', async () => {
  const manifest = await readManifest();
  manifest.truth.real_pilot_proven = true;
  rejects(rehash(manifest), /REAL_PILOT_FALSE_CLAIM/);
});

test('main merge allowance is rejected', async () => {
  const manifest = await readManifest();
  manifest.main_merge_allowed = true;
  rejects(rehash(manifest), /PROGRAM_MAIN_MERGE_ALLOWED/);
});

test('live activation is rejected', async () => {
  const manifest = await readManifest();
  manifest.live_activation_allowed = true;
  rejects(rehash(manifest), /PROGRAM_LIVE_ALLOWED/);
});

test('tampered hash is rejected', async () => {
  const manifest = await readManifest();
  manifest.generated_at = '2026-07-12T12:18:00Z';
  rejects(manifest, /HASH_MISMATCH/);
});

test('manifest hash remains deterministic', async () => {
  const manifest = await readManifest();
  assert.equal(computeManifestHash(manifest), '20c3feff97ead11e8fdeaf9efee10614000c349ffab84788cf97f9580bb03518');
});
