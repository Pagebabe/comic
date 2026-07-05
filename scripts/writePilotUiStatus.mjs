import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const outFile = join(root, 'public', 'health', 'pilot-ui-status.json');

const requiredFiles = [
  'scripts/refreshPilotUi.mjs',
  'scripts/createPilotProductionStatus.mjs',
  'scripts/publishPilotStatusForUi.mjs',
  'scripts/createPilotReviewManifests.mjs',
  'scripts/publishPilotReviewForUi.mjs',
  'scripts/publishPilotReviewAssetsForUi.mjs',
  'src/pages/StudioControlRoomV2.tsx',
  'src/pages/ReviewRoom.tsx',
  'src/pages/AssetGalleryRoom.tsx',
  'src/pages/PilotControlRoom.tsx',
  'src/pages/Review.tsx',
  'src/pages/AssetPreviewGallery.tsx'
];

const publicFiles = [
  'public/status/pilot-production-status.json',
  'public/review/pilot/index.json',
  'public/assets/review/pilot/index.json'
];

function readJson(relativePath) {
  const file = join(root, relativePath);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function statusFor(path, required) {
  const exists = existsSync(join(root, path));
  return { path, required, exists, status: exists ? 'ok' : required ? 'missing_required' : 'missing_optional' };
}

const required = requiredFiles.map((path) => statusFor(path, true));
const published = publicFiles.map((path) => statusFor(path, false));
const production = readJson('public/status/pilot-production-status.json');
const review = readJson('public/review/pilot/index.json');
const assets = readJson('public/assets/review/pilot/index.json');
const missingRequired = required.filter((item) => !item.exists);

const report = {
  id: 'pilot_ui_status',
  createdAt: new Date().toISOString(),
  ok: missingRequired.length === 0,
  missingRequired: missingRequired.length,
  required,
  published,
  stats: {
    panels: production?.panelCount ?? 0,
    productionCounts: production?.counts ?? {},
    reviewItems: review?.itemCount ?? 0,
    reviewSkipped: review?.skippedCount ?? 0,
    publishedAssets: assets?.publishedCount ?? 0,
    missingAssets: assets?.missingCount ?? 0
  },
  routes: ['#/pilot-control', '#/review', '#/asset-gallery', '#/studio-status'],
  refreshCommand: 'node scripts/refreshPilotUi.mjs',
  nextStep: missingRequired.length === 0 ? 'Refresh UI data and open the studio pages.' : 'Restore missing required files.'
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');

console.log('wrote public/health/pilot-ui-status.json');
console.log(`ok: ${report.ok}`);
console.log(`missing required: ${report.missingRequired}`);
