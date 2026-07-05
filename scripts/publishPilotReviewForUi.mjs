import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'outputs', 'review', 'pilot');
const sourceIndexPath = join(sourceRoot, 'index.json');
const targetRoot = join(root, 'public', 'review', 'pilot');
const targetManifestRoot = join(targetRoot, 'manifests');
const targetIndexPath = join(targetRoot, 'index.json');
const targetRawIndexPath = join(targetRoot, 'source-index.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/createPilotReviewManifests.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function manifestSourceForItem(item) {
  const declared = item.manifestFile ?? item.path ?? item.manifestPath;
  if (declared) return join(root, declared);
  if (item.panelId) return join(sourceRoot, `${item.panelId}.json`);
  return null;
}

function panelIdFromManifest(manifest, fallback) {
  return manifest.panelId ?? fallback ?? basename(manifest.id ?? 'panel_unknown', '.json');
}

const sourceIndex = readJson(sourceIndexPath, 'review manifest index');
const sourceItems = Array.isArray(sourceIndex.items) ? sourceIndex.items : [];
const publicItems = [];
const skipped = [];

mkdirSync(targetManifestRoot, { recursive: true });
copyFileSync(sourceIndexPath, targetRawIndexPath);

for (const item of sourceItems) {
  const sourcePath = manifestSourceForItem(item);
  if (!sourcePath || !existsSync(sourcePath)) {
    skipped.push({ item, reason: 'missing_manifest_file' });
    continue;
  }

  const manifest = readJson(sourcePath, 'review manifest');
  const panelId = panelIdFromManifest(manifest, item.panelId);
  const publicFileName = `${panelId}.json`;
  const publicPath = join(targetManifestRoot, publicFileName);
  copyFileSync(sourcePath, publicPath);

  publicItems.push({
    panelId,
    status: manifest.status ?? item.status ?? 'unknown',
    decision: manifest.decision ?? item.decision ?? null,
    primaryImage: manifest.primaryImage ?? item.primaryImage ?? null,
    imageCount: Array.isArray(manifest.images) ? manifest.images.length : 0,
    checkCount: Array.isArray(manifest.checks) ? manifest.checks.length : 0,
    latestFixJobId: manifest.latestFix?.sourceFixJobId ?? item.latestFixJobId ?? null,
    sourceManifest: sourcePath.replace(`${root}/`, ''),
    publicManifest: `/review/pilot/manifests/${publicFileName}`
  });
}

const publicIndex = {
  id: 'pilot_public_review_index',
  createdAt: new Date().toISOString(),
  sourceIndex: 'outputs/review/pilot/index.json',
  itemCount: publicItems.length,
  skippedCount: skipped.length,
  items: publicItems,
  skipped,
  nextStep: 'Open #/review and select a panel manifest.'
};

mkdirSync(dirname(targetIndexPath), { recursive: true });
writeFileSync(targetIndexPath, JSON.stringify(publicIndex, null, 2), 'utf8');

console.log('published public/review/pilot/index.json');
console.log('published public/review/pilot/source-index.json');
console.log(`published manifests: ${publicItems.length}`);
console.log(`skipped: ${skipped.length}`);
