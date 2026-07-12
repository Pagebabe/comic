import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const fail = (code, message) => { throw new Error(`[CAST_CANON:${code}] ${message}`); };
const assert = (condition, code, message) => { if (!condition) fail(code, message); };

const [canon, productionSheets, loraSheets, cockpit, truth, decision] = await Promise.all([
  readJson('project/cast-canon-v1.json'),
  readJson('project/character-production-sheets.json'),
  readJson('project/lora-training-sheets.json'),
  readJson('project/production-cockpit-v1.json'),
  readJson('project/truth-state.json'),
  readJson('project/pilot-decision-record.json')
]);

const expectedUniverseNames = [
  'Rico Bassmann', 'Falk Reuter', 'Sami', 'Madame Rita', 'Kira', 'Olli',
  'DJ Krätze', 'DJ Nebel', 'Sven Null', 'Mutti', 'Kralle', 'Möpse', 'Flitz'
];
const expectedPilotNames = ['Ricco', 'Basti Prenzl', 'Jule', 'Don Miau'];

assert(canon.schemaVersion === 2, 'SCHEMA', 'schemaVersion must be 2');
assert(canon.canonId === 'comic-factory-cast-scope-v2', 'CANON_ID', 'unexpected canonId');
assert(canon.repository === 'Pagebabe/comic', 'REPOSITORY', 'repository scope drifted');
assert(canon.status === 'CAST_SCOPE_SEPARATED_REVIEW_REQUIRED', 'STATUS', 'cast scopes must remain separated with review open');
assert(canon.selectedPilot?.id === 'pilot-das-zimmer' && canon.selectedPilot?.title === 'Das Zimmer', 'PILOT', 'selected pilot must remain Das Zimmer');
assert(truth.canon?.selectedPilot === 'pilot-das-zimmer' && truth.canon?.selectedTitle === 'Das Zimmer', 'TRUTH_PILOT', 'truth-state pilot changed');
assert(decision.selectedCandidateId === 'pilot-das-zimmer' && decision.selectedTitle === 'Das Zimmer', 'DECISION_PILOT', 'pilot decision record changed');

assert(Array.isArray(canon.seriesUniverse), 'SERIES_UNIVERSE', 'seriesUniverse must be an array');
assert(Array.isArray(canon.activePilotCast), 'ACTIVE_PILOT_CAST', 'activePilotCast must be an array');
assert(canon.seriesUniverse.length === 13, 'SERIES_COUNT', `expected 13 series-universe characters, got ${canon.seriesUniverse.length}`);
assert(canon.activePilotCast.length === 4, 'PILOT_COUNT', `expected 4 active pilot characters, got ${canon.activePilotCast.length}`);
assert(JSON.stringify(canon.seriesUniverse.map((character) => character.name)) === JSON.stringify(expectedUniverseNames), 'SERIES_NAMES', 'series-universe order or names drifted');
assert(JSON.stringify(canon.activePilotCast.map((character) => character.name)) === JSON.stringify(expectedPilotNames), 'PILOT_NAMES', 'active pilot cast order or names drifted');
assert(canon.seriesUniverse.every((character) => character.status === 'documented_series_universe_legacy_inventory'), 'SERIES_STATUS', 'series-universe records must not be presented as active pilot cast');
assert(canon.activePilotCast.every((character) => character.status === 'active_selected_pilot_cast_review_required'), 'PILOT_STATUS', 'all four pilot characters must remain active and review-required');

const universeIds = new Set(canon.seriesUniverse.map((character) => character.id));
const pilotIds = new Set(canon.activePilotCast.map((character) => character.id));
assert(universeIds.size === 13, 'SERIES_ID_COLLISION', 'series-universe IDs must be unique');
assert(pilotIds.size === 4, 'PILOT_ID_COLLISION', 'active pilot cast IDs must be unique');
assert(new Set([...universeIds, ...pilotIds]).size === 17, 'CROSS_SCOPE_ID_COLLISION', 'series-universe and active-pilot IDs must not collide');
assert([...universeIds, ...pilotIds].every((id) => /^char_[a-z0-9_]+$/.test(id)), 'ID_FORMAT', 'IDs must use char_* snake_case');

for (const character of canon.activePilotCast) {
  const reference = character.seriesUniverseReference;
  assert(reference && typeof reference.status === 'string', 'PILOT_REFERENCE', `${character.id} needs an explicit series-universe reference status`);
  assert(Array.isArray(reference.referencedCharacterIds), 'PILOT_REFERENCE_IDS', `${character.id} reference IDs must be an array`);
  assert(reference.referencedCharacterIds.every((id) => universeIds.has(id)), 'PILOT_REFERENCE_UNKNOWN', `${character.id} references an unknown series-universe ID`);
  assert(character.characterMaster?.status === 'not_approved', 'PILOT_MASTER', `${character.id} must not claim a character master`);
  assert(character.referenceImages?.status === 'unverified', 'PILOT_REFERENCE_IMAGE', `${character.id} reference images must stay unverified`);
}

