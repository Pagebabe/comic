import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

const contract = JSON.parse(await read('project/production-cockpit-v1.json'));
const castCanon = JSON.parse(await read('project/cast-canon-v1.json'));
const appSource = await read('studio-app/src/App.tsx');
const componentSource = await read('studio-app/src/ProductionCockpit.tsx');
const cssSource = await read('studio-app/src/production-cockpit.css');

test('cockpit binds LR5.1 and preserves Das Zimmer production truth', () => {
  assert.equal(contract.repository, 'Pagebabe/comic');
  assert.equal(contract.trackingIssue, 117);
  assert.equal(contract.status, 'WORKING_COCKPIT_V1');
  assert.equal(contract.route, '/studio/#cockpit');
  assert.deepEqual(contract.activeGate, {
    id: 'LR5.1',
    trackingIssue: 88,
    title: 'Ricco Visual-Master-Vertrag und aktiver Pilotcast',
    status: 'CONTRACT_READY_REVIEW_REQUIRED'
  });
  assert.equal(contract.currentTask.primaryHref, '#characters');
  assert.equal(contract.nextAllowedStep.decision, 'CONTRACT_APPROVED_FOR_ONE_CANDIDATE');
});

test('cockpit exposes six truthful work areas with one active review gate', () => {
  assert.deepEqual(contract.sections.map((section) => section.id), ['characters', 'sets', 'voices', 'episode', 'review', 'export']);
  assert.equal(contract.sections.filter((section) => section.status === 'ACTIVE_REVIEW_GATE').length, 1);
  assert.equal(contract.sections.find((section) => section.id === 'characters')?.status, 'ACTIVE_REVIEW_GATE');
  assert.ok(contract.sections.every((section) => section.blocker.length > 0));
});

test('cockpit separates 13 series records from four active pilot characters', () => {
  assert.equal(contract.counts.seriesUniverseCharacters, 13);
  assert.equal(contract.counts.activePilotCastCharacters, 4);
  assert.equal(contract.counts.legacyAssetInventoryCharacters, 13);
  assert.equal(contract.counts.productionSheetsAvailable, 9);
  assert.equal(contract.counts.productionSheetsMissing, 4);
  assert.equal(contract.counts.loraTrainingSheetsAvailable, 6);
  assert.equal(contract.counts.loraTrainingSheetsMissing, 7);
  assert.equal(contract.counts.verifiedReferenceImages, 0);
  assert.equal(contract.counts.approvedVisualMasters, 0);
  assert.equal(contract.counts.characterMastersApproved, 0);
  assert.equal(contract.counts.characterMastersRequired, 4);
  assert.equal(contract.counts.locationMastersApproved, 0);
  assert.equal(contract.counts.voiceMastersApproved, 0);
  assert.equal(contract.counts.reviewedEpisodes, 0);
  assert.ok(Object.values(contract.boundaries).every((value) => value === false));
});

test('cockpit counters remain consistent with the separated canon source', () => {
  assert.equal(contract.counts.seriesUniverseCharacters, castCanon.counts.seriesUniverseCharacters);
  assert.equal(contract.counts.activePilotCastCharacters, castCanon.counts.activePilotCastCharacters);
  assert.equal(contract.counts.legacyAssetInventoryCharacters, castCanon.legacyAssetInventory.characterCount);
  assert.equal(contract.counts.characterMastersRequired, castCanon.activePilotCast.length);
  assert.equal(castCanon.approvedVisualMasters.length, 0);
});

test('studio defaults to cockpit and keeps production and expert routes', () => {
  assert.match(appSource, /return 'cockpit';/);
  assert.match(appSource, /loadJson<ProductionCockpitContract>\('\.\.\/project\/production-cockpit-v1\.json'\)/);
  assert.match(appSource, /loadJson<CastCanonContract>\('\.\.\/project\/cast-canon-v1\.json'\)/);
  assert.match(appSource, /<ProductionCockpit contract=\{cockpit\} castCanon=\{castCanon\}/);
  assert.match(appSource, /Aktiver Pilotcast Ricco/);
  assert.match(appSource, /Expertenbereich/);
  assert.match(appSource, /#foundation/);
  assert.match(appSource, /#loop/);
  assert.match(appSource, /#pilot-fire-test/);
});

test('cockpit renders series universe, active pilot cast and legacy inventory separately', () => {
  assert.match(componentSource, /data-testid="series-universe-inventory"/);
  assert.match(componentSource, /data-testid="active-pilot-cast-inventory"/);
  assert.match(componentSource, /data-testid="legacy-asset-inventory"/);
  assert.match(componentSource, /castCanon\.seriesUniverse\.map/);
  assert.match(componentSource, /castCanon\.activePilotCast\.map/);
  assert.match(componentSource, /SERIENUNIVERSUM/);
  assert.match(componentSource, /AKTIVER PILOTCAST/);
  assert.match(componentSource, /LEGACY- UND ASSETBESTAND/);
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
