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

test('validates the source-bound Ricco candidate package and all production locks', async () => {
  const pkg = await loadPreparationPackage();
  const summary = await validatePreparationPackage(pkg);

  assert.deepEqual(summary, {
    status: 'LR5_REFERENCE_CANDIDATE_BINDING_VALID',
    sourcePins: 10,
    characters: 4,
    locations: 4,
    queueStages: 5,
    totalJobs: 26,
    activeJobs: 0,
    panels: 8,
    totalDurationSeconds: 45.5,
    riccoReferenceCandidates: 1,
    riccoMasters: 0,
    imageBytesInRepository: 0,
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

test('rejects drift of the bound Ricco SHA-256', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  pkg.preparation.json.riccoReferenceCandidate.sourceSha256 = '0'.repeat(64);
  await rejectsWith(pkg, 'RICCO_PREPARATION_SHA256');
});

test('rejects a hidden master approval on the reference candidate', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const ricco = pkg.characters.json.characters.find((item) => item.id === 'char_ricco');
  ricco.referenceCandidate.approvedMaster = true;
  await rejectsWith(pkg, 'RICCO_CHARACTER_MASTER_STATUS');
});

test('rejects repository image bytes in the metadata-only binding package', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  pkg.preparation.json.truthCounters.imageBytesInRepository = 1;
  await rejectsWith(pkg, 'REPOSITORY_IMAGE_BYTES_COUNTER');
});

test('rejects active generation jobs while the queue remains locked', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  pkg.queue.json.queuePolicy.activeJobs = 1;
  await rejectsWith(pkg, 'QUEUE_ACTIVE_JOBS');
});

test('rejects reopening the completed cloud-review stage', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const stage0 = pkg.queue.json.stages.find((item) => item.stageId === 'S0_EXISTING_ASSET_REVIEW');
  stage0.status = 'LOCAL_EXECUTION_REQUIRED';
  await rejectsWith(pkg, 'S0_STATUS');
});

test('rejects activating Ricco consistency views without a new authorization', async () => {
  const pkg = clonePackage(await loadPreparationPackage());
  const stage1 = pkg.queue.json.stages.find((item) => item.stageId === 'S1_RICCO_REFERENCE');
  const job = stage1.jobs.find((item) => item.jobId === 'ricco_consistency_views');
  job.status = 'READY';
  await rejectsWith(pkg, 'GENERATION_JOB_NOT_BLOCKED');
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
