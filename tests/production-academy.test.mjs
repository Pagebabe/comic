import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkProductionAcademy } from '../scripts/check_production_academy.mjs';

const contract = JSON.parse(await readFile(new URL('../project/production-academy.json', import.meta.url), 'utf8'));

test('production academy contract passes repository checker', async () => {
  const report = await checkProductionAcademy({ writeOutput: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.stageCount, 12);
  assert.equal(report.templateCount, 12);
  assert.equal(report.automaticCreativeApprovalAllowed, false);
});

test('production academy has deterministic stage order', () => {
  assert.deepEqual(contract.stages.map((stage) => stage.id), [
    'series_brief',
    'series_bible',
    'character_masters',
    'location_masters',
    'voice_masters',
    'episode_brief',
    'script_lock',
    'shot_animatic',
    'asset_production',
    'audio_post',
    'qa_package',
    'release_handoff'
  ]);
});

test('only the first technical stage allows automatic completion', () => {
  assert.equal(contract.stages[0].automaticApprovalAllowed, true);
  assert.ok(contract.stages.slice(1).every((stage) => stage.automaticApprovalAllowed === false));
});

test('all creative master stages require human approval', () => {
  for (const id of ['series_bible', 'character_masters', 'location_masters', 'voice_masters', 'episode_brief', 'script_lock', 'shot_animatic', 'qa_package', 'release_handoff']) {
    const stage = contract.stages.find((candidate) => candidate.id === id);
    assert.equal(stage.gateType.includes('HUMAN'), true, id);
    assert.equal(stage.automaticApprovalAllowed, false, id);
  }
});

test('training and production modes are explicitly distinct', () => {
  assert.deepEqual(contract.modes.map((mode) => mode.id), ['training', 'production']);
  assert.match(contract.modes[0].description, /TRAINING_ONLY/);
  assert.match(contract.modes[1].description, /nicht automatisch abgeschlossen/);
});

test('day-one plan references only valid stages in chronological order', () => {
  const valid = new Set(contract.stages.map((stage) => stage.id));
  assert.ok(contract.dayOnePlan.every((item) => valid.has(item.stageId)));
  const minutes = contract.dayOnePlan.map((item) => {
    const [hours, mins] = item.time.split(':').map(Number);
    return hours * 60 + mins;
  });
  assert.deepEqual(minutes, [...minutes].sort((a, b) => a - b));
});

test('safety rules prevent false production claims', () => {
  const joined = contract.safetyRules.join('\n');
  assert.match(joined, /TRAINING_ONLY/);
  assert.match(joined, /Human Gates/);
  assert.match(joined, /Dialog/);
  assert.match(joined, /Episode/);
  assert.match(joined, /Growth-OS-Branch/);
});
