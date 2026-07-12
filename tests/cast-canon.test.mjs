import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (file) => JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));
const canon = await readJson('project/cast-canon-v1.json');
const productionSheets = await readJson('project/character-production-sheets.json');
const loraSheets = await readJson('project/lora-training-sheets.json');
const cockpit = await readJson('project/production-cockpit-v1.json');
const truth = await readJson('project/truth-state.json');
const decision = await readJson('project/pilot-decision-record.json');

const universeNames = [
  'Rico Bassmann', 'Falk Reuter', 'Sami', 'Madame Rita', 'Kira', 'Olli',
  'DJ Krätze', 'DJ Nebel', 'Sven Null', 'Mutti', 'Kralle', 'Möpse', 'Flitz'
];
const pilotNames = ['Ricco', 'Basti Prenzl', 'Jule', 'Don Miau'];

test('series universe contains exactly 13 documented legacy and asset records', () => {
  assert.equal(canon.status, 'CAST_SCOPE_SEPARATED_REVIEW_REQUIRED');
  assert.equal(canon.seriesUniverse.length, 13);
  assert.deepEqual(canon.seriesUniverse.map((character) => character.name), universeNames);
  assert.ok(canon.seriesUniverse.every((character) => character.status === 'documented_series_universe_legacy_inventory'));
});

test('Das Zimmer keeps exactly four active pilot characters', () => {
  assert.equal(canon.selectedPilot.id, 'pilot-das-zimmer');
  assert.equal(canon.selectedPilot.title, 'Das Zimmer');
  assert.equal(truth.canon.selectedPilot, 'pilot-das-zimmer');
  assert.equal(decision.selectedCandidateId, 'pilot-das-zimmer');
  assert.equal(canon.activePilotCast.length, 4);
  assert.deepEqual(canon.activePilotCast.map((character) => character.name), pilotNames);
  assert.ok(canon.activePilotCast.every((character) => character.status === 'active_selected_pilot_cast_review_required'));
});

test('pilot cast is explicitly referenced without automatic historical fusion', () => {
  const universeIds = new Set(canon.seriesUniverse.map((character) => character.id));
  for (const character of canon.activePilotCast) {
    assert.ok(character.seriesUniverseReference.status);
    assert.ok(character.seriesUniverseReference.referencedCharacterIds.every((id) => universeIds.has(id)));
  }
  assert.equal(canon.activePilotCast.find((character) => character.id === 'char_jule').seriesUniverseReference.status, 'selected_pilot_reference_without_confirmed_legacy_mapping');
});

test('series and pilot IDs are collision-free in and across scopes', () => {
  const universeIds = canon.seriesUniverse.map((character) => character.id);
  const pilotIds = canon.activePilotCast.map((character) => character.id);
  const allIds = [...universeIds, ...pilotIds];
  assert.equal(new Set(universeIds).size, 13);
  assert.equal(new Set(pilotIds).size, 4);
  assert.equal(new Set(allIds).size, 17);
  assert.ok(allIds.every((id) => /^char_[a-z0-9_]+$/.test(id)));
});

test('legacy asset inventory keeps nine production sheets and six LoRA sheets without changing the pilot cast', () => {
  const productionIds = new Set(productionSheets.map((sheet) => sheet.character_id));
  const loraIds = new Set(loraSheets.map((sheet) => sheet.character_id));
  assert.equal(productionSheets.length, 9);
  assert.equal(loraSheets.length, 6);
  assert.equal(canon.legacyAssetInventory.characterCount, 13);
  assert.equal(canon.seriesUniverse.filter((character) => character.productionSheet.status === 'present').length, 9);
  assert.equal(canon.seriesUniverse.filter((character) => character.loraTrainingSheet.status === 'present').length, 6);
  for (const character of canon.seriesUniverse) {
    assert.equal(character.productionSheet.status === 'present', productionIds.has(character.id));
    assert.equal(character.loraTrainingSheet.status === 'present', loraIds.has(character.id));
  }
});

test('no visual or reference master is automatically approved', () => {
  assert.equal(canon.counts.verifiedReferenceImages, 0);
  assert.equal(canon.counts.approvedVisualMasters, 0);
  assert.equal(canon.approvedCharacterMasters.length, 0);
  assert.equal(canon.approvedVisualMasters.length, 0);
  assert.equal(canon.approvedLocationMasters.length, 0);
  assert.equal(canon.approvedVoiceMasters.length, 0);
  assert.ok(canon.seriesUniverse.every((character) => character.referenceImages.status === 'unverified'));
  assert.ok(canon.seriesUniverse.every((character) => character.visualMaster.status === 'not_approved'));
  assert.ok(canon.activePilotCast.every((character) => character.characterMaster.status === 'not_approved'));
  assert.ok(canon.activePilotCast.every((character) => character.referenceImages.status === 'unverified'));
});

test('M1 proof and growth or publishing boundaries remain closed', () => {
  const m1Proof = canon.technicalProofs.find((proof) => proof.id === 'm1-life-sign');
  assert.equal(m1Proof?.characterLockGranted, false);
  assert.equal(m1Proof?.visualMasterGranted, false);
  assert.equal(canon.boundaries.growthOsIntegrated, false);
  assert.equal(canon.boundaries.livePublishingAllowed, false);
  assert.ok(Object.values(canon.boundaries).every((value) => value === false));
});

test('cockpit counters follow the separated scopes', () => {
  assert.equal(cockpit.counts.seriesUniverseCharacters, 13);
  assert.equal(cockpit.counts.activePilotCastCharacters, 4);
  assert.equal(cockpit.counts.legacyAssetInventoryCharacters, 13);
  assert.equal(cockpit.counts.characterMastersRequired, 4);
  assert.equal(cockpit.counts.characterMastersApproved, 0);
  assert.equal(cockpit.counts.locationMastersApproved, 0);
  assert.equal(cockpit.counts.voiceMastersApproved, 0);
  assert.equal(cockpit.counts.approvedVisualMasters, 0);
  assert.equal(cockpit.counts.verifiedReferenceImages, 0);
});
