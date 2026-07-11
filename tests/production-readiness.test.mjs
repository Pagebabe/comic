import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const json = async (path) => JSON.parse(await read(path));

test('production readiness remains honest and measurable', async () => {
  const [readiness, status] = await Promise.all([
    json('project/production-readiness-v1.json'),
    json('project/production-academy-status.json')
  ]);

  assert.equal(readiness.schemaVersion, 2);
  assert.equal(readiness.repository, 'Pagebabe/comic');
  assert.equal(readiness.trackingIssue, 95);
  assert.equal(readiness.status, 'NOT_PRODUCTION_READY');
  assert.deepEqual(readiness.currentScore, {
    closedVerified: 2,
    partial: 7,
    open: 1,
    total: 10,
    display: '2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN'
  });
  assert.equal(readiness.gates.length, 10);
  assert.equal(readiness.gates.filter((gate) => gate.status === 'CLOSED_VERIFIED').length, 2);
  assert.equal(readiness.gates.filter((gate) => gate.status === 'PARTIAL').length, 7);
  assert.equal(readiness.gates.filter((gate) => gate.status === 'OPEN').length, 1);
  assert.equal(readiness.gates.find((gate) => gate.id === 'PR10').status, 'OPEN');
  assert.equal(readiness.academyBoundary.productionReady, false);
  assert.equal(readiness.academyBoundary.beginnerReady, false);
  assert.equal(readiness.academyBoundary.creativeApprovalGranted, false);
  assert.equal(readiness.academyBoundary.imageGenerationAllowed, false);
  assert.equal(readiness.academyBoundary.growthOsIntegrated, false);
  assert.equal(readiness.parallelLineBoundary.liveReady, false);
  assert.equal(readiness.parallelLineBoundary.mainIntegrationAllowed, false);
  assert.equal(readiness.parallelLineBoundary.sharedIntegrationSmokePassed, false);

  assert.equal(status.schemaVersion, 2);
  assert.equal(status.status, 'proven_guided_training_ready_novice_acceptance_open');
  assert.equal(status.readiness.status, 'NOT_PRODUCTION_READY');
  assert.equal(status.readiness.score, readiness.currentScore.display);
  assert.equal(status.readiness.productionReady, false);
  assert.equal(status.readiness.beginnerReady, false);
  assert.equal(status.readiness.observedNoviceRunPassed, false);
  assert.equal(status.readiness.completeReviewedEpisodeExists, false);
  assert.equal(status.claimBoundary.academyTechnicallyProven, true);
  assert.equal(status.claimBoundary.academyBeginnerReadyClaimAllowed, false);
  assert.equal(status.claimBoundary.productionReadyClaimAllowed, false);
});

test('novice acceptance template requires a real observed run', async () => {
  const record = await json('project/novice-acceptance-template.json');
  assert.equal(record.status, 'TEMPLATE_NOT_EXECUTED');
  assert.equal(record.requiredScore, 12);
  assert.equal(record.humanObservationRequired, true);
  assert.equal(record.tasks.length, 12);
  assert.equal(new Set(record.tasks.map((task) => task.id)).size, 12);
  assert.equal(record.result.passedTasks, 0);
  assert.equal(record.result.score, 0);
  assert.equal(record.result.decision, 'NOT_EXECUTED');
  assert.equal(record.environment.testedCommit, null);
  assert.match(record.closureRule, /second person/);
});

test('Academy exposes readiness and acceptance without a second onboarding system', async () => {
  const [app, component, css, protocol] = await Promise.all([
    read('studio-app/src/App.tsx'),
    read('studio-app/src/AcademyReadiness.tsx'),
    read('studio-app/src/academy-readiness.css'),
    read('docs/NOVICE_ACCEPTANCE_PROTOCOL.md')
  ]);

  assert.match(app, /AcademyReadiness/);
  assert.match(app, /2\/10 READINESS CLOSED/);
  assert.match(app, /Anfänger-Abnahme offen/);
  assert.match(component, /data-testid="academy-readiness"/);
  assert.match(component, /data-testid="academy-readiness-gates"/);
  assert.match(component, /data-testid="academy-novice-acceptance"/);
  assert.match(component, /10\/10 erst bei zehnmal CLOSED_VERIFIED/);
  assert.match(component, /Growth OS bleibt isoliert/);
  assert.match(css, /academy-readiness-grid/);
  assert.match(protocol, /12\/12 ohne undokumentierte Hilfe/);
  assert.match(protocol, /10\/10 PRODUCTION_READY/);
  assert.match(protocol, /keine Character-, Location- oder Voice-Master/);

  for (const forbidden of ['beginnerReady: true', 'productionReady: true', 'imageGenerationAllowed: true', 'creativeApprovalGranted: true']) {
    assert.doesNotMatch(component, new RegExp(forbidden));
  }
});

test('required readiness files are present', async () => {
  for (const file of [
    'project/production-readiness-v1.json',
    'project/novice-acceptance-template.json',
    'docs/NOVICE_ACCEPTANCE_PROTOCOL.md',
    'studio-app/src/AcademyReadiness.tsx',
    'studio-app/src/academy-readiness.css'
  ]) await access(new URL(file, root));
});
