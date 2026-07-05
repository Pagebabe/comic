import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import template from '../src/data/motionJobTemplate.json' assert { type: 'json' };

const root = process.cwd();
const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));

function getMotionStatus(reviewStatus) {
  return template.status_rules[reviewStatus] ?? 'blocked_unknown_review_state';
}

function getCameraMove(shot) {
  const text = [shot.camera, shot.action, shot.title].filter(Boolean).join(' ').toLowerCase();
  if (text.includes('push')) return 'slow_push_in';
  if (text.includes('pull')) return 'slow_pull_back';
  if (text.includes('close')) return 'subtle_hold_with_micro_drift';
  if (text.includes('wide')) return 'slow_room_hold';
  return 'gentle_handheld_cartoon_hold';
}

const jobs = tvShots.map((shot) => {
  const review = reviewByShot.get(shot.id);
  const reviewStatus = review?.status ?? 'missing_review';
  const status = getMotionStatus(reviewStatus);

  return {
    id: `motion_${shot.id}`,
    episode_id: shot.episode_id,
    scene_id: shot.scene_id,
    tv_shot_id: shot.id,
    title: shot.title,
    priority: shot.order ?? 999,
    status,
    review_status: reviewStatus,
    source_keyframe: review?.asset_target ?? null,
    duration_seconds: shot.duration_seconds,
    fps: template.defaults.fps,
    output_target: `outputs/pilot/motion/${shot.scene_id}/${shot.id}_motion_v1.mp4`,
    motion_plan: {
      camera_move: getCameraMove(shot),
      motion_strength: template.defaults.motion_strength,
      keep_character_shapes_locked: true,
      keep_background_text_free: true,
      avoid_face_morphing: true,
      style_lock: template.defaults.style_lock
    },
    prompt: `${shot.title}. ${shot.action ?? ''} Keep it as a subtle cartoon TV shot, stable characters, no readable text, no speech bubbles.`,
    blocked_reason: status.startsWith('blocked') ? `review_status:${reviewStatus}` : null,
    review_after_motion: template.defaults.review_after_motion
  };
});

const ready = jobs.filter((job) => job.status === 'queued_for_motion');
const blocked = jobs.filter((job) => job.status !== 'queued_for_motion');
const report = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: jobs.length,
  queued_for_motion: ready.length,
  blocked: blocked.length,
  jobs,
  next_step: ready.length > 0
    ? 'Create motion previews for queued jobs after confirming source keyframes exist.'
    : 'No motion jobs are ready yet. Finish keyframe review first.'
};

const outputPath = join(root, template.output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote ${template.output}`);
console.log(`Motion jobs: ${jobs.length}`);
console.log(`Queued: ${ready.length}`);
console.log(`Blocked: ${blocked.length}`);
