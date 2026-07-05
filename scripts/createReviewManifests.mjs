import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };

const root = process.cwd();
const reviewRoot = join(root, 'outputs', 'pilot', 'review');
const requestedSceneId = process.argv[2];

const items = requestedSceneId
  ? tvReviewQueue.filter((item) => item.scene_id === requestedSceneId)
  : tvReviewQueue;

if (requestedSceneId && items.length === 0) {
  console.error(`No review items found for scene id: ${requestedSceneId}`);
  process.exit(1);
}

const byScene = new Map();
for (const item of items) {
  if (!byScene.has(item.scene_id)) byScene.set(item.scene_id, []);
  byScene.get(item.scene_id).push(item);
}

for (const [sceneId, sceneItems] of byScene.entries()) {
  const sceneDir = join(reviewRoot, sceneId);
  mkdirSync(sceneDir, { recursive: true });

  const manifest = {
    episode_id: 'ep001',
    scene_id: sceneId,
    stage: 'tv_keyframe_review',
    counts: {
      approved: sceneItems.filter((item) => item.status === 'approved').length,
      needs_fix: sceneItems.filter((item) => item.status === 'needs_fix').length,
      queued: sceneItems.filter((item) => item.status === 'queued').length
    },
    items: sceneItems.map((item) => ({
      review_id: item.id,
      tv_shot_id: item.tv_shot_id,
      title: item.title,
      status: item.status,
      current_version: item.current_version,
      asset_target: item.asset_target,
      known_issue: item.known_issue,
      approval_checks: item.approval_checks,
      canon: item.status === 'approved'
    }))
  };

  const manifestPath = join(sceneDir, 'review.manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`wrote outputs/pilot/review/${sceneId}/review.manifest.json`);
}

console.log('\nReview manifests ready.');
