import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const fail = (code, message) => {
  throw new Error(`[CAST_CANON:${code}] ${message}`);
};
const assert = (condition, code, message) => {
  if (!condition) fail(code, message);
};

const [canon, productionSheets, loraSheets, cockpit] = await Promise.all([
  readJson('project/cast-canon-v1.json'),
  readJson('project/character-production-sheets.json'),
  readJson('project/lora-training-sheets.json'),
  readJson('project/production-cockpit-v1.json')
]);

const expectedActiveNames = [
  'Rico Bassmann',
  'Falk Reuter',
  'Sami',
  'Madame Rita',
  'Kira',
  'Olli',
  'DJ Krätze',
  'DJ Nebel',
  'Sven Null',
  'Mutti',
  'Kralle',
  'Möpse',
  'Flitz'
];
const expectedVariantNames = ['Ricco', 'Basti Prenzl', 'Jule', 'Don Miau'];

assert(canon.schemaVersion === 1, 'SCHEMA', 'schemaVersion must be 1');
assert(canon.canonId === 'comic-factory-cast-canon-v1', 'CANON_ID', 'unexpected canonId');
assert(canon.repository === 'Pagebabe/comic', 'REPOSITORY', 'repository scope drifted');
assert(canon.status === 'CANON_LOCKED_ASSET_REVIEW_REQUIRED', 'STATUS', 'canon must remain locked with asset review open');
assert(Array.isArray(canon.activeCast), 'ACTIVE_CAST', 'activeCast must be an array');
assert(Array.isArray(canon.variantCast), 'VARIANT_CAST', 'variantCast must be an array');
assert(canon.activeCast.length === 13, 'ACTIVE_COUNT', `expected 13 active characters, got ${canon.activeCast.length}`);
assert(canon.variantCast.length === 4, 'VARIANT_COUNT', `expected 4 variant characters, got ${canon.variantCast.length}`);

const activeNames = canon.activeCast.map((character) => character.name);
const variantNames = canon.variantCast.map((character) => character.name);
assert(JSON.stringify(activeNames) === JSON.stringify(expectedActiveNames), 'ACTIVE_NAMES', 'active cast order or names drifted');
assert(JSON.stringify(variantNames) === JSON.stringify(expectedVariantNames), 'VARIANT_NAMES', 'variant cast order or names drifted');
assert(canon.activeCast.every((character) => character.status === 'confirmed_active_canon'), 'ACTIVE_STATUS', 'all active characters must be confirmed_active_canon');
assert(canon.variantCast.every((character) => character.status === 'variant_not_approved_main_canon'), 'VARIANT_STATUS', 'all variants must be explicitly non-approved');

const allIds = [...canon.activeCast, ...canon.variantCast].map((character) => character.id);
assert(new Set(allIds).size === allIds.length, 'ID_COLLISION', 'active and variant character IDs must be unique');
assert(canon.activeCast.every((character) => /^char_[a-z0-9_]+$/.test(character.id)), 'ACTIVE_ID_FORMAT', 'active IDs must use char_* snake_case');
assert(canon.variantCast.every((character) => /^char_[a-z0-9_]+$/.test(character.id)), 'VARIANT_ID_FORMAT', 'variant IDs must use char_* snake_case');

const productionIds = new Set(productionSheets.map((sheet) => sheet.character_id));
const loraIds = new Set(loraSheets.map((sheet) => sheet.character_id));
assert(productionSheets.length === 9, 'PRODUCTION_SOURCE_COUNT', `expected 9 source production sheets, got ${productionSheets.length}`);
assert(loraSheets.length === 6, 'LORA_SOURCE_COUNT', `expected 6 source LoRA sheets, got ${loraSheets.length}`);
assert(new Set(productionSheets.map((sheet) => sheet.character_id)).size === productionSheets.length, 'PRODUCTION_DUPLICATE_ID', 'production sheet IDs must be unique');
assert(new Set(loraSheets.map((sheet) => sheet.character_id)).size === loraSheets.length, 'LORA_DUPLICATE_ID', 'LoRA sheet IDs must be unique');

