import { readFile } from 'node:fs/promises';

const requiredFiles = {
  app: 'src/App.tsx',
  data: 'src/data/riccoStudio.ts',
  studio: 'src/pages/RiccoStudio.tsx',
  bulk: 'src/pages/RiccoBulkUpload.tsx',
  review: 'src/pages/RiccoImageReview.tsx',
  qa: 'src/pages/RiccoQA.tsx',
  export: 'src/pages/RiccoExport.tsx',
  lettering: 'src/pages/RiccoLettering.tsx',
  productionPackage: 'src/pages/RiccoPackage.tsx',
  restore: 'src/pages/RiccoImport.tsx',
  fixture: 'tests/fixtures/episode1-test-dataset.json'
};

const contents = Object.fromEntries(await Promise.all(
  Object.entries(requiredFiles).map(async ([key, file]) => [key, await readFile(file, 'utf8')])
));

for (const [key, value] of Object.entries(contents)) {
  if (/^(<{7}|={7}|>{7})/m.test(value)) throw new Error(`[EPISODE1_LINT:MERGE_MARKER] ${key}`);
  if (/\bTODO\s*:\s*(fake|simulate success)/i.test(value)) throw new Error(`[EPISODE1_LINT:FAKE_SUCCESS] ${key}`);
}

const checks = [
  [contents.app.includes("path: '/ricco-studio'"), 'Ricco Studio route missing'],
  [contents.app.includes("path: '/ricco-image-review'"), 'Image Review route missing'],
  [contents.app.includes("path: '/ricco-export'"), 'Export route missing'],
  [contents.app.includes("path: '/ricco-lettering'"), 'Lettering route missing'],
  [contents.app.includes("path: '/ricco-package'"), 'Package route missing'],
  [contents.app.includes("path: '/ricco-restore'"), 'Restore route missing'],
  [contents.data.includes("id: 'ep_001'"), 'Episode ep_001 missing'],
  [contents.data.includes("title: 'Das Zimmer'"), 'Episode title missing'],
  [contents.data.includes('panelCount: 8'), 'Eight-panel contract missing'],
  [contents.studio.includes('buildAllRiccoPanelPrompts'), 'Prompt builder missing'],
  [contents.bulk.includes("const STORAGE_KEY = 'ricco-studio-images-v1'"), 'Bulk storage contract missing'],
  [contents.review.includes('selectFinalImage'), 'Final-selection transition missing'],
  [contents.qa.includes("severity: 'blocker'"), 'Missing-image blocker missing'],
  [contents.export.includes("'Exportbereit'"), 'Export-ready state missing'],
  [contents.lettering.includes('window.print()'), 'Browser Print / PDF action missing'],
  [contents.productionPackage.includes("packageVersion: 'ricco-production-package-v1'"), 'Package version missing'],
  [contents.restore.includes('Bilder wiederherstellen'), 'Restore action missing']
];
for (const [passed, message] of checks) if (!passed) throw new Error(`[EPISODE1_LINT:CONTRACT] ${message}`);

const fixture = JSON.parse(contents.fixture);
if (fixture.episode?.id !== 'ep_001' || fixture.episode?.panelCount !== 8) throw new Error('[EPISODE1_LINT:FIXTURE] Episode contract drifted');
if (fixture.fixturePolicy?.creativeApproval !== false || fixture.fixturePolicy?.characterLock !== false) throw new Error('[EPISODE1_LINT:BOUNDARY] Test fixture crossed creative boundary');
if (fixture.fixturePolicy?.externalGenerationExecuted !== false) throw new Error('[EPISODE1_LINT:EXTERNAL] External generation must remain false');

console.log(JSON.stringify({
  status: 'pass',
  filesChecked: Object.keys(requiredFiles).length,
  episode: 'ep_001',
  panels: 8,
  creativeApproval: false,
  externalGeneration: false
}));
