import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateLegacyAssetMigrationFixture } from '../scripts/check_legacy_asset_migration_fixture.mjs';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const clone = (value) => structuredClone(value);

const loadFixture = async () => {
  const [inventory, shortlist, oracle, mappingContract] = await Promise.all([
    json('tests/fixtures/legacy-asset-migration/asset-recovery-inventory.json'),
    json('tests/fixtures/legacy-asset-migration/analysis/visual-candidate-shortlist.json'),
    json('tests/fixtures/legacy-asset-migration/expected-migration-oracle.json'),
    json('project/legacy-asset-mapping-contract.json')
  ]);
  return { inventory, shortlist, oracle, mappingContract };
};

test('mixed legacy migration fixture validates against mapping contract', async () => {
  const fixture = await loadFixture();
  assert.equal(validateLegacyAssetMigrationFixture(fixture), true);
  assert.equal(fixture.inventory.files.length, 19);
  assert.equal(fixture.oracle.expectedSummary.includedRecords, 17);
  assert.equal(fixture.oracle.expectedSummary.excludedRecords, 2);
  assert.equal(fixture.oracle.expectedSummary.automaticMasterApprovals, 0);
});

test('fixture contains all required asset classes including zero-count fallback', async () => {
  const { oracle, mappingContract } = await loadFixture();
  assert.deepEqual(
    Object.keys(oracle.expectedSummary.assetClasses),
    mappingContract.assetClasses.map((assetClass) => assetClass.id)
  );
  assert.equal(oracle.expectedSummary.assetClasses.UNCLASSIFIED, 0);
});

test('non-read-only inventory is rejected', async () => {
  const fixture = await loadFixture();
  fixture.inventory = clone(fixture.inventory);
  fixture.inventory.readOnlySourceScan = false;
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /INVENTORY_NOT_READ_ONLY/);
});

test('fixture must never contain a real user path', async () => {
  const fixture = await loadFixture();
  fixture.inventory = clone(fixture.inventory);
  fixture.inventory.files[0].absolute_path = '/Users/fuhrer/ComfyUI/output/private.png';
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /REAL_PATH_LEAK/);
});

test('oracle must partition every inventory record exactly once', async () => {
  const fixture = await loadFixture();
  fixture.oracle = clone(fixture.oracle);
  fixture.oracle.expectedRecords.pop();
  fixture.oracle.expectedSummary.includedRecords -= 1;
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /ORACLE_PATH_PARTITION/);
});

test('automatic approval is rejected in every input layer', async () => {
  const fixture = await loadFixture();
  fixture.oracle = clone(fixture.oracle);
  fixture.oracle.expectedSummary.automaticMasterApprovals = 1;
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /ORACLE_AUTO_APPROVAL/);
});

test('invented legacy mapping is rejected', async () => {
  const fixture = await loadFixture();
  fixture.oracle = clone(fixture.oracle);
  const sami = fixture.oracle.expectedRecords.find((record) => record.legacyCharacterId === 'char_sami');
  sami.canonicalCharacterId = 'char_jule';
  sami.mappingStatus = 'EXPLICIT_PROJECT_DECISION';
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /ORACLE_MISSING_EXPLICIT_MAPPING/);
});

test('location fixture cannot invent canonical IDs', async () => {
  const fixture = await loadFixture();
  fixture.oracle = clone(fixture.oracle);
  const hallway = fixture.oracle.expectedRecords.find((record) => record.sourcePath.includes('treppenhaus'));
  hallway.canonicalCharacterId = 'location_hallway';
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /ORACLE_LOCATION_IDS/);
});

test('duplicate claim requires matching SHA-256', async () => {
  const fixture = await loadFixture();
  fixture.inventory = clone(fixture.inventory);
  const duplicate = fixture.inventory.files.find((record) => record.absolute_path.includes('ricco_turnaround_backup'));
  duplicate.sha256 = '0'.repeat(64);
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /ORACLE_DUPLICATE_SHA|DUPLICATE_GROUPS_ACTUAL/);
});

test('technical placeholder must remain excluded', async () => {
  const fixture = await loadFixture();
  fixture.oracle = clone(fixture.oracle);
  const placeholderIndex = fixture.oracle.expectedExclusions.findIndex((record) => record.reason === 'TECHNICAL_PLACEHOLDER');
  const [placeholder] = fixture.oracle.expectedExclusions.splice(placeholderIndex, 1);
  fixture.oracle.expectedRecords.push({
    sourcePath: placeholder.sourcePath,
    assetClass: 'IMAGE',
    legacyCharacterId: 'char_rico',
    canonicalCharacterId: 'char_ricco',
    mappingStatus: 'EXPLICIT',
    duplicateOf: null
  });
  fixture.oracle.expectedSummary.includedRecords += 1;
  fixture.oracle.expectedSummary.excludedRecords -= 1;
  fixture.oracle.expectedSummary.assetClasses.IMAGE += 1;
  assert.throws(() => validateLegacyAssetMigrationFixture(fixture), /ORACLE_PLACEHOLDER_EXCLUSION/);
});
