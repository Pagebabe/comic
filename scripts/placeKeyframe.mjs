import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import shotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import template from '../src/data/manualKeyframeTemplate.json' assert { type: 'json' };

const root = process.cwd();
const [shotId, inputPath, ...flags] = process.argv.slice(2);
const allowReplace = flags.includes('--replace');

if (!shotId || !inputPath) {
  console.error('Usage: npm run place:keyframe -- ep001_tv_009 ./some-image.png');
  process.exit(1);
}

const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const sourcePath = inputPath.startsWith('/') ? inputPath : join(root, inputPath);
const extension = extname(sourcePath).toLowerCase();

if (!allowedExt.has(extension)) {
  console.error(`Unsupported image type: ${extension}`);
  process.exit(1);
}

if (!existsSync(sourcePath)) {
  console.error(`Source image not found: ${inputPath}`);
  process.exit(1);
}

const brief = shotBriefs.find((item) => item.tv_shot_id === shotId);
const review = tvReviewQueue.find((item) => item.tv_shot_id === shotId);
const targetPath = brief?.target_path ?? review?.asset_target;

if (!targetPath) {
  console.error(`No target path found for shot: ${shotId}`);
  process.exit(1);
}

const absoluteTarget = join(root, targetPath);
if (existsSync(absoluteTarget) && !allowReplace) {
  console.error(`Target already exists: ${targetPath}`);
  console.error('Pass --replace to intentionally replace it.');
  process.exit(1);
}

mkdirSync(dirname(absoluteTarget), { recursive: true });
copyFileSync(sourcePath, absoluteTarget);

const receiptPath = join(root, template.receipt_output);
mkdirSync(dirname(receiptPath), { recursive: true });
const existing = existsSync(receiptPath)
  ? JSON.parse(readFileSync(receiptPath, 'utf8'))
  : { episode_id: 'ep001', placements: [] };

const receipt = {
  id: `placement_${shotId}_${Date.now()}`,
  episode_id: 'ep001',
  tv_shot_id: shotId,
  scene_id: brief?.scene_id ?? review?.scene_id ?? null,
  title: brief?.title ?? review?.title ?? null,
  source_image: inputPath,
  target_path: targetPath,
  replaced_existing: allowReplace,
  placed_at: new Date().toISOString(),
  next_commands: [
    'npm run create:asset-intake',
    'npm run sync:asset-previews',
    'npm run create:review-summary',
    'npm run create:pipeline-overview'
  ]
};

existing.placements.push(receipt);
writeFileSync(receiptPath, JSON.stringify(existing, null, 2), 'utf8');

console.log(`placed ${shotId}`);
console.log(`target ${targetPath}`);
console.log(`receipt ${template.receipt_output}`);
