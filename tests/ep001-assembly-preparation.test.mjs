import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  exportAssemblyPackage,
  loadAssemblyPackage,
  validateAssemblyPackage
} from '../scripts/export_ep001_assembly_package.mjs';

const clonePackage = (pkg) => Object.fromEntries(
  Object.entries(pkg).map(([key, value]) => [
    key,
    {
      ...value,
      raw: Buffer.from(value.raw),
      json: value.json === null ? null : structuredClone(value.json)
    }
  ])
);

const rejectsWith = async (pkg, code) => {
  await assert.rejects(
    () => validateAssemblyPackage(pkg, { verifySourcePins: false }),
    new RegExp(`\\[EP001_ASSEMBLY:${code}\\]`)
  );
};

test('validates the blocked EP001 assembly contract and source pins', async () => {
  const summary = await validateAssemblyPackage(await loadAssemblyPackage());
  assert.deepEqual(summary, {
    status: 'EP001_ASSEMBLY_PREPARATION_VALID',
    sourcePins: 5,
    visualSlots: 8,
    audioSlots: 7,
    subtitleCues: 10,
    durationSeconds: 45.5,
    renderExecutable: false,
    finishedEpisodes: 0,
    automaticFinalApprovals: 0
  });
});

test('exports a deterministic blocked assembly package without media', async () => {
  const outputDir = await fsTemp('ep001-assembly-');
  try {
    const result = await exportAssemblyPackage({ outputDir });
    assert.equal(result.summary.status, 'EP001_ASSEMBLY_PREPARATION_VALID');

    const manifest = JSON.parse(await readFile(path.join(outputDir, 'ep001-assembly-manifest.json'), 'utf8'));
    const renderPlan = JSON.parse(await readFile(path.join(outputDir, 'ep001-render-plan.json'), 'utf8'));
    const subtitles = await readFile(path.join(outputDir, 'ep001-subtitles.srt'), 'utf8');
    const checklist = await readFile(path.join(outputDir, 'ep001-handoff-checklist.md'), 'utf8');

    assert.equal(manifest.status, 'MEDIA_BLOCKED');
    assert.equal(manifest.visualSlots.length, 8);
    assert.equal(manifest.audioSlots.length, 7);
    assert.equal(manifest.mediaRenderAllowed, false);
    assert.equal(renderPlan.executable, false);
    assert.equal(renderPlan.shellCommand, null);
    assert.equal((subtitles.match(/-->/g) || []).length, 10);
    assert.match(checklist, /No unchecked item may be inferred as complete/);
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('rejects media render authorization', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.contract.json.authorization.mediaRenderAllowed = true;
  await rejectsWith(pkg, 'UNSAFE_AUTHORIZATION');
});

test('rejects an early visual hash or approval', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.contract.json.visualSlots[0].sourceSha256 = 'a'.repeat(64);
  await rejectsWith(pkg, 'VISUAL_SLOT_DRIFT');
});

test('rejects a missing panel slot', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.contract.json.visualSlots.pop();
  await rejectsWith(pkg, 'VISUAL_SLOT_COUNT');
});

test('rejects audio stem drift', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.contract.json.audioSlots[0].status = 'READY';
  await rejectsWith(pkg, 'AUDIO_SLOT_DRIFT');
});

test('rejects an executable render plan', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.contract.json.renderPlan.executable = true;
  await rejectsWith(pkg, 'RENDER_PLAN_EXECUTABLE');
});

test('rejects subtitle timing or text drift', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.cues.json.dialogueCues[0].text = 'Geänderter Text';
  await rejectsWith(pkg, 'CUE_SHEET_DRIFT');
});

test('rejects a production-ready claim before the episode exists', async () => {
  const pkg = clonePackage(await loadAssemblyPackage());
  pkg.readiness.json.status = 'PRODUCTION_READY';
  await rejectsWith(pkg, 'READINESS_STATUS');
});

async function fsTemp(prefix) {
  const { mkdtemp } = await import('node:fs/promises');
  return mkdtemp(path.join(os.tmpdir(), prefix));
}