for (const character of canon.activeCast) {
  const productionPresent = character.productionSheet?.status === 'present';
  const loraPresent = character.loraTrainingSheet?.status === 'present';
  assert(productionPresent === productionIds.has(character.id), 'PRODUCTION_LINK', `${character.id} production sheet link contradicts source`);
  assert(loraPresent === loraIds.has(character.id), 'LORA_LINK', `${character.id} LoRA link contradicts source`);
  assert(['unverified', 'missing'].includes(character.referenceImages?.status), 'REFERENCE_STATUS', `${character.id} reference image status must stay unverified or missing`);
  assert(character.visualMaster?.status === 'missing', 'VISUAL_MASTER', `${character.id} must not claim a visual master`);
}

const presentProductionCount = canon.activeCast.filter((character) => character.productionSheet.status === 'present').length;
const presentLoraCount = canon.activeCast.filter((character) => character.loraTrainingSheet.status === 'present').length;
assert(presentProductionCount === 9, 'PRODUCTION_COUNT', `canon links ${presentProductionCount} production sheets instead of 9`);
assert(presentLoraCount === 6, 'LORA_COUNT', `canon links ${presentLoraCount} LoRA sheets instead of 6`);
assert(canon.counts.activeCanonCharacters === 13, 'COUNT_ACTIVE', 'counts.activeCanonCharacters must be 13');
assert(canon.counts.variantCharacters === 4, 'COUNT_VARIANTS', 'counts.variantCharacters must be 4');
assert(canon.counts.productionSheetsAvailable === 9, 'COUNT_PRODUCTION', 'counts.productionSheetsAvailable must be 9');
assert(canon.counts.productionSheetsMissing === 4, 'COUNT_PRODUCTION_MISSING', 'counts.productionSheetsMissing must be 4');
assert(canon.counts.loraTrainingSheetsAvailable === 6, 'COUNT_LORA', 'counts.loraTrainingSheetsAvailable must be 6');
assert(canon.counts.loraTrainingSheetsMissing === 7, 'COUNT_LORA_MISSING', 'counts.loraTrainingSheetsMissing must be 7');
assert(canon.counts.trustedVisualMasters === 0, 'COUNT_MASTERS', 'trusted visual masters must stay 0');

for (const proof of canon.technicalProofs || []) {
  assert(proof.characterLockGranted === false, 'TECH_PROOF_CHARACTER_LOCK', `${proof.id} cannot grant a character lock`);
  assert(proof.visualMasterGranted === false, 'TECH_PROOF_VISUAL_MASTER', `${proof.id} cannot grant a visual master`);
}
assert(Object.values(canon.boundaries).every((value) => value === false), 'BOUNDARY_OPEN', 'all canon safety boundaries must remain false');

const dashboardCounts = cockpit.counts || {};
assert(dashboardCounts.activeCanonCharacters === canon.counts.activeCanonCharacters, 'DASHBOARD_ACTIVE_COUNT', 'dashboard active cast count contradicts canon');
assert(dashboardCounts.variantCharacters === canon.counts.variantCharacters, 'DASHBOARD_VARIANT_COUNT', 'dashboard variant count contradicts canon');
assert(dashboardCounts.productionSheetsAvailable === canon.counts.productionSheetsAvailable, 'DASHBOARD_PRODUCTION_COUNT', 'dashboard production sheet count contradicts canon');
assert(dashboardCounts.loraTrainingSheetsAvailable === canon.counts.loraTrainingSheetsAvailable, 'DASHBOARD_LORA_COUNT', 'dashboard LoRA count contradicts canon');
assert(dashboardCounts.characterMastersRequired === canon.counts.activeCanonCharacters, 'DASHBOARD_REQUIRED_MASTERS', 'dashboard character master target must equal active cast count');
assert(dashboardCounts.characterMastersApproved === 0, 'DASHBOARD_APPROVED_MASTERS', 'dashboard must not claim approved character masters');

console.log(JSON.stringify({
  status: 'pass',
  canonId: canon.canonId,
  activeCanonCharacters: canon.activeCast.length,
  variantCharacters: canon.variantCast.length,
  productionSheetsAvailable: presentProductionCount,
  loraTrainingSheetsAvailable: presentLoraCount,
  trustedVisualMasters: canon.counts.trustedVisualMasters,
  idCollisions: 0
}));
