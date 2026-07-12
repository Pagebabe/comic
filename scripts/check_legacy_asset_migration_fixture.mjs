import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const sha256Pattern = /^[a-f0-9]{64}$/;

const fail = (code, detail = '') => {
  throw new Error(`[LEGACY_MIGRATION_FIXTURE:${code}]${detail ? ` ${detail}` : ''}`);
};
const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
const sorted = (items) => [...items].sort();
const countBy = (items, key) => items.reduce((counts, item) => {
  const value = item[key];
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {});

export function validateLegacyAssetMigrationFixture({ inventory, shortlist, oracle, mappingContract }) {
  assert(inventory?.schemaVersion === 1, 'INVENTORY_SCHEMA');
  assert(inventory.fixtureId === 'legacy-asset-migration-mixed-v1', 'INVENTORY_FIXTURE_ID');
  assert(inventory.readOnlySourceScan === true, 'INVENTORY_NOT_READ_ONLY');
  assert(Array.isArray(inventory.files), 'INVENTORY_FILES');
  assert(inventory.files.length === 19, 'INVENTORY_COUNT');
  assert(inventory.summary?.files === inventory.files.length, 'INVENTORY_SUMMARY_COUNT');
  assert(inventory.summary?.duplicateGroups === 1, 'INVENTORY_DUPLICATE_COUNT');
  assert(inventory.summary?.sourceAssetsModified === 0, 'INVENTORY_SOURCE_MUTATION');
  assert(inventory.summary?.automaticMasterApprovals === 0, 'INVENTORY_AUTO_APPROVAL');

  const inventoryPaths = inventory.files.map((record) => record.absolute_path);
  assert(new Set(inventoryPaths).size === inventoryPaths.length, 'DUPLICATE_PATH');
  for (const record of inventory.files) {
    assert(record.absolute_path.startsWith('/fixture/'), 'REAL_PATH_LEAK', record.absolute_path);
    assert(typeof record.relative_path === 'string' && record.relative_path.length > 0, 'RELATIVE_PATH', record.absolute_path);
    assert(typeof record.extension === 'string' && record.extension.startsWith('.'), 'EXTENSION', record.absolute_path);
    assert(Number.isInteger(record.size_bytes) && record.size_bytes >= 0, 'SIZE', record.absolute_path);
    assert(sha256Pattern.test(record.sha256), 'SHA256', record.absolute_path);
    assert(record.likely_candidate === true || record.likely_candidate === false, 'LIKELY_CANDIDATE', record.absolute_path);
  }

  const duplicateGroups = Object.values(inventory.files.reduce((groups, record) => {
    groups[record.sha256] ||= [];
    groups[record.sha256].push(record.absolute_path);
    return groups;
  }, {})).filter((paths) => paths.length > 1);
  assert(duplicateGroups.length === 1, 'DUPLICATE_GROUPS_ACTUAL');
  assert(duplicateGroups[0].length === 2, 'DUPLICATE_GROUP_SIZE');

  assert(shortlist?.schemaVersion === 2, 'SHORTLIST_SCHEMA');
  assert(shortlist.fixtureId === inventory.fixtureId, 'SHORTLIST_FIXTURE_ID');
  assert(shortlist.automaticCanonApproval === false, 'SHORTLIST_AUTO_APPROVAL');
  assert(shortlist.summary?.targets === 8, 'SHORTLIST_TARGET_COUNT');
  assert(shortlist.summary?.targetsWithCandidates === 8, 'SHORTLIST_TARGETS_WITH_CANDIDATES');
  assert(shortlist.summary?.rankedCandidates === 9, 'SHORTLIST_CANDIDATE_COUNT');
  assert(shortlist.summary?.forbiddenPathsExcluded === 1, 'SHORTLIST_FORBIDDEN_COUNT');
  assert(Object.keys(shortlist.targets || {}).length === 8, 'SHORTLIST_TARGET_OBJECT_COUNT');

  const shortlistCandidates = [];
  for (const [targetId, target] of Object.entries(shortlist.targets)) {
    assert(target.decision === 'REVIEW_REQUIRED', 'SHORTLIST_TARGET_DECISION', targetId);
    assert(Array.isArray(target.candidates) && target.candidates.length > 0, 'SHORTLIST_TARGET_CANDIDATES', targetId);
    for (const candidate of target.candidates) {
      assert(candidate.target_id === targetId, 'SHORTLIST_TARGET_ID', candidate.absolute_path);
      assert(candidate.decision === 'REVIEW_REQUIRED', 'SHORTLIST_CANDIDATE_DECISION', candidate.absolute_path);
      assert(candidate.placeholder_risk === false, 'SHORTLIST_PLACEHOLDER', candidate.absolute_path);
      assert(inventoryPaths.includes(candidate.absolute_path), 'SHORTLIST_UNKNOWN_PATH', candidate.absolute_path);
      assert(sha256Pattern.test(candidate.sha256), 'SHORTLIST_SHA256', candidate.absolute_path);
      shortlistCandidates.push(candidate);
    }
  }
  assert(shortlistCandidates.length === 9, 'SHORTLIST_FLAT_COUNT');
  assert(shortlist.forbiddenPathsExcluded?.length === 1, 'SHORTLIST_FORBIDDEN_PATHS');

  assert(oracle?.schemaVersion === 1, 'ORACLE_SCHEMA');
  assert(oracle.fixtureId === inventory.fixtureId, 'ORACLE_FIXTURE_ID');
  assert(oracle.contractId === mappingContract.contractId, 'ORACLE_CONTRACT_ID');
  assert(oracle.inputRecords === inventory.files.length, 'ORACLE_INPUT_COUNT');
  assert(oracle.expectedSummary?.includedRecords === 17, 'ORACLE_INCLUDED_COUNT');
  assert(oracle.expectedSummary?.excludedRecords === 2, 'ORACLE_EXCLUDED_COUNT');
  assert(oracle.expectedSummary?.duplicateGroups === 1, 'ORACLE_DUPLICATE_COUNT');
  assert(oracle.expectedSummary?.automaticMasterApprovals === 0, 'ORACLE_AUTO_APPROVAL');
  assert(oracle.expectedSummary?.sourceFilesExecuted === 0, 'ORACLE_EXECUTED');
  assert(oracle.expectedSummary?.sourceFilesCopied === 0, 'ORACLE_COPIED');
  assert(oracle.expectedSummary?.sourceFilesImported === 0, 'ORACLE_IMPORTED');
  assert(oracle.expectedSummary?.defaultReviewStatus === 'REVIEW_REQUIRED', 'ORACLE_DEFAULT_REVIEW');

  const expectedRecords = oracle.expectedRecords || [];
  const expectedExclusions = oracle.expectedExclusions || [];
  assert(expectedRecords.length === oracle.expectedSummary.includedRecords, 'ORACLE_RECORD_COUNT');
  assert(expectedExclusions.length === oracle.expectedSummary.excludedRecords, 'ORACLE_EXCLUSION_COUNT');

  const includedPaths = expectedRecords.map((record) => record.sourcePath);
  const excludedPaths = expectedExclusions.map((record) => record.sourcePath);
  assert(new Set([...includedPaths, ...excludedPaths]).size === inventory.files.length, 'ORACLE_PATH_UNIQUENESS');
  assert(JSON.stringify(sorted([...includedPaths, ...excludedPaths])) === JSON.stringify(sorted(inventoryPaths)), 'ORACLE_PATH_PARTITION');

  const classCounts = countBy(expectedRecords, 'assetClass');
  for (const [assetClass, expectedCount] of Object.entries(oracle.expectedSummary.assetClasses || {})) {
    assert((classCounts[assetClass] || 0) === expectedCount, 'ORACLE_CLASS_COUNTS', `${assetClass}: expected ${expectedCount}, got ${classCounts[assetClass] || 0}`);
  }
  for (const assetClass of Object.keys(classCounts)) {
    assert(Object.hasOwn(oracle.expectedSummary.assetClasses || {}, assetClass), 'ORACLE_UNDECLARED_CLASS', assetClass);
  }

  const explicitMappings = new Map(mappingContract.characterMappings.map((mapping) => [mapping.legacyId, mapping]));
  const canonicalIds = new Set(mappingContract.selectedPilot.canonicalCast.map((character) => character.id));
  const unmappedIds = new Set(mappingContract.unmappedLegacyCharacterIds);

  for (const record of expectedRecords) {
    assert(inventoryPaths.includes(record.sourcePath), 'ORACLE_UNKNOWN_PATH', record.sourcePath);
    assert(mappingContract.assetClasses.some((assetClass) => assetClass.id === record.assetClass), 'ORACLE_UNKNOWN_CLASS', record.assetClass);
    if (record.mappingStatus === 'EXPLICIT' || record.mappingStatus === 'EXPLICIT_PROJECT_DECISION') {
      const mapping = explicitMappings.get(record.legacyCharacterId);
      assert(mapping, 'ORACLE_MISSING_EXPLICIT_MAPPING', record.sourcePath);
      assert(mapping.canonicalId === record.canonicalCharacterId, 'ORACLE_EXPLICIT_TARGET', record.sourcePath);
      assert(mapping.mappingStatus === record.mappingStatus, 'ORACLE_EXPLICIT_STATUS', record.sourcePath);
    } else if (record.mappingStatus === 'LEGACY_SUPPORT_UNMAPPED') {
      assert(unmappedIds.has(record.legacyCharacterId), 'ORACLE_UNMAPPED_ID', record.sourcePath);
      assert(record.canonicalCharacterId === null, 'ORACLE_UNMAPPED_TARGET', record.sourcePath);
    } else if (record.mappingStatus === 'CURRENT_CANON_DIRECT') {
      assert(record.legacyCharacterId === null, 'ORACLE_CURRENT_LEGACY_ID', record.sourcePath);
      assert(canonicalIds.has(record.canonicalCharacterId), 'ORACLE_CURRENT_CANON_ID', record.sourcePath);
    } else if (record.mappingStatus === 'LOCATION_NAME_REVIEW_REQUIRED') {
      assert(record.legacyCharacterId === null && record.canonicalCharacterId === null, 'ORACLE_LOCATION_IDS', record.sourcePath);
    } else if (record.mappingStatus === 'DOCUMENT_ONLY') {
      assert(record.legacyCharacterId === null && record.canonicalCharacterId === null, 'ORACLE_DOCUMENT_IDS', record.sourcePath);
    } else {
      fail('ORACLE_MAPPING_STATUS', `${record.sourcePath}: ${record.mappingStatus}`);
    }
  }

  const duplicateRecord = expectedRecords.find((record) => record.duplicateOf);
  assert(duplicateRecord?.sourcePath === '/fixture/Downloads/ricco_turnaround_backup.png', 'ORACLE_DUPLICATE_RECORD');
  assert(duplicateRecord.duplicateOf === '/fixture/comic/outputs/character_sheets/ricco_turnaround_v3.png', 'ORACLE_DUPLICATE_TARGET');
  const duplicateSource = inventory.files.find((record) => record.absolute_path === duplicateRecord.sourcePath);
  const duplicateTarget = inventory.files.find((record) => record.absolute_path === duplicateRecord.duplicateOf);
  assert(duplicateSource.sha256 === duplicateTarget.sha256, 'ORACLE_DUPLICATE_SHA');

  const exclusionMap = new Map(expectedExclusions.map((item) => [item.sourcePath, item.reason]));
  assert(exclusionMap.get('/fixture/comic/assets/characters/ricco.svg') === 'TECHNICAL_PLACEHOLDER', 'ORACLE_PLACEHOLDER_EXCLUSION');
  assert(exclusionMap.get('/fixture/comic/chris-fact-radar-studio/ricco.png') === 'FORBIDDEN_UNRELATED_PROJECT', 'ORACLE_FORBIDDEN_EXCLUSION');

  assert(oracle.requiredRecordDefaults?.reviewStatus === 'REVIEW_REQUIRED', 'ORACLE_REQUIRED_REVIEW');
  assert(oracle.requiredRecordDefaults?.sourceExecuted === false, 'ORACLE_REQUIRED_EXECUTED');
  assert(oracle.requiredRecordDefaults?.sourceCopied === false, 'ORACLE_REQUIRED_COPIED');
  assert(oracle.requiredRecordDefaults?.automaticMasterApproval === false, 'ORACLE_REQUIRED_AUTO_MASTER');
  assert(oracle.forbiddenOutputValues?.reviewStatus?.includes('APPROVED_MASTER'), 'ORACLE_FORBIDDEN_MASTER');
  assert(oracle.forbiddenOutputValues?.sourceExecuted?.includes(true), 'ORACLE_FORBIDDEN_EXECUTION');

  return true;
}

export async function loadAndValidateLegacyAssetMigrationFixture() {
  const [inventory, shortlist, oracle, mappingContract] = await Promise.all([
    readJson('tests/fixtures/legacy-asset-migration/asset-recovery-inventory.json'),
    readJson('tests/fixtures/legacy-asset-migration/analysis/visual-candidate-shortlist.json'),
    readJson('tests/fixtures/legacy-asset-migration/expected-migration-oracle.json'),
    readJson('project/legacy-asset-mapping-contract.json')
  ]);
  validateLegacyAssetMigrationFixture({ inventory, shortlist, oracle, mappingContract });
  return { inventory, shortlist, oracle, mappingContract };
}

const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  const { inventory, shortlist, oracle } = await loadAndValidateLegacyAssetMigrationFixture();
  console.log(JSON.stringify({
    status: 'pass',
    fixtureId: inventory.fixtureId,
    inputRecords: inventory.files.length,
    shortlistCandidates: shortlist.summary.rankedCandidates,
    includedRecords: oracle.expectedSummary.includedRecords,
    excludedRecords: oracle.expectedSummary.excludedRecords,
    duplicateGroups: oracle.expectedSummary.duplicateGroups,
    automaticMasterApprovals: oracle.expectedSummary.automaticMasterApprovals
  }, null, 2));
}
