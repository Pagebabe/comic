import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';

const root = process.cwd();
const reviewIndexPath = join(root, 'public', 'review', 'pilot', 'index.json');
const publicAssetRoot = join(root, 'public', 'assets', 'review', 'pilot');
const publicAssetIndexPath = join(publicAssetRoot, 'index.json');

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`Missing ${label}: ${path.replace(`${root}/`, '')}`);
    console.error('Run first: node scripts/publishPilotReviewForUi.mjs');
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8');
}

function cleanFileName(value, fallback = 'image.png') {
  return String(value || fallback).replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function findSourceImage(image, primaryImage) {
  const candidates = [
    image.estimatedPath,
    image.path,
    image.filePath,
    primaryImage,
    image.filename && image.subfolder ? join('outputs', image.subfolder, image.filename) : null,
    image.filename ? join('outputs', image.filename) : null
  ].filter(Boolean);

  for (const candidate of candidates) {
    const direct = join(root, String(candidate));
    if (existsSync(direct)) return direct;
  }

  return null;
}

function publicUrlFor(panelId, targetFile) {
  return `/assets/review/pilot/${panelId}/${basename(targetFile)}`;
}

const publicReviewIndex = readJson(reviewIndexPath, 'public review index');
const published = [];
const missing = [];
const updatedItems = [];

for (const item of Array.isArray(publicReviewIndex.items) ? publicReviewIndex.items : []) {
  const manifestPath = join(root, item.publicManifest.replace(/^\//, 'public/'));
  if (!existsSync(manifestPath)) {
    missing.push({ panelId: item.panelId, reason: 'missing_public_manifest', publicManifest: item.publicManifest });
    updatedItems.push(item);
    continue;
  }

  const manifest = readJson(manifestPath, 'public review manifest');
  const panelId = manifest.panelId ?? item.panelId;
  const panelAssetRoot = join(publicAssetRoot, panelId);
  mkdirSync(panelAssetRoot, { recursive: true });

  const images = Array.isArray(manifest.images) ? manifest.images : [];
  const enrichedImages = images.map((image, index) => {
    const sourcePath = findSourceImage(image, manifest.primaryImage);
    if (!sourcePath) {
      missing.push({ panelId, imageId: image.id ?? null, filename: image.filename ?? null, estimatedPath: image.estimatedPath ?? null, reason: 'source_image_not_found' });
      return image;
    }

    const originalName = image.filename ?? basename(sourcePath);
    const extension = extname(originalName) || '.png';
    const targetName = `${String(index + 1).padStart(2, '0')}-${cleanFileName(basename(originalName, extension))}${extension}`;
    const targetPath = join(panelAssetRoot, targetName);
    copyFileSync(sourcePath, targetPath);

    const publicUrl = publicUrlFor(panelId, targetPath);
    published.push({ panelId, sourcePath: sourcePath.replace(`${root}/`, ''), publicUrl });

    return {
      ...image,
      sourcePath: sourcePath.replace(`${root}/`, ''),
      publicUrl
    };
  });

  const primary = enrichedImages.find((image) => image.estimatedPath === manifest.primaryImage || image.sourcePath === manifest.primaryImage) ?? enrichedImages[0];
  const updatedManifest = {
    ...manifest,
    images: enrichedImages,
    primaryImagePublicUrl: primary?.publicUrl ?? null,
    assetPublishedAt: new Date().toISOString()
  };

  writeJson(manifestPath, updatedManifest);

  updatedItems.push({
    ...item,
    primaryImagePublicUrl: updatedManifest.primaryImagePublicUrl,
    publicAssetCount: enrichedImages.filter((image) => image.publicUrl).length
  });
}

const updatedReviewIndex = {
  ...publicReviewIndex,
  assetPublishedAt: new Date().toISOString(),
  items: updatedItems
};

writeJson(reviewIndexPath, updatedReviewIndex);
writeJson(publicAssetIndexPath, {
  id: 'pilot_review_asset_index',
  createdAt: new Date().toISOString(),
  sourceReviewIndex: '/review/pilot/index.json',
  publishedCount: published.length,
  missingCount: missing.length,
  published,
  missing
});

console.log('published public/assets/review/pilot/index.json');
console.log(`published images: ${published.length}`);
console.log(`missing images: ${missing.length}`);
