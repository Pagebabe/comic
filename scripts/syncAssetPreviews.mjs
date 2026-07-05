import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import syncTemplate from '../src/data/assetPreviewSyncTemplate.json' assert { type: 'json' };

const root = process.cwd();
const intakePath = join(root, syncTemplate.source);
const publicRoot = join(root, syncTemplate.public_root);
const manifestPath = join(root, syncTemplate.manifest_output);

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Missing file: ${path.replace(`${root}/`, '')}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

const intakeReport = readJson(intakePath);
const items = intakeReport.intake ?? [];
mkdirSync(publicRoot, { recursive: true });

const previews = items.map((item) => {
  const sourcePath = item.asset_path ? join(root, item.asset_path) : null;
  const filename = item.asset_path ? basename(item.asset_path) : `${item.tv_shot_id}_missing.png`;
  const publicPath = `previews/pilot/${filename}`;
  const targetPath = join(publicRoot, filename);
  const exists = Boolean(sourcePath && existsSync(sourcePath));

  if (exists && sourcePath) {
    copyFileSync(sourcePath, targetPath);
  }

  return {
    tv_shot_id: item.tv_shot_id,
    scene_id: item.scene_id,
    job_id: item.job_id,
    status: item.status,
    source_asset_path: item.asset_path,
    preview_path: `/${publicPath}`,
    preview_available: exists,
    review_target: item.review_target
  };
});

const manifest = {
  id: syncTemplate.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: previews.length,
  preview_available: previews.filter((item) => item.preview_available).length,
  preview_missing: previews.filter((item) => !item.preview_available).length,
  previews
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`wrote ${syncTemplate.manifest_output}`);
console.log(`Preview available: ${manifest.preview_available}`);
console.log(`Preview missing: ${manifest.preview_missing}`);
