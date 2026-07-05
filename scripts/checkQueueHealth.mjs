import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import nextFixQueue from '../src/data/nextFixQueue.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import template from '../src/data/queueHealthTemplate.json' assert { type: 'json' };

const root = process.cwd();
const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));
const queueByShot = new Map(nextFixQueue.map((item) => [item.tv_shot_id, item]));

const queueItems = nextFixQueue.map((item) => {
  const review = reviewByShot.get(item.tv_shot_id);
  const stale = review?.status === 'approved';
  const missingReview = !review;
  return {
    id: item.id,
    priority: item.priority,
    tv_shot_id: item.tv_shot_id,
    title: item.title,
    type: item.type,
    review_status: review?.status ?? 'missing_review',
    stale,
    missing_review: missingReview,
    target_path: item.output_target
  };
});

const missingQueueItems = tvReviewQueue
  .filter((item) => item.status !== 'approved' && !queueByShot.has(item.tv_shot_id))
  .map((item) => ({
    tv_shot_id: item.tv_shot_id,
    scene_id: item.scene_id,
    title: item.title,
    review_status: item.status,
    asset_target: item.asset_target,
    recommended_queue_type: item.status === 'needs_fix' ? 'rebuild_keyframe' : 'create_keyframe'
  }));

const staleItems = queueItems.filter((item) => item.stale || item.missing_review);
const healthyItems = queueItems.filter((item) => !item.stale && !item.missing_review);

const report = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  ok: staleItems.length === 0 && missingQueueItems.length === 0,
  counts: {
    queue_total: queueItems.length,
    queue_healthy: healthyItems.length,
    queue_stale: staleItems.length,
    missing_queue_items: missingQueueItems.length
  },
  stale_items: staleItems,
  missing_queue_items: missingQueueItems,
  healthy_items: healthyItems,
  next_step: staleItems.length > 0
    ? 'Remove or update stale queue items.'
    : missingQueueItems.length > 0
      ? 'Add queue entries for open review items.'
      : 'Queue matches current review state.'
};

const outputPath = join(root, template.output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote ${template.output}`);
console.log(`Queue healthy: ${report.ok}`);
console.log(`Stale: ${staleItems.length}`);
console.log(`Missing queue items: ${missingQueueItems.length}`);