const productionIds = new Set(productionSheets.map((sheet) => sheet.character_id));
const loraIds = new Set(loraSheets.map((sheet) => sheet.character_id));
assert(productionSheets.length === 9, 'PRODUCTION_SOURCE_COUNT', `expected 9 source production sheets, got ${productionSheets.length}`);
assert(loraSheets.length === 6, 'LORA_SOURCE_COUNT', `expected 6 source LoRA sheets, got ${loraSheets.length}`);
assert(productionIds.size === productionSheets.length, 'PRODUCTION_DUPLICATE_ID', 'production sheet IDs must be unique');
assert(loraIds.size === loraSheets.length, 'LORA_DUPLICATE_ID', 'LoRA sheet IDs must be unique');

for (const character of canon.seriesUniverse) {
  assert((character.productionSheet?.status === 'present') === productionIds.has(character.id), 'PRODUCTION_LINK', `${character.id} production sheet link contradicts source`);
  assert((character.loraTrainingSheet?.status === 'present') === loraIds.has(character.id), 'LORA_LINK', `${character.id} LoRA link contradicts source`);
  assert(character.referenceImages?.status === 'unverified', 'REFERENCE_STATUS', `${character.id} reference image status must remain unverified`);
  assert(character.visualMaster?.status === 'not_approved', 'VISUAL_MASTER', `${character.id} must not claim a visual master`);
}

assert(canon.legacyAssetInventory?.characterCount === 13, 'LEGACY_COUNT', 'legacy asset inventory must contain 13 character records');
assert(canon.legacyAssetInventory?.verifiedReferenceImageCount === 0, 'LEGACY_REFERENCE_IMAGES', 'verified legacy reference images must remain 0');
for (const field of ['approvedCharacterMasters', 'approvedVisualMasters', 'approvedLocationMasters', 'approvedVoiceMasters']) {
  assert(Array.isArray(canon[field]) && canon[field].length === 0, 'APPROVAL_ARRAY', `${field} must remain an empty array`);
}
assert(canon.counts.seriesUniverseCharacters === 13, 'COUNT_SERIES', 'series universe count must be 13');
assert(canon.counts.activePilotCastCharacters === 4, 'COUNT_PILOT', 'active pilot cast count must be 4');
assert(canon.counts.approvedVisualMasters === 0 && canon.counts.trustedVisualMasters === 0, 'COUNT_MASTERS', 'visual master counts must remain 0');
assert(canon.counts.verifiedReferenceImages === 0, 'COUNT_REFERENCE_IMAGES', 'verified reference images must remain 0');

for (const proof of canon.technicalProofs || []) {
  assert(proof.characterLockGranted === false, 'TECH_PROOF_CHARACTER_LOCK', `${proof.id} cannot grant a character lock`);
  assert(proof.visualMasterGranted === false, 'TECH_PROOF_VISUAL_MASTER', `${proof.id} cannot grant a visual master`);
}
assert(Object.values(canon.boundaries).every((value) => value === false), 'BOUNDARY_OPEN', 'all canon safety boundaries must remain false');

const dashboardCounts = cockpit.counts || {};
assert(dashboardCounts.seriesUniverseCharacters === 13, 'DASHBOARD_SERIES_COUNT', 'dashboard series-universe count must be 13');
assert(dashboardCounts.activePilotCastCharacters === 4, 'DASHBOARD_PILOT_COUNT', 'dashboard active pilot count must be 4');
assert(dashboardCounts.legacyAssetInventoryCharacters === 13, 'DASHBOARD_LEGACY_COUNT', 'dashboard legacy inventory count must be 13');
assert(dashboardCounts.characterMastersRequired === 4, 'DASHBOARD_REQUIRED_MASTERS', 'character master target must follow the four-character pilot cast');
assert(dashboardCounts.characterMastersApproved === 0, 'DASHBOARD_APPROVED_MASTERS', 'dashboard must not claim approved character masters');
assert(dashboardCounts.approvedVisualMasters === 0 && dashboardCounts.verifiedReferenceImages === 0, 'DASHBOARD_VISUAL_STATE', 'dashboard visual approvals must remain 0');

console.log(JSON.stringify({
  status: 'pass',
  canonId: canon.canonId,
  selectedPilot: canon.selectedPilot.title,
  seriesUniverseCharacters: canon.seriesUniverse.length,
  activePilotCastCharacters: canon.activePilotCast.length,
  legacyAssetInventoryCharacters: canon.legacyAssetInventory.characterCount,
  approvedVisualMasters: canon.approvedVisualMasters.length,
  verifiedReferenceImages: canon.counts.verifiedReferenceImages,
  idCollisions: 0
}));
