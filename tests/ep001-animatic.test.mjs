import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const blueprint = JSON.parse(await readFile(new URL('../project/ep001-animatic-blueprint.json', import.meta.url), 'utf8'));
const canon = JSON.parse(await readFile(new URL('../project/canon.json', import.meta.url), 'utf8'));
const ricco = JSON.parse(await readFile(new URL('../project/merge-bibles/ricco.json', import.meta.url), 'utf8'));
const basti = JSON.parse(await readFile(new URL('../project/merge-bibles/basti-prenzl.json', import.meta.url), 'utf8'));
const jule = JSON.parse(await readFile(new URL('../project/merge-bibles/jule.json', import.meta.url), 'utf8'));
const donMiau = JSON.parse(await readFile(new URL('../project/merge-bibles/don-miau.json', import.meta.url), 'utf8'));

const bibleById = new Map([
  [ricco.id, ricco],
  [basti.id, basti],
  [jule.id, jule],
  [donMiau.id, donMiau]
]);

function allLockedLines(bible) {
  return new Set(bible.speech?.lockedLines || []);
}

test('animatic blueprint preserves the exact eight canonical beats', () => {
  assert.equal(blueprint.episode.id, 'ep001');
  assert.equal(blueprint.episode.title, 'Das Zimmer');
  assert.equal(blueprint.panels.length, 8);
  assert.equal(blueprint.format.panelCount, 8);
  assert.deepEqual(blueprint.canonRules.sourceCharacterIds, canon.pilot.coreCharacterIds);
  assert.deepEqual(blueprint.canonRules.sourceLocationIds, canon.pilot.coreLocationIds);
  assert.deepEqual(blueprint.panels.map((panel) => panel.beat), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('animatic duration is deterministic and inside the approved social range', () => {
  const total = blueprint.panels.reduce((sum, panel) => sum + panel.durationSeconds, 0);
  assert.equal(total, 45.5);
  assert.equal(total, blueprint.format.targetDurationSeconds);
  assert.ok(total >= 42 && total <= 50);
  for (const panel of blueprint.panels) {
    assert.ok(panel.durationSeconds >= 4 && panel.durationSeconds <= 7);
  }
});

test('every spoken line comes from the locked character bibles', () => {
  for (const panel of blueprint.panels) {
    for (const line of panel.dialogue) {
      const bible = bibleById.get(line.speakerId);
      assert.ok(bible, `Unknown speaker: ${line.speakerId}`);
      assert.equal(line.source, 'lockedLine');
      assert.ok(allLockedLines(bible).has(line.text), `Unlocked dialogue used: ${line.text}`);
      assert.ok(line.startSeconds >= 0);
      assert.ok(line.endSeconds <= panel.durationSeconds);
      assert.ok(line.endSeconds > line.startSeconds);
    }
  }
});

test('Don Miau remains fully silent and non-human', () => {
  const donLines = blueprint.panels.flatMap((panel) => panel.dialogue).filter((line) => line.speakerId === 'char_don_miau');
  assert.equal(donLines.length, 0);
  assert.match(blueprint.audioRules.donMiauVoice, /No human voice/);
  assert.match(donMiau.speech.rule, /spricht niemals/);
  const donPanels = blueprint.panels.filter((panel) => panel.characterIds.includes('char_don_miau'));
  assert.equal(donPanels.length, 2);
  assert.ok(donPanels.every((panel) => panel.qa.some((item) => item.includes('Don Miau') || item.includes('Katze'))));
});

test('all panels stay inside the four canonical characters and locations', () => {
  const allowedCharacters = new Set(canon.pilot.coreCharacterIds);
  const allowedLocations = new Set(canon.pilot.coreLocationIds);
  for (const panel of blueprint.panels) {
    assert.ok(allowedLocations.has(panel.locationId), `Unexpected location: ${panel.locationId}`);
    assert.ok(panel.characterIds.length >= 1);
    assert.ok(panel.characterIds.every((id) => allowedCharacters.has(id)), `Unexpected character in ${panel.panelId}`);
    assert.ok(panel.assetDependencies.length >= 2);
    assert.ok(panel.qa.length >= 5);
    assert.ok(panel.composition.length > 40);
    assert.ok(panel.cameraMotion.length > 20);
  }
});

test('generated images remain text-free and subtitles stay in assembly', () => {
  assert.equal(blueprint.canonRules.generatedReadableTextAllowed, false);
  assert.equal(blueprint.canonRules.speechBubblesAllowed, false);
  assert.equal(blueprint.audioRules.subtitlesAddedInAssembly, true);
  assert.equal(blueprint.subtitleRules.burnInDuringImageGeneration, false);
  assert.equal(blueprint.subtitleRules.maximumLines, 2);
  assert.ok(blueprint.panels.every((panel) => panel.subtitleWindow === null || panel.subtitleWindow.endSeconds <= panel.durationSeconds));
});

test('render gates remain blocked until visual and audio assets are approved', () => {
  assert.equal(blueprint.status, 'blueprint_ready_assets_blocked');
  assert.equal(blueprint.canonRules.automaticRenderAllowed, false);
  const visualGate = blueprint.productionGates.find((gate) => gate.id === 'gate_visual_masters');
  const audioGate = blueprint.productionGates.find((gate) => gate.id === 'gate_voice_samples');
  const renderGate = blueprint.productionGates.find((gate) => gate.id === 'gate_animatic_render');
  const timingGate = blueprint.productionGates.find((gate) => gate.id === 'gate_timing_readthrough');
  assert.equal(visualGate?.status, 'blocked');
  assert.equal(audioGate?.status, 'blocked');
  assert.equal(renderGate?.status, 'blocked');
  assert.equal(timingGate?.status, 'ready_without_images');
});
