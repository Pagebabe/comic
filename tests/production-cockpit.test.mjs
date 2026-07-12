import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

const contract = JSON.parse(await read('project/production-cockpit-v1.json'));
const castCanon = JSON.parse(await read('project/cast-canon-v1.json'));
const appSource = await read('studio-app/src/App.tsx');
const componentSource = await read('studio-app/src/ProductionCockpit.tsx');
const cssSource = await read('studio-app/src/production-cockpit.css');

test('cockpit contract binds the real daily production route and canon gate', () => {
  assert.equal(contract.repository, 'Pagebabe/comic');
  assert.equal(contract.trackingIssue, 117);
  assert.equal(contract.status, 'WORKING_COCKPIT_V1');
  assert.equal(contract.route, '/studio/#cockpit');
  assert.deepEqual(contract.activeGate, {
    id: 'CANON-LOCK',
    trackingIssue: 117,
    title: '13-Figuren-Kanon und Asset-Inventar',
    status: 'CANON_LOCKED_ASSET_REVIEW_REQUIRED'
  });
  assert.equal(contract.currentTask.primaryHref, '#characters');
  assert.equal(contract.nextAllowedStep.decision, 'VERIFY_MISSING_CAST_ASSETS');
});

test('cockpit exposes six truthful work areas with one active gate', () => {
  assert.deepEqual(contract.sections.map((section) => section.id), ['characters', 'sets', 'voices', 'episode', 'review', 'export']);
  assert.equal(contract.sections.filter((section) => section.status === 'ACTIVE_REVIEW_GATE').length, 1);
  assert.equal(contract.sections.find((section) => section.id === 'characters')?.status, 'ACTIVE_REVIEW_GATE');
  assert.ok(contract.sections.every((section) => section.blocker.length > 0));
});

test('cockpit reports the actual cast and sheet inventory without false creative progress', () => {
  assert.equal(contract.counts.activeCanonCharacters, 13);
  assert.equal(contract.counts.variantCharacters, 4);
  assert.equal(contract.counts.productionSheetsAvailable, 9);
  assert.equal(contract.counts.productionSheetsMissing, 4);
  assert.equal(contract.counts.loraTrainingSheetsAvailable, 6);
  assert.equal(contract.counts.loraTrainingSheetsMissing, 7);
  assert.equal(contract.counts.trustedVisualMasters, 0);
  assert.equal(contract.counts.characterMastersApproved, 0);
  assert.equal(contract.counts.characterMastersRequired, 13);
  assert.equal(contract.counts.locationMastersApproved, 0);
  assert.equal(contract.counts.voiceMastersApproved, 0);
  assert.equal(contract.counts.reviewedEpisodes, 0);
  assert.ok(Object.values(contract.boundaries).every((value) => value === false));
});

test('cockpit counters remain consistent with the canonical cast source', () => {
  assert.equal(contract.counts.activeCanonCharacters, castCanon.counts.activeCanonCharacters);
  assert.equal(contract.counts.variantCharacters, castCanon.counts.variantCharacters);
  assert.equal(contract.counts.productionSheetsAvailable, castCanon.counts.productionSheetsAvailable);
  assert.equal(contract.counts.loraTrainingSheetsAvailable, castCanon.counts.loraTrainingSheetsAvailable);
  assert.equal(contract.counts.characterMastersRequired, castCanon.activeCast.length);
});

test('studio defaults to cockpit and loads both cockpit and cast contracts', () => {
  assert.match(appSource, /return 'cockpit';/);
  assert.match(appSource, /loadJson<ProductionCockpitContract>\('\.\.\/project\/production-cockpit-v1\.json'\)/);
  assert.match(appSource, /loadJson<CastCanonContract>\('\.\.\/project\/cast-canon-v1\.json'\)/);
  assert.match(appSource, /<ProductionCockpit contract=\{cockpit\} castCanon=\{castCanon\}/);
  assert.match(appSource, /Pilotvariante Ricco/);
  assert.match(appSource, /Expertenbereich/);
  assert.match(appSource, /#foundation/);
  assert.match(appSource, /#loop/);
  assert.match(appSource, /#pilot-fire-test/);
});

test('cockpit renders the 13-character inventory and marks the four variants', () => {
  assert.match(componentSource, /data-testid="cast-canon-inventory"/);
  assert.match(componentSource, /data-testid="variant-cast-inventory"/);
  assert.match(componentSource, /castCanon\.activeCast\.map/);
  assert.match(componentSource, /castCanon\.variantCast\.map/);
  assert.match(componentSource, /HAUPTKANON/);
  assert.match(componentSource, /Pilotvariante, nicht Hauptkanon/);
  assert.match(componentSource, /Produktionssheet/);
  assert.match(componentSource, /LoRA-Sheet/);
});

test('cockpit keeps execution boundaries closed and responsive', () => {
  assert.match(componentSource, /data-testid="production-cockpit"/);
  assert.match(componentSource, /data-testid="cockpit-current-task"/);
  assert.match(componentSource, /data-testid="cockpit-next-step"/);
  assert.match(componentSource, /data-testid="cockpit-boundaries"/);
  assert.equal((componentSource.match(/<button/g) || []).length, 0);
  assert.doesNotMatch(componentSource, /<img|<canvas|<iframe/i);
  assert.match(cssSource, /\.cast-grid/);
  assert.match(cssSource, /\.variant-strip/);
  assert.match(cssSource, /@media \(max-width: 980px\)/);
  assert.match(cssSource, /@media \(max-width: 640px\)/);
});
