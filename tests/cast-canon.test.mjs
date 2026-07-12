import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (file) => JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8'));
const canon = await readJson('project/cast-canon-v1.json');
const productionSheets = await readJson('project/character-production-sheets.json');
const loraSheets = await readJson('project/lora-training-sheets.json');
const cockpit = await readJson('project/production-cockpit-v1.json');

const activeNames = [
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

const variantNames = ['Ricco', 'Basti Prenzl', 'Jule', 'Don Miau'];

test('cast canon contains the exact 13 confirmed active characters', () => {
  assert.equal(canon.status, 'CANON_LOCKED_ASSET_REVIEW_REQUIRED');
  assert.equal(canon.activeCast.length, 13);
  assert.deepEqual(canon.activeCast.map((character) => character.name), activeNames);
  assert.ok(canon.activeCast.every((character) => character.status === 'confirmed_active_canon'));
});

test('four-character pilot set remains a non-approved variant', () => {
  assert.equal(canon.variantCast.length, 4);
  assert.deepEqual(canon.variantCast.map((character) => character.name), variantNames);
  assert.ok(canon.variantCast.every((character) => character.status === 'variant_not_approved_main_canon'));
  assert.equal(canon.variantCast.some((character) => activeNames.includes(character.name)), false);
});

test('active and variant IDs are unique and collision-free', () => {
  const ids = [...canon.activeCast, ...canon.variantCast].map((character) => character.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^char_[a-z0-9_]+$/.test(id)));
});

test('nine production sheets and six LoRA sheets are linked without invention', () => {
  const productionIds = new Set(productionSheets.map((sheet) => sheet.character_id));
  const loraIds = new Set(loraSheets.map((sheet) => sheet.character_id));
  assert.equal(productionSheets.length, 9);
  assert.equal(loraSheets.length, 6);
  assert.equal(canon.activeCast.filter((character) => character.productionSheet.status === 'present').length, 9);
  assert.equal(canon.activeCast.filter((character) => character.loraTrainingSheet.status === 'present').length, 6);
  for (const character of canon.activeCast) {
    assert.equal(character.productionSheet.status === 'present', productionIds.has(character.id));
    assert.equal(character.loraTrainingSheet.status === 'present', loraIds.has(character.id));
  }
});

test('missing and unverified asset details remain visible', () => {
  assert.equal(canon.counts.productionSheetsMissing, 4);
  assert.equal(canon.counts.loraTrainingSheetsMissing, 7);
  assert.equal(canon.counts.verifiedReferenceImages, 0);
  assert.equal(canon.counts.trustedVisualMasters, 0);
  assert.ok(canon.activeCast.every((character) => character.referenceImages.status === 'unverified'));
  assert.ok(canon.activeCast.every((character) => character.visualMaster.status === 'missing'));
});

test('M1 proof cannot become a character or visual lock', () => {
  const m1Proof = canon.technicalProofs.find((proof) => proof.id === 'm1-life-sign');
  assert.equal(m1Proof?.status, 'technical_proof_not_character_lock');
  assert.equal(m1Proof?.characterLockGranted, false);
  assert.equal(m1Proof?.visualMasterGranted, false);
});

test('dashboard inventory counters are derived from the canon source', () => {
  assert.equal(cockpit.counts.activeCanonCharacters, canon.counts.activeCanonCharacters);
  assert.equal(cockpit.counts.variantCharacters, canon.counts.variantCharacters);
  assert.equal(cockpit.counts.productionSheetsAvailable, canon.counts.productionSheetsAvailable);
  assert.equal(cockpit.counts.loraTrainingSheetsAvailable, canon.counts.loraTrainingSheetsAvailable);
  assert.equal(cockpit.counts.characterMastersRequired, canon.counts.activeCanonCharacters);
  assert.equal(cockpit.counts.characterMastersApproved, 0);
});
