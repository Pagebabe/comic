import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const project = JSON.parse(await readFile(new URL('../project/project.json', import.meta.url), 'utf8'));
const prep = JSON.parse(await readFile(new URL('../project/visual-preproduction.json', import.meta.url), 'utf8'));
const canon = JSON.parse(await readFile(new URL('../project/canon.json', import.meta.url), 'utf8'));

const expectedCharacters = ['char_ricco', 'char_basti', 'char_jule', 'char_don_miau'];
const expectedLocations = ['loc_haus_fassade', 'loc_riccos_zimmer', 'loc_flur', 'loc_kueche'];

test('visual generation stays paused without claiming canon masters', () => {
  assert.equal(prep.status, 'preproduction_ready_generation_paused');
  assert.equal(prep.generator.status, 'paused_external_capacity');
  assert.equal(prep.generator.allowedNow, false);
  assert.equal(prep.generator.automaticCanonApproval, false);
  assert.equal(prep.approvalGate.masterReferenceFieldsMustRemainNull, true);
  assert.equal(project.inventory.visualCharacterMastersLocked, 0);
  assert.equal(project.inventory.trustedRecoveredVisualMasters, 0);
  assert.match(project.activeGoal, /Bildgenerierung bleibt pausiert/);
});

test('all four core characters have locked briefs and no missing review gates', () => {
  assert.deepEqual(prep.characterSheets.map((item) => item.id), expectedCharacters);
  assert.equal(prep.characterSheets.length, 4);
  for (const sheet of prep.characterSheets) {
    assert.equal(sheet.status, 'brief_locked_image_pending');
    assert.ok(sheet.requiredViews.length >= 5, `${sheet.id} needs at least five views`);
    assert.ok(sheet.requiredExpressions.length >= 4, `${sheet.id} needs at least four expressions`);
    assert.ok(sheet.requiredIdentifiers.length >= 6, `${sheet.id} needs locked identifiers`);
    assert.ok(sheet.forbidden.length >= 6, `${sheet.id} needs explicit negative constraints`);
    assert.ok(sheet.approvalTests.length >= 5, `${sheet.id} needs explicit approval tests`);
  }
  assert.equal(project.inventory.characterVisualBriefsReady, 4);
});

test('all four pilot locations have stable layout requirements', () => {
  assert.deepEqual(prep.locationSheets.map((item) => item.id), expectedLocations);
  assert.equal(prep.locationSheets.length, 4);
  for (const sheet of prep.locationSheets) {
    assert.equal(sheet.status, 'brief_ready_image_pending');
    assert.ok(sheet.requiredViews.length >= 5, `${sheet.id} needs five planned views`);
    assert.ok(sheet.lockedElements.length >= 5, `${sheet.id} needs locked set elements`);
    assert.ok(sheet.approvalTests.length >= 5, `${sheet.id} needs approval tests`);
  }
  assert.equal(project.inventory.locationVisualBriefsReady, 4);
});

test('Ricco is the only allowed first generation target', () => {
  assert.equal(prep.generationOrder[0], 'Ricco silhouette exploration');
  assert.equal(prep.generationOrder[1], 'Ricco full character sheet');
  assert.equal(prep.approvalGate.noBatchExpansionBeforeRiccoLock, true);
  const generationTask = project.activeTasks.find((item) => item.id === 'generation');
  assert.equal(generationTask?.state, 'paused');
  assert.match(generationTask?.note || '', /Keine Ersatzgenerierung/);
});

test('preproduction preserves series and style canon', () => {
  assert.equal(prep.series.title, canon.series.title);
  assert.ok(prep.series.styleRules.some((rule) => rule.includes('Dicke schwarze Konturen')));
  assert.ok(prep.series.styleRules.some((rule) => rule.includes('Keine Fotorealistik')));
  assert.ok(prep.series.generatedFrameRules.includes('No speech bubbles'));
  assert.ok(prep.series.generatedFrameRules.includes('No automatic master-reference assignment'));
  assert.deepEqual(canon.pilot.coreCharacterIds, expectedCharacters);
  assert.deepEqual(canon.pilot.coreLocationIds, expectedLocations);
});
