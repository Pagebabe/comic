import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

const manualFiles = [
  'docs/OPERATOR_MANUAL_V1.md',
  'docs/operator/00_START_HERE.md',
  'docs/operator/01_SETUP_AND_DAILY_FLOW.md',
  'docs/operator/02_PRODUCTION_PIPELINE.md',
  'docs/operator/03_QA_RECOVERY_EXPORT.md',
  'docs/operator/04_ACCEPTANCE.md',
  'docs/VIDEO_TUTORIAL_SCRIPT_V1.md'
];

test('OPS1 guide and readiness contracts stay honest and bounded', async () => {
  const [guide, readiness] = await Promise.all([
    json('project/operator-guide-v1.json'),
    json('project/production-readiness-v1.json')
  ]);

  assert.equal(guide.repository, 'Pagebabe/comic');
  assert.equal(guide.trackingIssue, 95);
  assert.equal(guide.status, 'GUIDE_READY_FOR_PUBLIC_ACCEPTANCE');
  assert.equal(guide.route, '/studio/#guided');
  assert.equal(guide.chapters.length, 5);
  assert.equal(guide.concepts.length, 5);
  assert.equal(guide.acceptance.questions.length, 12);
  assert.equal(guide.acceptance.requiredScore, 12);
  assert.equal(guide.acceptance.humanObservationRequired, true);
  assert.equal(guide.claimBoundary.productionReady, false);
  assert.equal(guide.claimBoundary.beginnerReady, false);
  assert.equal(guide.claimBoundary.creativeApprovalGranted, false);
  assert.equal(guide.claimBoundary.imageGenerationAllowed, false);
  assert.equal(guide.claimBoundary.growthOsIntegrated, false);

  const steps = guide.chapters.flatMap((chapter) => chapter.steps);
  assert.equal(steps.length, 18);
  assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
  for (const step of steps) {
    assert.ok(step.title);
    assert.ok(step.mousePath);
    assert.ok(step.expected);
    assert.ok(step.stopRule);
  }

  assert.equal(readiness.repository, 'Pagebabe/comic');
  assert.equal(readiness.trackingIssue, 95);
  assert.equal(readiness.status, 'NOT_PRODUCTION_READY');
  assert.equal(readiness.gates.length, 10);
  assert.deepEqual(readiness.currentScore, {
    closedVerified: 2,
    partial: 6,
    open: 2,
    total: 10,
    display: '2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN'
  });
  assert.equal(readiness.gates.filter((gate) => gate.status === 'CLOSED_VERIFIED').length, 2);
  assert.equal(readiness.gates.filter((gate) => gate.status === 'PARTIAL').length, 6);
  assert.equal(readiness.gates.filter((gate) => gate.status === 'OPEN').length, 2);
  assert.equal(readiness.parallelLineBoundary.growthOsStatus, 'SHADOW_RELEASE_READY');
  assert.equal(readiness.parallelLineBoundary.liveReady, false);
  assert.equal(readiness.parallelLineBoundary.mainIntegrationAllowed, false);
});

test('operator manual is split into complete versioned chapters', async () => {
  for (const file of manualFiles) await access(new URL(file, root));
  const [index, start, setup, pipeline, qa, acceptance, video] = await Promise.all(manualFiles.map(read));

  for (const marker of ['Operator-Handbuch V1', '2/10 CLOSED_VERIFIED', 'Guided Mode', '10/10-Behauptung']) assert.match(index, new RegExp(marker));
  for (const marker of ['Die fünf Begriffe', 'EXECUTION BLOCKED', 'Growth OS']) assert.match(start, new RegExp(marker));
  for (const marker of ['File → Open Folder', 'npm --prefix studio-app ci', 'Tagesstart', 'Setup-Abnahme']) assert.match(setup, new RegExp(marker));
  for (const marker of ['CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'APPROVED_MASTER', 'EpisodePackage', 'HASH MATCH']) assert.match(pipeline, new RegExp(marker));
  for (const marker of ['Technische QA', 'Kreative QA', 'Provider fällt aus', 'Übergabe-Abnahme', 'SHADOW_RELEASE_READY']) assert.match(qa, new RegExp(marker));
  for (const marker of ['12/12', '10/10 PRODUCTION_READY', 'operator-acceptance', 'zweite Person']) assert.match(acceptance, new RegExp(marker));
  for (const marker of ['Gesamtlänge', 'Mausaktionen', 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE', 'Nur HASH MATCH = PASS', 'Anfänger-Abnahme']) assert.match(video, new RegExp(marker));
});

test('Studio exposes Guided Mode without granting production actions', async () => {
  const [app, guided, main, css] = await Promise.all([
    read('studio-app/src/App.tsx'),
    read('studio-app/src/GuidedMode.tsx'),
    read('studio-app/src/main.tsx'),
    read('studio-app/src/guided.css')
  ]);

  assert.match(app, /#guided/);
  assert.match(app, /GuidedMode/);
  assert.match(app, /Guided Mode öffnen/);
  assert.match(guided, /data-testid="guided-mode"/);
  assert.match(guided, /data-testid="guided-readiness"/);
  assert.match(guided, /data-testid="novice-acceptance"/);
  assert.match(guided, /completionStorageKey/);
  assert.match(guided, /Fortschritt zurücksetzen/);
  assert.match(guided, /keine Bildgenerierung/);
  assert.match(guided, /kreative Freigabe/);
  assert.match(main, /guided\.css/);
  assert.match(css, /guided-layout/);

  for (const forbidden of ['fetch("https://', "fetch('https://", 'canvas.getContext', 'WebSocket(', 'EventSource(', 'APPROVED_MASTER = true']) {
    assert.doesNotMatch(guided, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
