import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));

const EXPECTED_CAST = Object.freeze([
  ['char_ricco', 'Ricco'],
  ['char_basti', 'Basti Prenzl'],
  ['char_jule', 'Jule'],
  ['char_don_miau', 'Don Miau']
]);

const EXPECTED_MAPPINGS = Object.freeze([
  ['char_rico', 'char_ricco'],
  ['char_falk', 'char_basti'],
  ['char_kralle', 'char_don_miau']
]);

const REQUIRED_CLASSES = Object.freeze([
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'MODEL_BYTES',
  'LORA_TRAINING_PLAN',
  'LORA_DATASET_MEMBER',
  'REVIEW_OR_MANIFEST',
  'UNCLASSIFIED'
]);

const REQUIRED_OUTPUT_FIELDS = Object.freeze([
  'sourcePath',
  'sourceSha256',
  'assetClass',
  'legacyCharacterId',
  'canonicalCharacterId',
  'mappingStatus',
  'reviewStatus',
  'sourceExecuted',
  'sourceCopied',
  'automaticMasterApproval'
]);

const fail = (code) => {
  throw new Error(`[LEGACY_ASSET_MAPPING:${code}]`);
};

const assert = (condition, code) => {
  if (!condition) fail(code);
};

const pairs = (items, left, right) => items.map((item) => [item[left], item[right]]);
const pairKey = ([left, right]) => `${left}->${right}`;

