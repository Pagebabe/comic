import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import tvShots from '../src/data/tvShots.json' assert { type: 'json' };
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import nextFixQueue from '../src/data/nextFixQueue.json' assert { type: 'json' };
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };

const root = process.cwd();
const outputPath = join(root, 'outputs', 'pilot', 'status', 'ep001_episode_state.json');

function readJson(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) return null;
  try {
    return JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    return null;
  }
}

const registry = readJson('outputs/pilot/candidates/ep001_frame_candidates.json');
const qaDecisions = readJson('outputs/pilot/qa/ep001_frame_qa_decisions.json');
const promotions = readJson('outputs/pilot/candidates/ep001_candidate_promotions.json');
const lifecycle = readJson('outputs/pilot/status/ep001_frame_lifecycle.json');
const studioNext = readJson('outputs/pilot/status/ep001_studio_next.json');
const pipelineOverview = readJson('outputs/pilot/status/ep001_pipeline_overview.json');
const reviewSummary = readJson('outputs/pilot/status/ep001_review_summary.json');
const motionJobs = readJson('outputs/pilot/jobs/motion/ep001_motion_jobs.json');

const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));
const fixByShot = new Map(nextFixQueue.map((item) => [item.tv_shot_id, item]));
const briefByShot = new Map(pilotShotBriefs.map((item) => [item.tv_shot_id, item]));
const lifecycleByShot = new Map((lifecycle?.rows ?? []).map((item) => [item.tv_shot_id, item]));
const motionByShot = new Map((motionJobs?.jobs ?? []).map((item) => [item.tv_shot_id, item]));

function latest(items, dateField) {
  return items.slice().sort((a, b) => new Date(b[dateField] ?? 0).getTime() - new Date(a[dateField] ?? 0).getTime())[0] ?? null;
}

const candidates = registry?.candidates ?? [];
const decisions = qaDecisions?.decisions ?? [];
const promotionItems = promotions?.promotions ?? [];

const shots = tvShots.map((shot) => {
  const review = reviewByShot.get(shot.id);
  const fix = fixByShot.get(shot.id);
  const brief = briefByShot.get(shot.id);
  const life = lifecycleByShot.get(shot.id);
  const motion = motionByShot.get(shot.id);
  const shotCandidates = candidates.filter((item) => item.tv_shot_id === shot.id);
  const latestCandidate = latest(shotCandidates, 'created_at');
  const latestDecision = latest(decisions.filter((item) => item.tv_shot_id === shot.id), 'decided_at');
  const latestPromotion = latest(promotionItems.filter((item) => item.tv_shot_id === shot.id), 'promoted_at');
  const assetTarget = review?.asset_target ?? brief?.target_path ?? null;
  const assetExists = assetTarget ? existsSync(join(root, assetTarget)) : false;

  const blockers = [];
  if (review?.status !== 'approved') blockers.push(`review:${review?.status ?? 'missing'}`);
  if (!assetExists) blockers.push('asset_missing');
  if (fix) blockers.push(`fix_queue:${fix.id}`);
  if (life?.blockers?.length) blockers.push(...life.blockers.map((item) => `lifecycle:${item}`));

  const readyForMotion = review?.status === 'approved' && assetExists;
  const readyForAssembly = readyForMotion && motion?.status === 'queued_for_motion';

  return {
    id: shot.id,
    episode_id: shot.episode_id,
    scene_id: shot.scene_id,
    title: shot.title,
    order: shot.order,
    duration_seconds: shot.duration_seconds,
    review: {
      status: review?.status ?? 'missing_review',
      current_version: review?.current_version ?? null,
      asset_target: assetTarget,
      asset_exists: assetExists,
      known_issue: review?.known_issue ?? null
    },
    frame: {
      lifecycle_status: life?.lifecycle_status ?? 'unknown',
      candidate_count: shotCandidates.length,
      latest_candidate_id: latestCandidate?.id ?? null,
      latest_candidate_status: latestCandidate?.status ?? null,
      latest_qa_decision: latestDecision?.decision ?? null,
      latest_qa_score: latestDecision?.score ?? null,
      promoted: Boolean(latestPromotion),
      official_exists: assetExists
    },
    fix_queue: fix ? {
      id: fix.id,
      priority: fix.priority,
      type: fix.type,
      title: fix.title,
      output_target: fix.output_target
    } : null,
    motion: motion ? {
      status: motion.status,
      output_target: motion.output_target,
      camera_move: motion.motion_plan?.camera_move ?? null
    } : null,
    readiness: {
      ready_for_motion: readyForMotion,
      ready_for_assembly: readyForAssembly,
      blockers
    },
    next_command: life?.next_command ?? fix?.instruction ?? null
  };
});

const counts = {
  shots_total: shots.length,
  review_approved: shots.filter((shot) => shot.review.status === 'approved').length,
  assets_present: shots.filter((shot) => shot.review.asset_exists).length,
  candidates: candidates.length,
  qa_decisions: decisions.length,
  promotions: promotionItems.length,
  ready_for_motion: shots.filter((shot) => shot.readiness.ready_for_motion).length,
  ready_for_assembly: shots.filter((shot) => shot.readiness.ready_for_assembly).length,
  blocked: shots.filter((shot) => shot.readiness.blockers.length > 0).length
};

const nextShot = shots.find((shot) => shot.readiness.blockers.length > 0) ?? null;

const state = {
  id: 'episode_state_v1',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  counts,
  overall_status: counts.ready_for_assembly === shots.length ? 'assembly_ready' : 'in_production',
  current_step: studioNext?.current_step ?? null,
  pipeline_status: pipelineOverview?.status ?? null,
  review_counts: reviewSummary?.counts ?? null,
  next_shot: nextShot ? {
    id: nextShot.id,
    title: nextShot.title,
    blockers: nextShot.readiness.blockers,
    next_command: nextShot.next_command
  } : null,
  shots
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(state, null, 2), 'utf8');
console.log('wrote outputs/pilot/status/ep001_episode_state.json');
console.log(`Approved: ${counts.review_approved}/${counts.shots_total}`);
console.log(`Assets: ${counts.assets_present}/${counts.shots_total}`);
console.log(`Blocked: ${counts.blocked}`);
if (state.next_shot) console.log(`Next: ${state.next_shot.id} ${state.next_shot.next_command ?? ''}`);
