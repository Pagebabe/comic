import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadPreparationPackage,
  validatePreparationPackage
} from '../scripts/check_lr5_production_preparation.mjs';

const clonePackage = (pkg) => Object.fromEntries(
  Object.entries(pkg).map(([key, value]) => [
    key,
    {
      ...value,
      json: structuredClone(value.json)
    }
  ])
);

const rejectsWith = async (pkg, code) => {
  await assert.rejects(
    () => validatePreparationPackage(pkg, { verifySourcePins: false }),
    new RegExp(`\\[LR5_PREPARATION:${code}\\]`)
  );
};

test('validates the complete blocked LR5 preparation package and source pins', async () => {
  const pkg = await loadPreparationPackage();
  const summary = await validatePreparationPackage(pkg);

  assert.deepEqual(summary, {
    status: 'LR5_PRODUCTION_PREPARATION_VALID',
    sourcePins: 10,
    characters: 4,
    locations: 4,
    queueStages: 5,
    totalJobs: 26,
    activeJobs: 0,
    panels: 8,
    totalDurationSeconds: 45.5,
    imageGenerationAllowed: false,
    automaticMasterApprovals: 0
  });
});

test('rejects any early image-generation authorization', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  pkg.preparation.json.authorization.imageGenerationAllowed = true;
  await rejectsWith(pkg, 'UNSAFE_AUTHORIZATION');
});

test('rejects a Ricco age regression to a legacy child or younger version', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const ricco = pkg.characters.json.characters.find((item) => item.id === 'char_ricco');
  ricco.age = 20;
  await rejectsWith(pkg, 'RICCO_AGE');
});

test('rejects active generation jobs while the queue is preparation-only', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  pkg.queue.json.queuePolicy.activeJobs = 1;
  await rejectsWith(pkg, 'QUEUE_ACTIVE_JOBS');
});

test('rejects a room topology drift', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const room = pkg.locations.json.locations.find((item) => item.id === 'loc_riccos_zimmer');
  room.candidateDesign.topDownAnchors.window.wall = 'south';
  await rejectsWith(pkg, 'ROOM_WINDOW_WALL');
});

test('rejects an incomplete eight-panel render matrix', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  pkg.panels.json.panels.pop();
  await rejectsWith(pkg, 'PANEL_COUNT');
});

test('rejects removal of the Don Miau speech guard', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const donMiau = pkg.characters.json.characters.find((item) => item.id === 'char_don_miau');
  donMiau.forbidden = donMiau.forbidden.filter((item) => item !== 'speaking mouth');
  await rejectsWith(pkg, 'DON_MIAU_SPEECH_GUARD');
});

test('rejects batch expansion beyond one candidate', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const generationJob = pkg.queue.json.stages
    .flatMap((stage) => stage.jobs)
    .find((job) => job.generation === true);
  generationJob.maximumCandidates = 4;
  await rejectsWith(pkg, 'GENERATION_CANDIDATE_LIMIT');
});