export function validateLegacyAssetMappingContract(contract, context = {}) {
  const { canonCandidates, riccoInventory, productionSheets } = context;

  assert(contract?.schemaVersion === 1, 'SCHEMA');
  assert(contract.contractId === 'legacy-asset-mapping-v1', 'CONTRACT_ID');
  assert(contract.repository === 'Pagebabe/comic', 'REPOSITORY');
  assert(contract.trackingIssue === 125, 'TRACKING_ISSUE');
  assert(contract.inventoryIssue === 123, 'INVENTORY_ISSUE');
  assert(contract.status === 'CONTRACT_DEFINED_REVIEW_REQUIRED', 'STATUS');

  assert(contract.selectedPilot?.id === 'pilot-das-zimmer', 'PILOT_ID');
  assert(contract.selectedPilot?.title === 'Das Zimmer', 'PILOT_TITLE');
  assert(contract.selectedPilot?.locationIdPolicy === 'REVIEW_REQUIRED_NO_CANON_ID_ASSUMPTION', 'LOCATION_ID_POLICY');

  const actualCast = pairs(contract.selectedPilot.canonicalCast || [], 'id', 'name').map(pairKey).sort();
  const expectedCast = EXPECTED_CAST.map(pairKey).sort();
  assert(JSON.stringify(actualCast) === JSON.stringify(expectedCast), 'CANONICAL_CAST');

  const actualMappings = pairs(contract.characterMappings || [], 'legacyId', 'canonicalId').map(pairKey).sort();
  const expectedMappings = EXPECTED_MAPPINGS.map(pairKey).sort();
  assert(JSON.stringify(actualMappings) === JSON.stringify(expectedMappings), 'EXPLICIT_MAPPINGS');
  assert((contract.characterMappings || []).every((mapping) => mapping.reviewStatus === 'REVIEW_REQUIRED'), 'MAPPING_REVIEW_STATUS');
  assert((contract.characterMappings || []).every((mapping) => mapping.mappingStatus.startsWith('EXPLICIT')), 'MAPPING_AUTHORITY');

  assert(contract.unknownCharacterPolicy?.result === 'LEGACY_SUPPORT_UNMAPPED', 'UNKNOWN_RESULT');
  assert(contract.unknownCharacterPolicy?.canonicalId === null, 'UNKNOWN_CANONICAL_ID');
  assert(contract.unknownCharacterPolicy?.reviewStatus === 'REVIEW_REQUIRED', 'UNKNOWN_REVIEW');
  assert(contract.unknownCharacterPolicy?.automaticGuessingAllowed === false, 'UNKNOWN_GUESSING');

  const classIds = (contract.assetClasses || []).map((assetClass) => assetClass.id).sort();
  assert(JSON.stringify(classIds) === JSON.stringify([...REQUIRED_CLASSES].sort()), 'ASSET_CLASSES');
  assert((contract.assetClasses || []).every((assetClass) => assetClass.executionAllowed === false), 'CLASS_EXECUTION');

  const modelClass = contract.assetClasses.find((assetClass) => assetClass.id === 'MODEL_BYTES');
  for (const extension of ['.safetensors', '.ckpt', '.pt', '.pth', '.onnx']) {
    assert(modelClass?.extensions.includes(extension), `MODEL_EXTENSION_${extension}`);
  }
  assert(modelClass?.automaticModelTypeClaimAllowed === false, 'MODEL_TYPE_CLAIM');

  assert(contract.classificationPriority?.[0] === 'MODEL_BYTES', 'CLASSIFICATION_PRIORITY_MODEL');
  assert(contract.classificationPriority?.at(-1) === 'UNCLASSIFIED', 'CLASSIFICATION_PRIORITY_FALLBACK');
  assert(new Set(contract.classificationPriority || []).size === REQUIRED_CLASSES.length, 'CLASSIFICATION_PRIORITY_UNIQUE');

  for (const field of REQUIRED_OUTPUT_FIELDS) {
    assert(contract.requiredOutputFields?.includes(field), `OUTPUT_FIELD_${field}`);
  }

  const boundaries = contract.boundaries || {};
  assert(boundaries.sourceExecutionAllowed === false, 'SOURCE_EXECUTION');
  assert(boundaries.sourceCopyAllowed === false, 'SOURCE_COPY');
  assert(boundaries.sourceImportAllowed === false, 'SOURCE_IMPORT');
  assert(boundaries.automaticCanonAssignmentAllowed === false, 'AUTO_CANON');
  assert(boundaries.automaticMasterApprovalAllowed === false, 'AUTO_MASTER');
  assert(boundaries.automaticMasterApprovals === 0, 'AUTO_MASTER_COUNT');
  assert(boundaries.defaultReviewStatus === 'REVIEW_REQUIRED', 'DEFAULT_REVIEW');
  assert(boundaries.modelBytesMayOnlyBeHashedAndClassified === true, 'MODEL_BYTES_BOUNDARY');
  assert(boundaries.previewEvidenceMayNotBecomeMasterSourceAutomatically === true, 'PREVIEW_BOUNDARY');

  const serialized = JSON.stringify(contract);
  assert(!serialized.includes('"reviewStatus":"APPROVED_MASTER"'), 'NO_APPROVED_MAPPING');
  assert(!serialized.includes('"executionAllowed":true'), 'NO_EXECUTABLE_CLASS');
  assert(!serialized.includes('"automaticGuessingAllowed":true'), 'NO_AUTOMATIC_GUESSING');

  if (canonCandidates) {
    const selected = canonCandidates.candidates?.find((candidate) => candidate.id === 'pilot-das-zimmer');
    assert(selected?.status === 'selected_human_confirmed', 'SOURCE_PILOT_STATUS');
    const expectedNames = EXPECTED_CAST.map(([, name]) => name).sort();
    assert(JSON.stringify([...(selected?.knownCast || [])].sort()) === JSON.stringify(expectedNames), 'SOURCE_CAST_MATCH');
    assert(JSON.stringify([...(selected?.knownLocations || [])].sort()) === JSON.stringify([...contract.selectedPilot.canonicalLocationNames].sort()), 'SOURCE_LOCATIONS_MATCH');
  }

  if (riccoInventory) {
    const idConflict = riccoInventory.resolvedConflicts?.find((conflict) => conflict.field === 'character_id');
    assert(idConflict?.historicalValue === 'char_rico', 'RICCO_LEGACY_ID');
    assert(idConflict?.currentValue === 'char_ricco', 'RICCO_CURRENT_ID');
    assert(riccoInventory.subject?.reviewStatus === 'REVIEW_REQUIRED', 'RICCO_REVIEW_STATUS');
    assert(riccoInventory.candidateBoundary?.automaticApprovalAllowed === false, 'RICCO_AUTO_APPROVAL');
  }

  if (productionSheets) {
    const legacyIds = productionSheets.map((sheet) => sheet.character_id).sort();
    const mappedIds = new Set((contract.characterMappings || []).map((mapping) => mapping.legacyId));
    const explicitlyUnmapped = new Set(contract.unmappedLegacyCharacterIds || []);
    for (const legacyId of legacyIds) {
      assert(mappedIds.has(legacyId) || explicitlyUnmapped.has(legacyId), `LEGACY_ID_UNACCOUNTED_${legacyId}`);
    }
    for (const legacyId of explicitlyUnmapped) {
      assert(legacyIds.includes(legacyId), `UNMAPPED_ID_NOT_IN_SOURCE_${legacyId}`);
    }
  }

  return true;
}

export async function loadAndValidateLegacyAssetMappingContract() {
  const [contract, canonCandidates, riccoInventory, productionSheets] = await Promise.all([
    readJson('project/legacy-asset-mapping-contract.json'),
    readJson('project/canon-candidates.json'),
    readJson('project/lr5-ricco-master-source-inventory.json'),
    readJson('project/character-production-sheets.json')
  ]);
  validateLegacyAssetMappingContract(contract, { canonCandidates, riccoInventory, productionSheets });
  return contract;
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (invokedDirectly) {
  const contract = await loadAndValidateLegacyAssetMappingContract();
  console.log(JSON.stringify({
    status: 'pass',
    contractId: contract.contractId,
    explicitMappings: contract.characterMappings.length,
    unmappedLegacyCharacters: contract.unmappedLegacyCharacterIds.length,
    assetClasses: contract.assetClasses.length,
    automaticMasterApprovals: contract.boundaries.automaticMasterApprovals,
    defaultReviewStatus: contract.boundaries.defaultReviewStatus
  }, null, 2));
}
