import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateLegacyAssetMappingContract } from '../scripts/check_legacy_asset_mapping_contract.mjs';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const clone = (value) => structuredClone(value);

const loadContext = async () => {
  const [contract, canonCandidates, riccoInventory, productionSheets] = await Promise.all([
    json('project/legacy-asset-mapping-contract.json'),
    json('project/canon-candidates.json'),
    json('project/lr5-ricco-master-source-inventory.json'),
    json('project/character-production-sheets.json')
  ]);
  return { contract, context: { canonCandidates, riccoInventory, productionSheets } };
};

test('legacy mapping contract validates against current pilot and source inventory', async () => {
  const { contract, context } = await loadContext();
  assert.equal(validateLegacyAssetMappingContract(contract, context), true);
  assert.equal(contract.selectedPilot.id, 'pilot-das-zimmer');
  assert.equal(contract.selectedPilot.canonicalCast.length, 4);
  assert.equal(contract.characterMappings.length, 3);
  assert.equal(contract.boundaries.automaticMasterApprovals, 0);
});

test('explicit mappings are exact and every mapping remains review-required', async () => {
  const { contract } = await loadContext();
  assert.deepEqual(
    contract.characterMappings.map(({ legacyId, canonicalId }) => [legacyId, canonicalId]),
    [
      ['char_rico', 'char_ricco'],
      ['char_falk', 'char_basti'],
      ['char_kralle', 'char_don_miau']
    ]
  );
  assert.ok(contract.characterMappings.every((mapping) => mapping.reviewStatus === 'REVIEW_REQUIRED'));
});

test('all legacy production-sheet IDs are either explicitly mapped or explicitly unmapped', async () => {
  const { contract, context } = await loadContext();
  const accounted = new Set([
    ...contract.characterMappings.map((mapping) => mapping.legacyId),
    ...contract.unmappedLegacyCharacterIds
  ]);
  assert.deepEqual(
    context.productionSheets.map((sheet) => sheet.character_id).filter((id) => !accounted.has(id)),
    []
  );
});

test('unknown legacy characters fail closed without a canonical guess', async () => {
  const { contract, context } = await loadContext();
  const tampered = clone(contract);
  tampered.unknownCharacterPolicy.automaticGuessingAllowed = true;
  assert.throws(
    () => validateLegacyAssetMappingContract(tampered, context),
    /UNKNOWN_GUESSING|NO_AUTOMATIC_GUESSING/
  );
});

test('model bytes can be hashed and classified but never executed', async () => {
  const { contract, context } = await loadContext();
  const tampered = clone(contract);
  tampered.assetClasses.find((assetClass) => assetClass.id === 'MODEL_BYTES').executionAllowed = true;
  assert.throws(
    () => validateLegacyAssetMappingContract(tampered, context),
    /CLASS_EXECUTION|NO_EXECUTABLE_CLASS/
  );
});

test('automatic master approval remains impossible', async () => {
  const { contract, context } = await loadContext();
  const tampered = clone(contract);
  tampered.boundaries.automaticMasterApprovalAllowed = true;
  tampered.boundaries.automaticMasterApprovals = 1;
  assert.throws(
    () => validateLegacyAssetMappingContract(tampered, context),
    /AUTO_MASTER/
  );
});

test('removing a legacy ID from both mapped and unmapped sets is rejected', async () => {
  const { contract, context } = await loadContext();
  const tampered = clone(contract);
  tampered.unmappedLegacyCharacterIds = tampered.unmappedLegacyCharacterIds.filter((id) => id !== 'char_sami');
  assert.throws(
    () => validateLegacyAssetMappingContract(tampered, context),
    /LEGACY_ID_UNACCOUNTED_char_sami/
  );
});

test('invented location canon IDs are forbidden by contract policy', async () => {
  const { contract, context } = await loadContext();
  const tampered = clone(contract);
  tampered.selectedPilot.locationIdPolicy = 'AUTO_SLUG_FROM_NAME';
  assert.throws(
    () => validateLegacyAssetMappingContract(tampered, context),
    /LOCATION_ID_POLICY/
  );
});
