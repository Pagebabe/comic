import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

const contract = JSON.parse(await read('project/production-cockpit-v1.json'));
const appSource = await read('studio-app/src/App.tsx');
const componentSource = await read('studio-app/src/ProductionCockpit.tsx');
const cssSource = await read('studio-app/src/production-cockpit.css');

test('cockpit contract binds the real daily production route', () => {
  assert.equal(contract.repository, 'Pagebabe/comic');
  assert.equal(contract.trackingIssue, 117);
  assert.equal(contract.status, 'WORKING_COCKPIT_V1');
  assert.equal(contract.route, '/studio/#cockpit');
  assert.deepEqual(contract.activeGate, {
    id: 'LR5.1',
    trackingIssue: 88,
    title: 'Ricco Visual-Master-Vertrag und erster Review-Kandidat',
    status: 'CONTRACT_READY_REVIEW_REQUIRED'
  });
  assert.equal(contract.currentTask.primaryHref, '#lr5-ricco');
  assert.equal(contract.nextAllowedStep.decision, 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE');
});

test('cockpit exposes six truthful work areas with one active gate', () => {
  assert.deepEqual(contract.sections.map((section) => section.id), ['characters', 'sets', 'voices', 'episode', 'review', 'export']);
  assert.equal(contract.sections.filter((section) => section.status === 'ACTIVE_REVIEW_GATE').length, 1);
  assert.equal(contract.sections.find((section) => section.id === 'characters')?.status, 'ACTIVE_REVIEW_GATE');
  assert.ok(contract.sections.every((section) => section.blocker.length > 0));
});

test('cockpit preserves zero creative progress and closed execution boundaries', () => {
  assert.equal(contract.counts.characterMastersApproved, 0);
  assert.equal(contract.counts.locationMastersApproved, 0);
  assert.equal(contract.counts.voiceMastersApproved, 0);
  assert.equal(contract.counts.riccoCandidates, 0);
  assert.equal(contract.counts.reviewedEpisodes, 0);
  assert.equal(contract.counts.characterMastersRequired, 4);
  assert.equal(contract.counts.locationMastersRequired, 4);
  assert.equal(contract.counts.voiceMastersRequired, 3);
  assert.equal(contract.counts.riccoCandidateLimit, 1);
  assert.ok(Object.values(contract.boundaries).every((value) => value === false));
});

test('studio defaults to cockpit and keeps proof in expert area', () => {
  assert.match(appSource, /return 'cockpit';/);
  assert.match(appSource, /loadJson<ProductionCockpitContract>\('\.\.\/project\/production-cockpit-v1\.json'\)/);
  assert.match(appSource, /<ProductionCockpit contract=\{cockpit\}/);
  assert.match(appSource, /Expertenbereich/);
  assert.match(appSource, /#foundation/);
  assert.match(appSource, /#loop/);
  assert.match(appSource, /#pilot-fire-test/);
});

test('cockpit V1 has no hidden execution or media surfaces', () => {
  assert.match(componentSource, /data-testid="production-cockpit"/);
  assert.match(componentSource, /data-testid="cockpit-current-task"/);
  assert.match(componentSource, /data-testid="cockpit-next-step"/);
  assert.match(componentSource, /data-testid="cockpit-boundaries"/);
  assert.equal((componentSource.match(/<button/g) || []).length, 0);
  assert.doesNotMatch(componentSource, /<img|<canvas|<iframe/i);
  assert.match(cssSource, /@media \(max-width: 980px\)/);
  assert.match(cssSource, /@media \(max-width: 640px\)/);
});
