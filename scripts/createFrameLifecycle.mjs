import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import tvReviewQueue from '../src/data/tvReviewQueue.json' assert { type: 'json' };
import pilotShotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };

const root = process.cwd();
const outputPath = join(root, 'outputs', 'pilot', 'status', 'ep001_frame_lifecycle.json');

function readJson(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

const registry = readJson('outputs/pilot/candidates/ep001_frame_candidates.json');
const qa = readJson('outputs/pilot/qa/ep001_frame_qa.json');
const qaDecisions = readJson('outputs/pilot/qa/ep001_frame_qa_decisions.json');
const promotions = readJson('outputs/pilot/candidates/ep001_candidate_promotions.json');

const candidates = registry?.candidates ?? [];
const qaItems = qa?.qa_items ?? [];
const decisionItems = qaDecisions?.decisions ?? [];
const promotionItems = promotions?.promotions ?? [];
const reviewByShot = new Map(tvReviewQueue.map((item) => [item.tv_shot_id, item]));

function latest(items, dateField) {
  return items.slice().sort((a, b) => new Date(b[dateField] ?? 0).getTime() - new Date(a[dateField] ?? 0).getTime())[0] ?? null;
}

const rows = pilotShotBriefs.map((brief) => {
  const review = reviewByShot.get(brief.tv_shot_id);
  const shotCandidates = candidates.filter((item) => item.tv_shot_id === brief.tv_shot_id);
  const latestCandidate = latest(shotCandidates, 'created_at');
  const latestQa = latest(qaItems.filter((item) => item.tv_shot_id === brief.tv_shot_id), 'decided_at');
  const latestDecision = latest(decisionItems.filter((item) => item.tv_shot_id === brief.tv_shot_id), 'decided_at');
  const latestPromotion = latest(promotionItems.filter((item) => item.tv_shot_id === brief.tv_shot_id), 'promoted_at');
  const officialTarget = brief.target_path ?? review?.asset_target;
  const officialExists = officialTarget ? existsSync(join(root, officialTarget)) : false;

  let lifecycleStatus = 'brief_only';
  if (latestCandidate) lifecycleStatus = 'candidate_registered';
  if (latestQa) lifecycleStatus = 'qa_prepared';
  if (latestDecision?.decision) lifecycleStatus = `qa_${latestDecision.decision}`;
  if (latestPromotion) lifecycleStatus = 'promoted_to_keyframe';
  if (officialExists) lifecycleStatus = 'official_file_exists';
  if (review?.status === 'approved' && officialExists) lifecycleStatus = 'review_approved_ready';

  const blockers = [];
  if (!latestCandidate && review?.status !== 'approved') blockers.push('no_candidate');
  if (latestCandidate && !latestDecision) blockers.push('no_qa_decision');
  if (latestDecision?.decision === 'approved_candidate' && !latestPromotion) blockers.push('approved_candidate_not_promoted');
  if (review?.status === 'approved' && !officialExists) blockers.push('approved_but_file_missing');
  if (officialExists && review?.status !== 'approved') blockers.push('official_file_not_review_approved');

  return {
    tv_shot_id: brief.tv_shot_id,
    scene_id: brief.scene_id,
    title: brief.title,
    priority: brief.priority,
    review_status: review?.status ?? 'missing_review',
    lifecycle_status: lifecycleStatus,
    candidate_count: shotCandidates.length,
    latest_candidate_id: latestCandidate?.id ?? null,
    latest_candidate_status: latestCandidate?.status ?? null,
    latest_qa_decision: latestDecision?.decision ?? null,
    latest_qa_score: latestDecision?.score ?? null,
    promoted: Boolean(latestPromotion),
    official_target: officialTarget ?? null,
    official_exists: officialExists,
    blockers,
    next_command: blockers.includes('no_candidate')
      ? `npm run register:candidate -- ${brief.tv_shot_id} IMAGE_FILE --tool manual`
      : blockers.includes('no_qa_decision')
        ? `npm run qa:set -- ${brief.tv_shot_id} approved_candidate 80 "checked"`
        : blockers.includes('approved_candidate_not_promoted')
          ? `npm run promote:candidate -- ${brief.tv_shot_id}`
          : blockers.includes('official_file_not_review_approved')
            ? `npm run review:set -- approved ${brief.tv_shot_id} ${officialTarget} "approved"`
            : 'none'
  };
});

const readyRows = rows.filter((row) => row.lifecycle_status === 'review_approved_ready');
const blockedRows = rows.filter((row) => row.blockers.length > 0);
const report = {
  id: 'frame_lifecycle_v1',
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  counts: {
    total: rows.length,
    ready: readyRows.length,
    blocked: blockedRows.length,
    candidates: candidates.length,
    qa_decisions: decisionItems.length,
    promotions: promotionItems.length
  },
  next_item: blockedRows[0] ?? null,
  rows,
  next_step: blockedRows[0]
    ? `${blockedRows[0].tv_shot_id}: ${blockedRows[0].next_command}`
    : 'All tracked frames are ready.'
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
console.log('wrote outputs/pilot/status/ep001_frame_lifecycle.json');
console.log(`Ready: ${readyRows.length}/${rows.length}`);
console.log(`Blocked: ${blockedRows.length}`);
if (blockedRows[0]) console.log(`Next: ${blockedRows[0].next_command}`);
